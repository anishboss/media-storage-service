import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import {
  IStorageService,
  UploadInput,
  UploadResult,
  PresignedUploadResponse,
  StreamResult,
  StorageItem,
  StorageStats,
} from './storage.interface.js';
import { detectCategory, formatBytes, MediaCategory } from '../utils/media-type.util.js';

export interface S3StorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export class S3StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;

    const s3ClientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    };

    // If custom endpoint is provided (e.g., MinIO http://127.0.0.1:9000 or Cloudflare R2),
    // set it. When moving to AWS S3, leaving endpoint empty automatically routes to AWS S3.
    if (config.endpoint && config.endpoint.trim() !== '') {
      s3ClientConfig.endpoint = config.endpoint;
    }

    this.client = new S3Client(s3ClientConfig);
  }

  /**
   * Ensures the target bucket exists.
   * Creates the bucket automatically if running on MinIO or development S3.
   */
  async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error: unknown) {
      const err = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
        message?: string;
      };
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        console.log(`Bucket "${this.bucket}" does not exist. Creating bucket...`);
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`Bucket "${this.bucket}" created successfully.`);
      } else {
        console.warn(`Warning when checking bucket "${this.bucket}":`, err.message);
      }
    }
  }

  /**
   * Uploads a video file or stream using AWS SDK multipart upload.
   * This streams large video files without keeping the entire file in Node memory.
   */
  async upload(input: UploadInput): Promise<UploadResult> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        Metadata: input.metadata,
      },
      // 5MB part size for multipart chunking (S3 standard minimum)
      partSize: 5 * 1024 * 1024,
      queueSize: 4, // Concurrent upload streams
    });

    const result = await upload.done();

    return {
      key: input.key,
      location: result.Location,
      bucket: this.bucket,
      eTag: result.ETag,
      contentType: input.contentType,
    };
  }

  /**
   * Generates a pre-signed PUT URL.
   * The client (browser/mobile) can upload the video directly to MinIO or AWS S3,
   * completely bypassing the Node.js server.
   */
  async getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number = 3600
  ): Promise<PresignedUploadResponse> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      key,
      bucket: this.bucket,
      expiresInSeconds,
    };
  }

  /**
   * Generates a pre-signed GET URL for secure video playback/download.
   */
  async getDownloadPresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Fetches an object stream from storage, supporting HTTP Range requests.
   * This is critical for HTML5 video streaming (enables playback seeking and chunked delivery).
   */
  async getObjectStream(key: string, range?: string): Promise<StreamResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Range: range,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Object body is empty for key: ${key}`);
    }

    return {
      stream: response.Body as Readable,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      contentRange: response.ContentRange,
      acceptRanges: response.AcceptRanges,
    };
  }

  /**
   * Deletes an object by key.
   */
  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  /**
   * Lists video objects in the bucket.
   */
  async list(prefix?: string): Promise<StorageItem[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);

    return (response.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size,
      lastModified: item.LastModified,
    }));
  }

  /**
   * Retrieves aggregated storage statistics: total objects, total bytes, and breakdown by media category.
   * Handles pagination automatically across large buckets.
   */
  async getStats(prefix?: string): Promise<StorageStats> {
    const categories: Record<MediaCategory, { count: number; bytes: number }> = {
      images: { count: 0, bytes: 0 },
      videos: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      documents: { count: 0, bytes: 0 },
      files: { count: 0, bytes: 0 },
    };

    let totalObjects = 0;
    let totalBytes = 0;
    let continuationToken: string | undefined = undefined;

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);
      const items = response.Contents || [];

      for (const item of items) {
        if (!item.Key) continue;
        const size = item.Size || 0;
        totalObjects += 1;
        totalBytes += size;

        const category = detectCategory(undefined, item.Key);
        categories[category].count += 1;
        categories[category].bytes += size;
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return {
      totalObjects,
      totalBytes,
      totalFormattedSize: formatBytes(totalBytes),
      categories: {
        images: {
          count: categories.images.count,
          bytes: categories.images.bytes,
          formattedSize: formatBytes(categories.images.bytes),
        },
        videos: {
          count: categories.videos.count,
          bytes: categories.videos.bytes,
          formattedSize: formatBytes(categories.videos.bytes),
        },
        audio: {
          count: categories.audio.count,
          bytes: categories.audio.bytes,
          formattedSize: formatBytes(categories.audio.bytes),
        },
        documents: {
          count: categories.documents.count,
          bytes: categories.documents.bytes,
          formattedSize: formatBytes(categories.documents.bytes),
        },
        files: {
          count: categories.files.count,
          bytes: categories.files.bytes,
          formattedSize: formatBytes(categories.files.bytes),
        },
      },
    };
  }
}

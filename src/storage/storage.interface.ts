import { Readable } from 'stream';
import type { MediaCategory } from '../utils/media-type.util.js';

export interface StorageConfig {
  provider?: 's3' | 'minio' | 'aws' | string;
  bucket: string;
  endpoint?: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export interface UploadInput {
  key: string;
  body: Buffer | Readable;
  contentType: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  location?: string;
  bucket: string;
  eTag?: string;
  contentType: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  bucket: string;
  expiresInSeconds: number;
}

export interface StreamResult {
  stream: Readable;
  contentLength?: number;
  contentType?: string;
  contentRange?: string;
  acceptRanges?: string;
}

export interface StorageItem {
  key: string;
  size?: number;
  lastModified?: Date;
  contentType?: string;
}

export interface StorageCategoryStats {
  count: number;
  bytes: number;
  formattedSize: string;
}

export interface StorageStats {
  totalObjects: number;
  totalBytes: number;
  totalFormattedSize: string;
  categories: Record<MediaCategory, StorageCategoryStats>;
}

/**
 * Storage Service Interface
 * All storage implementations (S3, MinIO, Azure Blob, Google Cloud Storage, Local Disk)
 * adhere to this exact interface.
 */
export interface IStorageService {
  ensureBucketExists(): Promise<void>;
  upload(input: UploadInput): Promise<UploadResult>;
  getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number
  ): Promise<PresignedUploadResponse>;
  getDownloadPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getObjectStream(key: string, range?: string): Promise<StreamResult>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageItem[]>;
  getStats(prefix?: string): Promise<StorageStats>;
}

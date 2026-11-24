import { Readable } from 'stream';

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

/**
 * Storage Service Interface
 * All storage implementations (S3, MinIO, Azure Blob, Google Cloud Storage, Local Disk)
 * adhere to this exact interface. Business controllers ONLY consume this interface,
 * ensuring complete decoupling from specific cloud providers.
 */
export interface IStorageService {
  ensureBucketExists(): Promise<void>;
  upload(input: UploadInput): Promise<UploadResult>;
  getUploadPresignedUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUploadResponse>;
  getDownloadPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getObjectStream(key: string, range?: string): Promise<StreamResult>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageItem[]>;
}

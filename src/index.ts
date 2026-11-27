// Core Storage Interface and Types
export type {
  IStorageService,
  StorageConfig,
  UploadInput,
  UploadResult,
  PresignedUploadResponse,
  StreamResult,
  StorageItem,
  StorageCategoryStats,
  StorageStats,
  BatchDeleteResult,
  BatchDeleteError,
} from './storage/storage.interface.js';

// S3 & MinIO Adapter Implementation
export { S3StorageService } from './storage/s3.storage.js';
export type { S3StorageConfig } from './storage/s3.storage.js';

// Factory & Client Creator
export { createStorageClient, StorageFactory } from './storage/storage.factory.js';

// Media Utilities (classification, key generation, formatting)
export { detectCategory, generateStorageKey, formatBytes } from './utils/media-type.util.js';
export type { MediaCategory } from './utils/media-type.util.js';

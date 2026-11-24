import { IStorageService, StorageConfig } from './storage.interface.js';
import { S3StorageService } from './s3.storage.js';
import { config as defaultEnvConfig } from '../config/env.config.js';

/**
 * Creates an instance of IStorageService with the provided configuration.
 * If parameters are omitted, it falls back to environment variables.
 */
export function createStorageClient(options?: Partial<StorageConfig>): IStorageService {
  const provider = (options?.provider || defaultEnvConfig.storage.provider || 's3').toLowerCase();
  const bucket = options?.bucket || defaultEnvConfig.storage.bucket;
  const region = options?.region || defaultEnvConfig.storage.region || 'us-east-1';
  const endpoint =
    options?.endpoint !== undefined ? options.endpoint : defaultEnvConfig.storage.endpoint;
  const accessKeyId = options?.accessKeyId || defaultEnvConfig.storage.accessKeyId;
  const secretAccessKey = options?.secretAccessKey || defaultEnvConfig.storage.secretAccessKey;
  const forcePathStyle =
    options?.forcePathStyle !== undefined
      ? options.forcePathStyle
      : defaultEnvConfig.storage.forcePathStyle;

  if (!bucket) {
    throw new Error('Storage configuration error: "bucket" is required.');
  }

  switch (provider) {
    case 's3':
    case 'minio':
    case 'aws':
      return new S3StorageService({
        bucket,
        region,
        endpoint,
        accessKeyId,
        secretAccessKey,
        forcePathStyle,
      });

    default:
      throw new Error(
        `Unsupported storage provider: "${provider}". Supported providers: "s3" (covers MinIO & AWS S3).`
      );
  }
}

export class StorageFactory {
  private static instance: IStorageService;

  public static getStorageService(options?: Partial<StorageConfig>): IStorageService {
    if (!this.instance || options) {
      this.instance = createStorageClient(options);
    }
    return this.instance;
  }
}

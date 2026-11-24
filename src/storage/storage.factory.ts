import { IStorageService } from './storage.interface.js';
import { S3StorageService } from './s3.storage.js';
import { config } from '../config/env.config.js';

export class StorageFactory {
  private static instance: IStorageService;

  public static getStorageService(): IStorageService {
    if (!this.instance) {
      const provider = (config.storage.provider || 's3').toLowerCase();

      switch (provider) {
        case 's3':
        case 'minio':
        case 'aws':
          this.instance = new S3StorageService({
            bucket: config.storage.bucket,
            region: config.storage.region,
            endpoint: config.storage.endpoint,
            accessKeyId: config.storage.accessKeyId,
            secretAccessKey: config.storage.secretAccessKey,
            forcePathStyle: config.storage.forcePathStyle,
          });
          break;

        default:
          throw new Error(
            `Unsupported storage provider: "${provider}". Supported providers: "s3" (covers MinIO & AWS S3).`
          );
      }
    }

    return this.instance;
  }
}

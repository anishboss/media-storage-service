import { createApp } from './app.js';
import { config } from './config/env.config.js';
import { StorageFactory } from './storage/storage.factory.js';

async function bootstrap() {
  try {
    const storageService = StorageFactory.getStorageService();

    console.log('====================================================');
    console.log(`[Storage] Initializing provider: "${config.storage.provider}"`);
    console.log(`[Storage] Target Bucket: "${config.storage.bucket}"`);
    console.log(`[Storage] Endpoint: ${config.storage.endpoint || 'AWS Default'}`);
    console.log(`[Storage] Region: ${config.storage.region}`);
    console.log(`[Storage] ForcePathStyle: ${config.storage.forcePathStyle}`);
    console.log('====================================================');

    // Auto-create bucket if missing
    await storageService.ensureBucketExists();
    console.log(`[Storage] Bucket "${config.storage.bucket}" is ready.`);

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`[Server] Media Storage Service running at http://localhost:${config.port}`);
      console.log(`[Server] Web Test Console: http://localhost:${config.port}`);
      console.log(
        `[Server] Direct Upload API: POST http://localhost:${config.port}/api/media/upload`
      );
      console.log(
        `[Server] Presigned Upload API: POST http://localhost:${config.port}/api/media/presigned-upload-url`
      );
      console.log('====================================================');
    });

    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Bootstrap Error] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

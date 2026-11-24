import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { IStorageService, StorageConfig } from './storage/storage.interface.js';
import { createStorageClient } from './storage/storage.factory.js';
import { MediaController } from './controllers/media.controller.js';
import { mediaUploadMiddleware } from './middlewares/upload.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export interface CreateUploadMiddlewareOptions {
  tempDir?: string;
  maxFileSize?: number;
}

export function createMediaUploadMiddleware(options?: CreateUploadMiddlewareOptions) {
  const tempDir = options?.tempDir || path.join(os.tmpdir(), 'media-upload-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tempDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: options?.maxFileSize || 500 * 1024 * 1024,
    },
  });
}

export interface CreateMediaRouterOptions {
  storageService?: IStorageService;
  storageConfig?: Partial<StorageConfig>;
  uploadMiddleware?: multer.Multer;
  maxFileSize?: number;
}

/**
 * Creates a fully configured Express Router for media operations.
 * Allows consumers to mount `/api/media` into their existing Express app in one line.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createMediaRouter, createStorageClient } from '@dianomax/media-storage-service/express';
 *
 * const app = express();
 * const storage = createStorageClient({ bucket: 'my-bucket', endpoint: 'http://127.0.0.1:9000' });
 *
 * app.use('/api/media', createMediaRouter({ storageService: storage }));
 * ```
 */
export function createMediaRouter(options?: CreateMediaRouterOptions): Router {
  const router = Router();

  const storageService = options?.storageService || createStorageClient(options?.storageConfig);
  const controller = new MediaController(storageService);
  const uploader = options?.uploadMiddleware || (options?.maxFileSize
    ? createMediaUploadMiddleware({ maxFileSize: options.maxFileSize })
    : mediaUploadMiddleware);

  // Upload single file
  router.post('/upload', uploader.single('file'), controller.uploadDirect);

  // Request presigned upload URL
  router.post('/presigned-upload-url', controller.getPresignedUploadUrl);

  // List media
  router.get('/', controller.listMedia);

  // View / Stream media
  router.get('/:key/view', controller.viewOrStreamMedia);
  router.get('/:key/stream', controller.viewOrStreamMedia);

  // Force download
  router.get('/:key/download', controller.downloadMedia);

  // Presigned download URL
  router.get('/:key/presigned-url', controller.getPresignedDownloadUrl);

  // Delete media
  router.delete('/:key', controller.deleteMedia);

  return router;
}

// Re-exports for Express users
export { MediaController, mediaUploadMiddleware, errorHandler };

import { Router } from 'express';
import { MediaController } from '../controllers/media.controller.js';
import { mediaUploadMiddleware } from '../middlewares/upload.middleware.js';

const router = Router();

// Upload any file directly to server (single field named 'file' or 'media')
router.post('/upload', mediaUploadMiddleware.single('file'), MediaController.uploadDirect);

// Upload multiple files directly to server (field named 'files' or 'file', up to 25 files)
router.post(
  '/upload-multiple',
  mediaUploadMiddleware.array('files', 25),
  MediaController.uploadMultiple
);
router.post(
  '/upload-batch',
  mediaUploadMiddleware.array('files', 25),
  MediaController.uploadMultiple
);

// Request a pre-signed URL to upload directly to MinIO/S3
router.post('/presigned-upload-url', MediaController.getPresignedUploadUrl);

// Request batch of pre-signed URLs for multi-file direct upload
router.post('/presigned-upload-urls', MediaController.getPresignedUploadUrls);

// List all media or filter by ?category=images|videos|documents|audio|files
router.get('/', MediaController.listMedia);

// Storage analytics and statistics breakdown
router.get('/stats', MediaController.getStats);

// View inline (images, PDFs) or stream (videos/audio with HTTP 206 Range seeking)
router.get('/:key/view', MediaController.viewOrStreamMedia);

// Alias: /stream route for backward compatibility
router.get('/:key/stream', MediaController.viewOrStreamMedia);

// Object metadata and properties inspector
router.get('/:key/metadata', MediaController.getMetadata);

// Check if object exists (GET /:key/exists or HEAD /:key)
router.get('/:key/exists', MediaController.checkExists);
router.head('/:key', MediaController.checkExists);

// Force download attachment
router.get('/:key/download', MediaController.downloadMedia);

// Pre-signed download/playback URL
router.get('/:key/presigned-url', MediaController.getPresignedDownloadUrl);

// Batch delete multiple files/images/videos
router.post('/batch-delete', MediaController.deleteBatch);
router.delete('/batch', MediaController.deleteBatch);

// Copy media object within storage
router.post('/copy', MediaController.copyMedia);

// Move / Rename media object within storage
router.post('/move', MediaController.moveMedia);
router.put('/move', MediaController.moveMedia);

// Delete file/image/video
router.delete('/:key', MediaController.deleteMedia);

export const mediaRoutes = router;

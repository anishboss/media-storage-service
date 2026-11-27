import { Router } from 'express';
import { MediaController } from '../controllers/media.controller.js';
import { mediaUploadMiddleware } from '../middlewares/upload.middleware.js';

const router = Router();

// Upload any file directly to server (single field named 'file' or 'media')
router.post('/upload', mediaUploadMiddleware.single('file'), MediaController.uploadDirect);

// Request a pre-signed URL to upload directly to MinIO/S3
router.post('/presigned-upload-url', MediaController.getPresignedUploadUrl);

// List all media or filter by ?category=images|videos|documents|audio|files
router.get('/', MediaController.listMedia);

// Storage analytics and statistics breakdown
router.get('/stats', MediaController.getStats);

// View inline (images, PDFs) or stream (videos/audio with HTTP 206 Range seeking)
router.get('/:key/view', MediaController.viewOrStreamMedia);

// Alias: /stream route for backward compatibility
router.get('/:key/stream', MediaController.viewOrStreamMedia);

// Force download attachment
router.get('/:key/download', MediaController.downloadMedia);

// Pre-signed download/playback URL
router.get('/:key/presigned-url', MediaController.getPresignedDownloadUrl);

// Batch delete multiple files/images/videos
router.post('/batch-delete', MediaController.deleteBatch);
router.delete('/batch', MediaController.deleteBatch);

// Delete file/image/video
router.delete('/:key', MediaController.deleteMedia);

export const mediaRoutes = router;

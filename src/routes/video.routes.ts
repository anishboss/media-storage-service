import { Router } from 'express';
import { VideoController } from '../controllers/video.controller.js';
import { videoUploadMiddleware } from '../middlewares/upload.middleware.js';

const router = Router();

// Upload a video directly to the server
router.post('/upload', videoUploadMiddleware.single('video'), VideoController.uploadVideoDirect);

// Request a pre-signed URL for direct browser/mobile to storage upload
router.post('/presigned-upload-url', VideoController.getPresignedUploadUrl);

// List all uploaded videos
router.get('/', VideoController.listVideos);

// Stream video with HTTP 206 partial content support
router.get('/:key/stream', VideoController.streamVideo);

// Get pre-signed download/playback URL
router.get('/:key/presigned-url', VideoController.getPresignedDownloadUrl);

// Delete video
router.delete('/:key', VideoController.deleteVideo);

export const videoRoutes = router;

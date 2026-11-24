import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const tempDir = path.join(os.tmpdir(), 'media-upload-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Disk storage ensures Node.js server does not crash with Out-Of-Memory errors on large files
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

/**
 * Universal file upload middleware supporting:
 * - Images (jpg, png, webp, svg, gif, etc.)
 * - Videos (mp4, webm, mkv, mov, avi, etc.)
 * - Audio (mp3, wav, flac, ogg, etc.)
 * - Documents (pdf, docx, xlsx, pptx, txt, csv, etc.)
 * - Generic files and archives (zip, tar, json, etc.)
 */
export const mediaUploadMiddleware = multer({
  storage,
  limits: {
    // 500 MB max for direct server upload (for multi-GB files, use the presigned URL endpoint)
    fileSize: 500 * 1024 * 1024,
  },
});

export const videoUploadMiddleware = mediaUploadMiddleware;

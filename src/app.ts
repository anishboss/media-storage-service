import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { mediaRoutes } from './routes/media.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for web test console
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'media-storage-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Primary Media API routes (files, images, videos, audio, documents)
  app.use('/api/media', mediaRoutes);

  // Backward-compatible alias for videos
  app.use('/api/videos', mediaRoutes);

  // Central error handler
  app.use(errorHandler);

  return app;
}

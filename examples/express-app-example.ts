import express from 'express';
import { createMediaRouter, createStorageClient } from '../src/express.js';

// An external Express application importing this package
const app = express();
app.use(express.json());

// Initialize storage client
const storage = createStorageClient({
  bucket: 'media-store',
  endpoint: 'http://127.0.0.1:9000',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin',
  forcePathStyle: true,
});

// Mount full media storage router in 1 line
app.use('/api/media', createMediaRouter({ storageService: storage }));

app.get('/', (_req, res) => {
  res.send('Your main application is running! Media API mounted at /api/media');
});

console.log('Express app configured with @dianomax/media-storage-service/express');

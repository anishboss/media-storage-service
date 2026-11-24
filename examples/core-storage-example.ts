import { createStorageClient } from '../src/index.js';

// 1. Initialize client programmatically (works in any Node.js framework)
const storage = createStorageClient({
  provider: 's3',
  bucket: 'media-store',
  endpoint: 'http://127.0.0.1:9000', // Set for MinIO; leave empty for AWS S3
  region: 'us-east-1',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin',
  forcePathStyle: true,
});

async function main() {
  console.log('Testing storage client from another application context...');

  // Ensure bucket is ready
  await storage.ensureBucketExists();

  // Generate a presigned upload URL
  const ticket = await storage.getUploadPresignedUrl('videos/test.mp4', 'video/mp4', 3600);
  console.log('Presigned Upload Ticket generated:');
  console.log('Upload URL:', ticket.uploadUrl);
  console.log('Key:', ticket.key);

  // List existing files in storage
  const list = await storage.list();
  console.log(
    `Found ${list.length} item(s) in bucket:`,
    list.map((i) => i.key)
  );
}

main().catch(console.error);

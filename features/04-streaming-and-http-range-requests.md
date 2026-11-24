# Feature 04: Media Streaming & HTTP 206 Range Requests

## Overview

Streaming media (videos and audio) requires support for HTTP Byte-Range requests (`RFC 7233`). Without this, web video players cannot seek forward or backward, and users would have to wait for the entire multi-gigabyte video to download before starting playback.

---

## How Range Streaming Works

1. **Client Request**:
   When an HTML5 `<video>` or `<audio>` player requests playback, it sends a `Range` header:

   ```http
   GET /api/media/videos%2Fmy_video.mp4/view HTTP/1.1
   Range: bytes=0-1048575
   ```

2. **Storage Adapter Query**:
   The `S3StorageService` forwards the byte range directly to MinIO or AWS S3:

   ```typescript
   new GetObjectCommand({
     Bucket: this.bucket,
     Key: key,
     Range: range, // e.g. "bytes=0-1048575"
   });
   ```

3. **HTTP 206 Partial Content Response**:
   The server responds with partial bytes:

   ```http
   HTTP/1.1 206 Partial Content
   Accept-Ranges: bytes
   Content-Range: bytes 0-1048575/52428800
   Content-Length: 1048576
   Content-Type: video/mp4
   ```

4. **Result**:
   The video player buffers only the requested segment. Jumping to minute 45 requests bytes `150000000-...`, streaming immediately without re-downloading earlier chunks.

---

## Inline Previews vs. Attachment Downloads

- **Inline View** (`/api/media/:key/view`):
  Sets `Content-Disposition: inline` so images (PNG, JPEG, WebP) and PDFs render directly inside browser tabs or `<img>` / `<video>` tags.
- **Force Download** (`/api/media/:key/download`):
  Sets `Content-Disposition: attachment; filename="..."` so browsers automatically trigger a file save dialog.

## Source Code Reference

- Stream implementation: [media.controller.ts](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)
- S3 GetObject stream: [s3.storage.ts](file:///d:/zdianomax/Learning/media-storage-service/src/storage/s3.storage.ts)

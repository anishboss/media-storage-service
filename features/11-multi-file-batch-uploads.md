# Feature 11: Multi-File Batch Upload Operations

## Overview

The **Multi-File Batch Upload API** provides high-throughput ingestion of multiple files, images, videos, audio clips, and documents in a single request. It supports both **server-streamed multipart batch uploads** (`POST /api/media/upload-multiple`) and **batch pre-signed ticket generation** (`POST /api/media/presigned-upload-urls`) for direct-to-storage parallel transfers.

---

## Key Capabilities

1. **Concurrent Server Disk-to-Storage Streaming**: Accepts up to 25 files simultaneously via multipart disk storage. Streams each file directly into the storage bucket without keeping large payloads in Node.js process memory.
2. **Presigned Ticket Batches**: Generates signed direct-upload tickets for an arbitrary array of files in a single roundtrip, allowing client apps and mobile devices to upload multiple multi-GB assets concurrently directly to MinIO or AWS S3.
3. **Resilient Cleanup Guarantee**: Automatically cleans up temporary files on disk even if an upload stream fails or is cancelled mid-transit.
4. **Interactive Dashboard Multi-Select**: Both the **Direct Server Upload** and **Presigned Direct Upload** test dropzones support multi-file selection (`<input type="file" multiple>`), displaying total file count, collective size, and live per-upload progress tracking.

---

## Endpoint Details

### 1. `POST /api/media/upload-multiple`

_(Also aliased as `POST /api/media/upload-batch`)_

Uploads up to 25 files concurrently via multipart form data (`multipart/form-data`).

#### Form Fields:

- `files`: Array of file binaries (`files` or `file` field name).
- `category` _(optional)_: Preferred media category (`images`, `videos`, `audio`, `documents`, `files`).

#### Response (`201 Created`)

```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "count": 3,
  "data": [
    {
      "key": "images/1795507085667-b0f9c686-photo1.png",
      "bucket": "media-bucket",
      "category": "images",
      "size": 1542310,
      "contentType": "image/png",
      "originalName": "photo1.png",
      "viewUrl": "/api/media/images%2F1795507085667-b0f9c686-photo1.png/view",
      "downloadUrl": "/api/media/images%2F1795507085667-b0f9c686-photo1.png/download",
      "presignedUrlEndpoint": "/api/media/images%2F1795507085667-b0f9c686-photo1.png/presigned-url"
    },
    {
      "key": "documents/1795507085668-c7e11f23-invoice.pdf",
      "bucket": "media-bucket",
      "category": "documents",
      "size": 451200,
      "contentType": "application/pdf",
      "originalName": "invoice.pdf",
      "viewUrl": "/api/media/documents%2F1795507085668-c7e11f23-invoice.pdf/view",
      "downloadUrl": "/api/media/documents%2F1795507085668-c7e11f23-invoice.pdf/download",
      "presignedUrlEndpoint": "/api/media/documents%2F1795507085668-c7e11f23-invoice.pdf/presigned-url"
    }
  ]
}
```

---

### 2. `POST /api/media/presigned-upload-urls`

Generates multiple pre-signed PUT tickets in a single request.

#### Request Body

```json
{
  "files": [
    { "fileName": "hero_video.mp4", "contentType": "video/mp4" },
    { "fileName": "dataset.zip", "contentType": "application/zip" }
  ]
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "2 presigned upload ticket(s) generated successfully",
  "count": 2,
  "data": [
    {
      "originalName": "hero_video.mp4",
      "uploadUrl": "http://127.0.0.1:9000/media-bucket/videos/1795507085667-hero_video.mp4?...",
      "key": "videos/1795507085667-hero_video.mp4",
      "bucket": "media-bucket",
      "category": "videos",
      "contentType": "video/mp4",
      "expiresInSeconds": 3600,
      "method": "PUT"
    },
    {
      "originalName": "dataset.zip",
      "uploadUrl": "http://127.0.0.1:9000/media-bucket/files/1795507085668-dataset.zip?...",
      "key": "files/1795507085668-dataset.zip",
      "bucket": "media-bucket",
      "category": "files",
      "contentType": "application/zip",
      "expiresInSeconds": 3600,
      "method": "PUT"
    }
  ]
}
```

---

## Source Code Reference

- Controller: [`media.controller.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)
- Upload Middleware: [`upload.middleware.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/middlewares/upload.middleware.ts)
- Express Router: [`media.routes.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/routes/media.routes.ts) & [`express.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/express.ts)
- Web Console: [`public/index.html`](file:///d:/zdianomax/Learning/media-storage-service/public/index.html)

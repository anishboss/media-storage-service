# Feature 09: Object Metadata Inspection & Existence Verification

## Overview

The **Object Metadata & Existence API** provides lightweight, high-performance object inspection using AWS S3 `HeadObjectCommand`. It allows client applications to inspect object dimensions, MIME types, ETags, timestamps, and custom metadata headers without streaming or downloading the object body.

---

## Key Capabilities

1. **Zero-Download Metadata Inspection**: Retrieves byte size, formatted size, Content-Type, ETag, and last-modified timestamps via HTTP HEAD semantics without allocating memory for the file stream.
2. **Custom Metadata Header Extraction**: Exposes all custom S3 user metadata tags (`x-amz-meta-*`) attached during upload (such as `originalName`, `category`, and `uploadedAt`).
3. **High-Speed Existence Verification**: Dedicated `exists(key)` method and `HEAD /api/media/:key` endpoint returning `200 OK` or `404 Not Found` without body overhead.
4. **Interactive Dashboard Inspector & Live Search**:
   - "ℹ️ Info" button on every media card opening a modal with detailed object properties and quick-copy buttons.
   - Real-time client-side search filtering by filename and category.
   - Dynamic sorting (`Newest`, `Oldest`, `Largest Size`, `Smallest Size`, `Name A-Z`).

---

## Endpoint Details

### 1. `GET /api/media/:key/metadata`

Retrieves structured metadata details and custom metadata headers.

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "key": "images/1795507085667-b0f9c686-banner.png",
    "size": 2457600,
    "formattedSize": "2.34 MB",
    "contentType": "image/png",
    "lastModified": "2026-11-27T10:00:00.000Z",
    "eTag": "9b105d4bb7f5f6340fb60c4545733f34",
    "category": "images",
    "metadata": {
      "originalname": "banner.png",
      "category": "images",
      "uploadedat": "2026-11-27T10:00:00.000Z"
    }
  }
}
```

### 2. `HEAD /api/media/:key` or `GET /api/media/:key/exists`

Lightweight check verifying whether an object exists in storage.

- Returns `200 OK` (with `{ "success": true, "data": { "key": "...", "exists": true } }` on GET).
- Returns `404 Not Found` if the object does not exist.

---

## TypeScript SDK Usage

```typescript
import { createStorageClient } from '@dianomax/media-storage-service';

const storage = createStorageClient();

// Check if file exists
const isPresent = await storage.exists('images/sample.png');
if (isPresent) {
  // Retrieve metadata without downloading the body
  const meta = await storage.getMetadata('images/sample.png');
  console.log(`File: ${meta.key}`);
  console.log(`Size: ${meta.formattedSize} (${meta.size} bytes)`);
  console.log(`Content-Type: ${meta.contentType}`);
  console.log(`Custom Metadata:`, meta.metadata);
}
```

---

## Source Code Reference

- Storage Contract: [`storage.interface.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/storage.interface.ts)
- S3/MinIO Adapter: [`s3.storage.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/s3.storage.ts)
- Controller: [`media.controller.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)
- Express Router: [`media.routes.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/routes/media.routes.ts) & [`express.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/express.ts)
- Web Console: [`public/index.html`](file:///d:/zdianomax/Learning/media-storage-service/public/index.html)

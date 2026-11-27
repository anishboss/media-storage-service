# Feature 08: Batch Delete & Bulk Cleanup Operations

## Overview

The **Batch Delete API** allows clients and service consumers to delete multiple stored objects (files, images, videos, documents) in a single unified operation. Instead of issuing separate sequential HTTP requests for each individual object, the system utilizes high-performance S3 batch deletion via `DeleteObjectsCommand`.

---

## Key Capabilities

1. **Native S3 Batch Efficiency**: Aggregates deletion keys into bulk requests rather than looping through individual single-object deletes.
2. **Automatic 1,000-Object Chunking**: AWS S3 and MinIO enforce a hard ceiling of 1,000 objects per `DeleteObjectsCommand`. The `deleteMany` adapter transparently partitions larger arrays into 1,000-object chunks and combines results.
3. **Partial Failure Resilience**: Returns granular reporting detailing both successfully removed keys (`deleted`) and any items that failed (`errors`), ensuring that one missing or locked file does not halt the deletion of other items.
4. **Interactive Dashboard UI**: Checkbox multi-select, indeterminate "Select All" toggle, live selection counter, and bulk action toolbar with instant storage metric recalculation.

---

## Endpoint Details

### `POST /api/media/batch-delete`

_(Alternative route: `DELETE /api/media/batch`)_

#### Request Body

```json
{
  "keys": [
    "images/1795507085667-b0f9c686-banner.png",
    "videos/1795507085668-a419c812-demo.mp4",
    "documents/1795507085669-c7e11f23-report.pdf"
  ]
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Batch delete completed: 3 deleted, 0 failed",
  "data": {
    "deleted": [
      "images/1795507085667-b0f9c686-banner.png",
      "videos/1795507085668-a419c812-demo.mp4",
      "documents/1795507085669-c7e11f23-report.pdf"
    ],
    "errors": [],
    "successCount": 3,
    "errorCount": 0
  }
}
```

#### Partial Failure Response Example

```json
{
  "success": false,
  "message": "Batch delete completed: 2 deleted, 1 failed",
  "data": {
    "deleted": [
      "images/1795507085667-b0f9c686-banner.png",
      "documents/1795507085669-c7e11f23-report.pdf"
    ],
    "errors": [
      {
        "key": "videos/non-existent.mp4",
        "message": "NoSuchKey: The specified key does not exist."
      }
    ],
    "successCount": 2,
    "errorCount": 1
  }
}
```

---

## TypeScript SDK Usage

The method is accessible directly through any `IStorageService` instance:

```typescript
import { createStorageClient } from '@dianomax/media-storage-service';

const storage = createStorageClient();

// Batch delete files
const result = await storage.deleteMany([
  'images/1795507085667-profile.png',
  'documents/1795507085668-invoice.pdf',
]);

console.log(`Successfully deleted ${result.successCount} files`);
if (result.errorCount > 0) {
  console.warn('Errors encountered:', result.errors);
}
```

---

## Source Code Reference

- Storage Contract: [`storage.interface.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/storage.interface.ts)
- S3/MinIO Adapter: [`s3.storage.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/s3.storage.ts)
- Controller: [`media.controller.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)
- Express Router: [`media.routes.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/routes/media.routes.ts) & [`express.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/express.ts)
- Web Console: [`public/index.html`](file:///d:/zdianomax/Learning/media-storage-service/public/index.html)

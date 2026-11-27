# Feature 10: Object Copy, Move & Rename Operations

## Overview

The **Object Copy & Move / Rename API** enables seamless duplication, reorganization, and renaming of stored assets directly inside the object storage cluster (MinIO, AWS S3, or S3-compatible cloud storage) without transferring file binaries over the application network.

---

## Key Capabilities

1. **Server-Side Cloud Copy**: Uses AWS S3 `CopyObjectCommand` to duplicate assets within the storage bucket. Data transfer takes place entirely within the storage layer, avoiding expensive download-and-re-upload cycles in the Node.js process.
2. **Atomic Move & Rename**: Combines server-side copy with source object deletion (`delete()`) to provide atomic-like renaming and folder relocation across storage prefixes (`images/`, `documents/`, `archive/`, etc.).
3. **Metadata Preservation**: Inherits and copies object metadata (`MetadataDirective: 'COPY'`), preserving original MIME content types, timestamps, and custom headers.
4. **Interactive Dashboard UI**:
   - "✏️ Rename" button on each media item card.
   - Dedicated Move / Rename modal with pre-filled keys, destination validation, and automatic list and storage metrics refresh upon completion.

---

## Endpoint Details

### 1. `POST /api/media/copy`

Creates an exact duplicate of an object at a new storage key.

#### Request Body

```json
{
  "sourceKey": "images/1795507085667-banner.png",
  "destinationKey": "images/backup-banner.png"
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Object copied successfully from \"images/1795507085667-banner.png\" to \"images/backup-banner.png\"",
  "data": {
    "sourceKey": "images/1795507085667-banner.png",
    "destinationKey": "images/backup-banner.png",
    "bucket": "media-bucket",
    "eTag": "9b105d4bb7f5f6340fb60c4545733f34"
  }
}
```

---

### 2. `POST /api/media/move` _(Also supports `PUT /api/media/move`)_

Relocates or renames an object, deleting the source upon successful copy.

#### Request Body

```json
{
  "sourceKey": "files/1795507085669-report.pdf",
  "destinationKey": "documents/2026-financial-report.pdf"
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Object moved/renamed successfully to \"documents/2026-financial-report.pdf\"",
  "data": {
    "sourceKey": "files/1795507085669-report.pdf",
    "destinationKey": "documents/2026-financial-report.pdf",
    "bucket": "media-bucket",
    "eTag": "c7e11f23b7f5f6340fb60c4545733f34"
  }
}
```

---

## TypeScript SDK Usage

```typescript
import { createStorageClient } from '@dianomax/media-storage-service';

const storage = createStorageClient();

// 1. Copy an object
const copyResult = await storage.copy('images/photo.png', 'archive/photo-copy.png');
console.log(`Copied to: ${copyResult.destinationKey}`);

// 2. Move / Rename an object
const moveResult = await storage.move('files/old-name.pdf', 'documents/new-name.pdf');
console.log(`Moved to: ${moveResult.destinationKey}`);
```

---

## Source Code Reference

- Storage Contract: [`storage.interface.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/storage.interface.ts)
- S3/MinIO Adapter: [`s3.storage.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/s3.storage.ts)
- Controller: [`media.controller.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)
- Express Router: [`media.routes.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/routes/media.routes.ts) & [`express.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/express.ts)
- Web Console: [`public/index.html`](file:///d:/zdianomax/Learning/media-storage-service/public/index.html)

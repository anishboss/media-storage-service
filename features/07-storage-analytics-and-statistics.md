# Feature 07: Storage Analytics & Statistics API

## Overview

The **Storage Analytics & Statistics API** aggregates bucket-level utilization metrics, calculating total objects stored, total storage consumed in bytes, human-readable formatted sizes (B, KB, MB, GB, TB), and a detailed breakdown categorized by media type (`images`, `videos`, `audio`, `documents`, `files`).

---

## Endpoint Details

### `GET /api/media/stats`

Query parameters:

- `prefix` _(optional)_: Filter statistics to a specific key prefix (e.g., `images/` or a user namespace `user_123/`).

#### Example Response (`200 OK`):

```json
{
  "success": true,
  "data": {
    "totalObjects": 18,
    "totalBytes": 48234496,
    "totalFormattedSize": "46.00 MB",
    "categories": {
      "images": {
        "count": 8,
        "bytes": 6291456,
        "formattedSize": "6.00 MB"
      },
      "videos": {
        "count": 2,
        "bytes": 41943040,
        "formattedSize": "40.00 MB"
      },
      "audio": {
        "count": 0,
        "bytes": 0,
        "formattedSize": "0 B"
      },
      "documents": {
        "count": 5,
        "bytes": 0,
        "formattedSize": "0 B"
      },
      "files": {
        "count": 3,
        "bytes": 0,
        "formattedSize": "0 B"
      }
    }
  }
}
```

---

## TypeScript SDK Usage

The method is accessible directly from any `IStorageService` instance:

```typescript
import { createStorageClient } from '@dianomax/media-storage-service';

const storage = createStorageClient();

// Overall bucket metrics
const stats = await storage.getStats();
console.log(`Total Storage: ${stats.totalFormattedSize} across ${stats.totalObjects} files`);
console.log(`Videos consumed: ${stats.categories.videos.formattedSize}`);

// Scoped to a prefix / sub-directory
const userStats = await storage.getStats('user_101/');
```

---

## Architectural Highlights

1. **Automatic Pagination**: Leverages AWS S3 `ContinuationToken` pagination loop (`ListObjectsV2Command`), reliably processing buckets containing more than 1,000 objects without hitting API limits.
2. **Category Aggregation**: Inspects object keys and MIME signatures via `detectCategory`, automatically attributing metrics to their respective media categories.
3. **Dashboard Real-Time Integration**: The web dashboard at `/` automatically refreshes the storage overview widget on page load, file upload, and object deletion.

---

## Source Code Reference

- Storage Interface: [`storage.interface.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/storage.interface.ts)
- S3 / MinIO Implementation: [`s3.storage.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/storage/s3.storage.ts)
- Controller: [`media.controller.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)
- Routes: [`media.routes.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/routes/media.routes.ts) & [`express.ts`](file:///d:/zdianomax/Learning/media-storage-service/src/express.ts)
- Web UI: [`public/index.html`](file:///d:/zdianomax/Learning/media-storage-service/public/index.html)

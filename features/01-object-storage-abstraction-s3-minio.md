# Feature 01: Object Storage Abstraction & S3/MinIO Parity

## Overview

The Media Storage Service applies the **Hexagonal / Port & Adapter Pattern** and **Factory Pattern** to decouple the core application logic from the underlying storage cloud provider.

## Architectural Design

```
   ┌──────────────────────────────────────────────┐
   │            Application Layer                 │
   │  (MediaController, Routes, Middlewares)      │
   └──────────────────────┬───────────────────────┘
                          │ Depends ONLY on Interface
                          ▼
   ┌──────────────────────────────────────────────┐
   │         IStorageService Interface            │
   │  - ensureBucketExists()                      │
   │  - upload(input)                             │
   │  - getUploadPresignedUrl(key, mime, expire)  │
   │  - getDownloadPresignedUrl(key, expire)      │
   │  - getObjectStream(key, range)               │
   │  - delete(key)                               │
   │  - list(prefix)                              │
   └──────────────────────┬───────────────────────┘
                          │ Implemented by Adapter
                          ▼
   ┌──────────────────────────────────────────────┐
   │          S3StorageService Adapter            │
   │         (Built on AWS SDK v3)                │
   └──────────────────────┬───────────────────────┘
                          │ Configured via .env
             ┌────────────┴────────────┐
             ▼                         ▼
   ┌───────────────────┐     ┌───────────────────┐
   │   MinIO Storage   │     │      AWS S3       │
   │ (Local: port 9000)│     │    (Production)   │
   └───────────────────┘     └───────────────────┘
```

## Why MinIO and AWS S3 are 100% Interchangeable

1. **API Parity**: MinIO adheres strictly to the Amazon S3 v4 REST specification (PutObject, GetObject, multipart upload parts, signed URLs).
2. **SDK Compatibility**: By using official `@aws-sdk/client-s3` and `@aws-sdk/lib-storage`, the identical client calls both MinIO and AWS S3.
3. **Configuration Driven**:
   - MinIO requires `endpoint: "http://127.0.0.1:9000"` and `forcePathStyle: true`.
   - AWS S3 omits `endpoint` (using standard AWS regional endpoints) and sets `forcePathStyle: false`.

## Source Code Reference

- Interface: [storage.interface.ts](file:///d:/zdianomax/Learning/media-storage-service/src/storage/storage.interface.ts)
- S3 Adapter: [s3.storage.ts](file:///d:/zdianomax/Learning/media-storage-service/src/storage/s3.storage.ts)
- Storage Factory: [storage.factory.ts](file:///d:/zdianomax/Learning/media-storage-service/src/storage/storage.factory.ts)

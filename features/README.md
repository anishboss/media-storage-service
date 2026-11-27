# Features & Architecture Tracking

This directory tracks the architectural capabilities, design decisions, and implementation guides for the **Media Storage Service**.

| #      | Feature Track                                                                               | Status      | Description                                                                                               |
| ------ | ------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| **01** | [Object Storage Abstraction & S3/MinIO Parity](./01-object-storage-abstraction-s3-minio.md) | ✅ Complete | Decoupled `IStorageService` interface allowing zero-code swap between local MinIO and AWS S3.             |
| **02** | [Multi-Format Handling: Files, Images, Videos](./02-file-image-video-uploads.md)            | ✅ Complete | Automatic MIME detection, categorization into folders (`images/`, `videos/`, `documents/`, `files/`).     |
| **03** | [Direct vs. Presigned URL Uploads](./03-direct-vs-presigned-uploads.md)                     | ✅ Complete | Multipart disk streaming for server uploads & direct-to-storage signed tickets for large multi-GB assets. |
| **04** | [Media Streaming & HTTP 206 Range Requests](./04-streaming-and-http-range-requests.md)      | ✅ Complete | Byte-range streaming for seamless video/audio seeking and inline image/document rendering.                |
| **05** | [Production AWS S3 Migration Checklist](./05-aws-s3-production-migration-guide.md)          | ✅ Complete | Environment variable configuration guide to deploy to AWS S3 without touching code.                       |
| **06** | [CI/CD & Automated NPM Version Deployment](./06-ci-cd-and-npm-publishing.md)                | ✅ Complete | GitHub Actions workflows for matrix testing and automated package publishing to NPM.                      |
| **07** | [Storage Analytics & Statistics API](./07-storage-analytics-and-statistics.md)              | ✅ Complete | Storage usage aggregation, bytes/object count, category breakdown, and dashboard metrics.                 |
| **08** | [Batch Delete & Bulk Cleanup Operations](./08-batch-delete-and-bulk-cleanup.md)             | ✅ Complete | Multi-object batch deletion via S3 DeleteObjectsCommand with chunking and UI bulk actions.                |
| **09** | [Object Metadata Inspection & Existence](./09-object-metadata-inspection.md)                | ✅ Complete | HeadObject metadata extraction, existence checks, live search, sorting, and inspector UI.                 |
| **10** | [Object Copy, Move & Rename Operations](./10-object-copy-move-and-rename.md)                | ✅ Complete | Zero-byte cloud copy and move/rename operations with UI modal management.                                 |
| **11** | [Multi-File Batch Upload Operations](./11-multi-file-batch-uploads.md)                      | ✅ Complete | Concurrent multi-file uploads (server disk stream & presigned tickets) with multi-select UI.              |

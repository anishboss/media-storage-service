# Feature 03: Direct vs. Presigned URL Uploads

## Overview
Depending on file size and infrastructure architecture, applications require two distinct upload patterns:

---

## 1. Direct Server Upload (`POST /api/media/upload`)
* **How it works**:
  1. The client sends a multipart form-data payload to the Node.js Express server.
  2. Multer streams the file to temporary disk storage (avoiding RAM exhaustion).
  3. The storage adapter initiates a multipart upload stream (`@aws-sdk/lib-storage` `Upload`) with 5MB chunk parts and concurrent worker queues.
  4. Once uploaded to MinIO/S3, the temporary local disk file is cleaned up.
* **Best used for**: Small images, avatars, documents, and lightweight files (< 100MB).

---

## 2. Presigned URL Direct Upload (`POST /api/media/presigned-upload-url`)
* **How it works**:
  1. Client sends a lightweight JSON payload to Node: `{ fileName: "huge_video.mp4", contentType: "video/mp4" }`.
  2. Node validates the request, generates a secure, time-limited presigned S3/MinIO PUT URL using `@aws-sdk/s3-request-presigner`, and returns it.
  3. The browser or mobile client uploads the binary payload **directly to MinIO or AWS S3** via HTTP `PUT`.
* **Benefits**:
  * **Zero Server Bandwidth**: The Node.js server does not process or route gigabytes of data.
  * **Horizontal Scalability**: Eliminates upload bottleneck on your backend instances.
  * **High Reliability**: Direct uploads support chunking, pause, and resume.
* **Best used for**: Videos, large archives, high-resolution media (> 100MB).

## Source Code Reference
- Controller Logic: [media.controller.ts](file:///d:/zdianomax/Learning/media-storage-service/src/controllers/media.controller.ts)

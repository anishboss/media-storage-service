# Media Storage Service

A production-ready Node.js & TypeScript object storage service for **Files**, **Images**, **Videos**, **Audio**, and **Documents**.

Designed with the **Port & Adapter (Strategy) Pattern** and **Factory Pattern**, this service allows you to develop locally using **MinIO** and transition to **AWS S3** (or Cloudflare R2 / Wasabi) at any later phase with **zero code modifications**—only changing environment variables.

---

## 🏗️ Architecture Design

```
   [ Web / Mobile Client ]
       │            │
       │ (1) Direct │ (2) Presigned URL
       ▼ Upload     ▼ Direct to Storage
[ MediaController (Decoupled) ] ──────────┐
       │ (Multipart Disk Streaming)       │
       ▼                                  │
[ IStorageService Interface ] ◄───────────┘
       │
[ S3StorageService Adapter (AWS SDK v3) ]
       │
  ┌────┴───────────────────────────┐
  ▼                                ▼
[ MinIO (Local Dev) ]       [ AWS S3 (Production) ]
http://127.0.0.1:9000        s3.amazonaws.com
```

### Why does switching from MinIO to AWS S3 require NO code changes?

1. **100% S3 Compatibility**: MinIO implements the official Amazon S3 v4 REST specification.
2. **Standard AWS SDK v3**: Built on `@aws-sdk/client-s3` and `@aws-sdk/lib-storage`.
3. **Storage Interface Abstraction**: Application controllers interact strictly with `IStorageService`. Zero vendor-specific SDK logic exists in route controllers.

---

## 📁 Project Structure

```
media-storage-service/
├── .env                              # Active configuration
├── .env.example                      # Template demonstrating MinIO vs AWS S3
├── package.json
├── tsconfig.json
├── features/                         # Dedicated feature documentation & tracker
│   ├── README.md                     # Feature index
│   ├── 01-object-storage-abstraction-s3-minio.md
│   ├── 02-file-image-video-uploads.md
│   ├── 03-direct-vs-presigned-uploads.md
│   ├── 04-streaming-and-http-range-requests.md
│   └── 05-aws-s3-production-migration-guide.md
├── public/
│   └── index.html                    # Interactive web test console
└── src/
    ├── config/
    │   └── env.config.ts             # Typed environment loader
    ├── storage/
    │   ├── storage.interface.ts      # Core IStorageService contract
    │   ├── s3.storage.ts             # Unified S3/MinIO adapter
    │   └── storage.factory.ts        # Storage factory
    ├── controllers/
    │   └── media.controller.ts       # Unified media controller
    ├── routes/
    │   └── media.routes.ts           # REST API routes
    ├── middlewares/
    │   ├── upload.middleware.ts      # Multi-format Multer disk storage
    │   └── error.middleware.ts       # Central error handler
    ├── utils/
    │   └── media-type.util.ts        # MIME detection & key generator
    ├── app.ts                        # Express setup
    └── server.ts                     # Bootstrap & auto-bucket creation
```

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure your local MinIO instance is running at `http://127.0.0.1:9000`.

### 2. Configure Environment (`.env`)

The `.env` file is pre-configured for your local MinIO:

```env
PORT=4000
STORAGE_PROVIDER=s3
STORAGE_BUCKET=media-bucket
STORAGE_ENDPOINT=http://127.0.0.1:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_FORCE_PATH_STYLE=true
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open Test Dashboard

Visit **`http://localhost:4000`** in your browser to test:

- Direct and Presigned uploads for files, images, and videos.
- Inline image rendering and document downloads.
- Video streaming with HTTP 206 range seeking.

---

## 📡 REST API Reference

| Method   | Endpoint                          | Description                                                                |
| -------- | --------------------------------- | -------------------------------------------------------------------------- |
| `POST`   | `/api/media/upload`               | Direct multipart upload (`file` field). Piped directly to storage.         |
| `POST`   | `/api/media/presigned-upload-url` | Generate presigned PUT URL for client-to-storage direct upload.            |
| `GET`    | `/api/media`                      | List stored media (supports `?category=images\|videos\|documents\|files`). |
| `GET`    | `/api/media/stats`                | Storage analytics: bytes, object counts, and media category breakdown.     |
| `GET`    | `/api/media/:key/view`            | Inline view (images/PDFs) or streaming (videos/audio with Range seeking).  |
| `GET`    | `/api/media/:key/download`        | Force file download (`Content-Disposition: attachment`).                   |
| `GET`    | `/api/media/:key/presigned-url`   | Get time-limited signed download/view URL.                                 |
| `POST`   | `/api/media/batch-delete`         | Batch delete multiple media objects (`{ keys: string[] }`).                |
| `DELETE` | `/api/media/:key`                 | Delete single media object from storage.                                   |

_(Note: `/api/videos/*` routes remain fully supported as backward-compatible aliases)._

---

## 🔄 Switching to AWS S3 (Production)

To switch to AWS S3, simply update your `.env` variables without changing any code:

```env
STORAGE_PROVIDER=s3
STORAGE_BUCKET=your-production-bucket-name
STORAGE_ENDPOINT=
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=YOUR_AWS_ACCESS_KEY_ID
STORAGE_SECRET_KEY=YOUR_AWS_SECRET_ACCESS_KEY
STORAGE_FORCE_PATH_STYLE=false
```

For complete IAM and bucket setup instructions, read [features/05-aws-s3-production-migration-guide.md](./features/05-aws-s3-production-migration-guide.md).

---

## 🌿 Git Branching Strategy

| Branch            | Role       | Environment         | Trigger / Action                                                     |
| ----------------- | ---------- | ------------------- | -------------------------------------------------------------------- |
| **`development`** | Staging    | Stage / Pre-release | Validates all PRs & pushes; builds staging packages.                 |
| **`main`**        | Production | Stable Production   | Tested releases merged via PR; tags (`v*`) publish to NPM `@latest`. |

---

## 🤝 Contributing

We welcome contributions! Please read our [**Contributing Guide (CONTRIBUTING.md)**](./CONTRIBUTING.md) for details on code style, branch guidelines, local MinIO testing, and pull request procedures.

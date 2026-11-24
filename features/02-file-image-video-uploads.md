# Feature 02: Multi-Format Handling — Files, Images, Videos, Audio

## Overview
The system accommodates any binary or media asset, automatically categorizing and structuring files inside the storage bucket while sanitizing keys and maintaining accurate MIME types.

## Supported Media Categories

| Category | Typical Formats | Target Folder |
|---|---|---|
| **Images** | JPEG, PNG, WebP, SVG, GIF, AVIF | `images/` |
| **Videos** | MP4, WebM, MKV, MOV, AVI, FLV | `videos/` |
| **Audio** | MP3, WAV, FLAC, AAC, OGG | `audio/` |
| **Documents** | PDF, DOCX, XLSX, PPTX, TXT, CSV | `documents/` |
| **Files** | ZIP, TAR, JSON, Binary datasets | `files/` |

## Key Generation & Collision Prevention
Every file uploaded receives a sanitized, collision-free key formatted as:
```
<category>/<timestamp>-<8-char-uuid>-<sanitized_filename>.<ext>
```
Example:
```
images/1795507085667-b0f9c686-banner_image.png
videos/1795507085667-a419c812-product_demo.mp4
documents/1795507085667-c7e11f23-financial_report.pdf
```

## Source Code Reference
- Classification Utility: [media-type.util.ts](file:///d:/zdianomax/Learning/media-storage-service/src/utils/media-type.util.ts)
- Upload Middleware: [upload.middleware.ts](file:///d:/zdianomax/Learning/media-storage-service/src/middlewares/upload.middleware.ts)

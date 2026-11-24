import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { StorageFactory } from '../storage/storage.factory.js';
import { generateStorageKey, detectCategory, MediaCategory } from '../utils/media-type.util.js';

export class MediaController {
  private static get storageService() {
    return StorageFactory.getStorageService();
  }

  private static getParamKey(req: Request): string {
    const rawKey = req.params.key;
    const keyStr = Array.isArray(rawKey) ? rawKey[0] : (rawKey as string);
    return decodeURIComponent(keyStr);
  }

  /**
   * 1. Direct Server Upload
   * Accepts any file (image, video, document, audio, generic file),
   * auto-categorizes it, and streams it to object storage (MinIO / AWS S3) via multipart upload.
   */
  public static async uploadDirect(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    const preferredCategory = req.body.category as MediaCategory | undefined;
    const { key, category, contentType } = generateStorageKey(
      file.originalname,
      file.mimetype,
      preferredCategory
    );

    try {
      const fileStream = fs.createReadStream(file.path);

      const result = await MediaController.storageService.upload({
        key,
        body: fileStream,
        contentType,
        contentLength: file.size,
        metadata: {
          originalName: file.originalname,
          category,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Cleanup local temporary file from disk
      await fs.promises.unlink(file.path).catch(() => {});

      const encodedKey = encodeURIComponent(result.key);

      res.status(201).json({
        success: true,
        message: `${category.slice(0, -1).toUpperCase()} uploaded successfully`,
        data: {
          key: result.key,
          bucket: result.bucket,
          category,
          size: file.size,
          contentType,
          originalName: file.originalname,
          viewUrl: `/api/media/${encodedKey}/view`,
          downloadUrl: `/api/media/${encodedKey}/download`,
          presignedUrlEndpoint: `/api/media/${encodedKey}/presigned-url`,
        },
      });
    } catch (error) {
      if (file?.path) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
      next(error);
    }
  }

  /**
   * 2. Presigned URL Direct Upload (Production Standard for Multi-GB Files)
   * Client requests a signed PUT URL for an image, video, or large dataset,
   * then uploads directly to MinIO or AWS S3.
   */
  public static async getPresignedUploadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileName, contentType: inputContentType, category: inputCategory } = req.body;

      if (!fileName) {
        res.status(400).json({ success: false, message: 'fileName is required' });
        return;
      }

      const { key, category, contentType } = generateStorageKey(
        fileName,
        inputContentType,
        inputCategory
      );

      const presignedData = await MediaController.storageService.getUploadPresignedUrl(
        key,
        contentType,
        3600 // Valid for 1 hour
      );

      res.status(200).json({
        success: true,
        message: 'Presigned upload URL generated successfully',
        data: {
          uploadUrl: presignedData.uploadUrl,
          key: presignedData.key,
          bucket: presignedData.bucket,
          category,
          contentType,
          expiresInSeconds: presignedData.expiresInSeconds,
          method: 'PUT',
          note: 'Make a PUT request directly to uploadUrl with file binary as body and Content-Type header matching contentType.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. View / Stream Media
   * Handles:
   * - Video/Audio: HTTP 206 Partial Content range requests (instant seeking)
   * - Images: Inline browser display (PNG, JPEG, WebP, SVG, GIF)
   * - Documents: Inline PDF/document rendering
   */
  public static async viewOrStreamMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const key = MediaController.getParamKey(req);
      const range = req.headers.range;

      const { stream, contentLength, contentType, contentRange, acceptRanges } =
        await MediaController.storageService.getObjectStream(key, range);

      const resolvedContentType = contentType || 'application/octet-stream';

      if (range && contentRange) {
        res.writeHead(206, {
          'Content-Range': contentRange,
          'Accept-Ranges': acceptRanges || 'bytes',
          'Content-Length': contentLength,
          'Content-Type': resolvedContentType,
          'Content-Disposition': 'inline',
        });
      } else {
        res.writeHead(200, {
          'Content-Length': contentLength,
          'Content-Type': resolvedContentType,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': 'inline',
        });
      }

      stream.pipe(res);
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ success: false, message: 'Object not found in storage' });
        return;
      }
      next(error);
    }
  }

  /**
   * 4. Force File Download
   * Sets Content-Disposition: attachment to prompt download dialog.
   */
  public static async downloadMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const key = MediaController.getParamKey(req);
      const fileName = path.basename(key);

      const { stream, contentLength, contentType } =
        await MediaController.storageService.getObjectStream(key);

      res.writeHead(200, {
        'Content-Length': contentLength,
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });

      stream.pipe(res);
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ success: false, message: 'Object not found' });
        return;
      }
      next(error);
    }
  }

  /**
   * 5. Get Presigned Download/Playback URL
   */
  public static async getPresignedDownloadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const key = MediaController.getParamKey(req);
      const downloadUrl = await MediaController.storageService.getDownloadPresignedUrl(key);

      res.status(200).json({
        success: true,
        data: {
          key,
          downloadUrl,
          expiresInSeconds: 3600,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. List Media with Optional Category Filter
   * Query params: ?category=images | videos | documents | audio | files
   */
  public static async listMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const prefix = category ? `${category}/` : undefined;

      const items = await MediaController.storageService.list(prefix);

      const formatted = items.map((item) => {
        const itemCategory = detectCategory(undefined, item.key);
        const encodedKey = encodeURIComponent(item.key);

        return {
          ...item,
          category: itemCategory,
          viewUrl: `/api/media/${encodedKey}/view`,
          downloadUrl: `/api/media/${encodedKey}/download`,
          presignedUrlEndpoint: `/api/media/${encodedKey}/presigned-url`,
        };
      });

      res.status(200).json({
        success: true,
        count: formatted.length,
        filter: category || 'all',
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. Delete Media
   */
  public static async deleteMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const key = MediaController.getParamKey(req);
      await MediaController.storageService.delete(key);

      res.status(200).json({
        success: true,
        message: `Object "${key}" deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

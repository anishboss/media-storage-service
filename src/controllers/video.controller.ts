import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { StorageFactory } from '../storage/storage.factory.js';

export class VideoController {
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
   * Client sends video in multipart/form-data to Node server,
   * which streams it to object storage (MinIO / AWS S3) via multipart upload.
   */
  public static async uploadVideoDirect(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No video file provided' });
      return;
    }

    const ext = path.extname(file.originalname);
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storageKey = `videos/${Date.now()}-${uuidv4().substring(0, 8)}-${sanitizedName}${ext}`;

    try {
      const fileStream = fs.createReadStream(file.path);

      const result = await VideoController.storageService.upload({
        key: storageKey,
        body: fileStream,
        contentType: file.mimetype,
        contentLength: file.size,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Cleanup local temporary file
      await fs.promises.unlink(file.path).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          key: result.key,
          bucket: result.bucket,
          size: file.size,
          contentType: file.mimetype,
          streamUrl: `/api/videos/${encodeURIComponent(result.key)}/stream`,
          presignedUrlEndpoint: `/api/videos/${encodeURIComponent(result.key)}/presigned-url`,
        },
      });
    } catch (error) {
      // Clean up temporary file if upload fails
      if (file?.path) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
      next(error);
    }
  }

  /**
   * 2. Presigned URL Direct Upload (Industry Best Practice)
   * Client asks Node for a pre-signed PUT URL.
   * Node generates signed URL and returns it.
   * Client uploads the gigabytes video directly to MinIO/AWS S3 without loading Node server!
   */
  public static async getPresignedUploadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileName, contentType } = req.body;

      if (!fileName) {
        res.status(400).json({ success: false, message: 'fileName is required' });
        return;
      }

      const detectedMime = contentType || mime.lookup(fileName) || 'video/mp4';
      const ext = path.extname(fileName);
      const sanitizedName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const storageKey = `videos/${Date.now()}-${uuidv4().substring(0, 8)}-${sanitizedName}${ext}`;

      const presignedData = await VideoController.storageService.getUploadPresignedUrl(
        storageKey,
        detectedMime,
        3600 // URL valid for 1 hour
      );

      res.status(200).json({
        success: true,
        message: 'Presigned upload URL generated successfully',
        data: {
          uploadUrl: presignedData.uploadUrl,
          key: presignedData.key,
          bucket: presignedData.bucket,
          expiresInSeconds: presignedData.expiresInSeconds,
          contentType: detectedMime,
          method: 'PUT',
          note: 'Make a PUT request to uploadUrl with the binary video file as the body and the Content-Type header set to the returned contentType.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Stream Video via HTTP 206 Partial Content
   * Enables seeking, skipping forward/backward in HTML5 video players.
   */
  public static async streamVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = VideoController.getParamKey(req);
      const range = req.headers.range;

      const { stream, contentLength, contentType, contentRange, acceptRanges } =
        await VideoController.storageService.getObjectStream(key, range);

      const headers: Record<string, string | number> = {
        'Content-Type': contentType || 'video/mp4',
        'Accept-Ranges': acceptRanges || 'bytes',
      };

      if (contentLength !== undefined) {
        headers['Content-Length'] = contentLength;
      }

      if (range && contentRange) {
        headers['Content-Range'] = contentRange;
        res.writeHead(206, headers);
      } else {
        res.writeHead(200, headers);
      }

      // Prevent memory / socket leak on aborted client requests (e.g. video seeking, tab close)
      res.on('close', () => {
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ success: false, message: 'Video not found' });
        return;
      }
      next(error);
    }
  }

  /**
   * 4. Get Presigned Download/Playback URL
   * Returns temporary signed URL for direct video streaming/downloading from MinIO or S3.
   */
  public static async getPresignedDownloadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const key = VideoController.getParamKey(req);
      const downloadUrl = await VideoController.storageService.getDownloadPresignedUrl(key);

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
   * 5. List Videos
   */
  public static async listVideos(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await VideoController.storageService.list('videos/');

      const formatted = items.map((item) => ({
        ...item,
        streamUrl: `/api/videos/${encodeURIComponent(item.key)}/stream`,
        presignedUrlEndpoint: `/api/videos/${encodeURIComponent(item.key)}/presigned-url`,
      }));

      res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. Delete Video
   */
  public static async deleteVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = VideoController.getParamKey(req);
      await VideoController.storageService.delete(key);

      res.status(200).json({
        success: true,
        message: `Video "${key}" deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

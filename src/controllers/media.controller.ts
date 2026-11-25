import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { IStorageService } from '../storage/storage.interface.js';
import { StorageFactory } from '../storage/storage.factory.js';
import { generateStorageKey, detectCategory, MediaCategory } from '../utils/media-type.util.js';

export class MediaController {
  private customStorageService?: IStorageService;

  constructor(storageService?: IStorageService) {
    this.customStorageService = storageService;
  }

  private get service(): IStorageService {
    return this.customStorageService || StorageFactory.getStorageService();
  }

  private static get defaultService(): IStorageService {
    return StorageFactory.getStorageService();
  }

  private static getParamKey(req: Request): string {
    const rawKey = req.params.key;
    const keyStr = Array.isArray(rawKey) ? rawKey[0] : (rawKey as string);
    return decodeURIComponent(keyStr);
  }

  /**
   * 1. Direct Server Upload
   */
  public uploadDirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const result = await this.service.upload({
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
  };

  /**
   * 2. Presigned URL Direct Upload
   */
  public getPresignedUploadUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

      const presignedData = await this.service.getUploadPresignedUrl(key, contentType, 3600);

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
  };

  /**
   * 3. View / Stream Media
   */
  public viewOrStreamMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = MediaController.getParamKey(req);
      const range = req.headers.range;

      const { stream, contentLength, contentType, contentRange, acceptRanges } =
        await this.service.getObjectStream(key, range);

      const resolvedContentType = contentType || 'application/octet-stream';

      const headers: Record<string, string | number> = {
        'Content-Type': resolvedContentType,
        'Accept-Ranges': acceptRanges || 'bytes',
        'Content-Disposition': 'inline',
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
        res.status(404).json({ success: false, message: 'Object not found in storage' });
        return;
      }
      next(error);
    }
  };

  /**
   * 4. Force File Download
   */
  public downloadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = MediaController.getParamKey(req);
      const fileName = path.basename(key);

      const { stream, contentLength, contentType } = await this.service.getObjectStream(key);

      const headers: Record<string, string | number> = {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      };

      if (contentLength !== undefined) {
        headers['Content-Length'] = contentLength;
      }

      res.writeHead(200, headers);

      // Prevent socket leak if client aborts download
      res.on('close', () => {
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ success: false, message: 'Object not found' });
        return;
      }
      next(error);
    }
  };

  /**
   * 5. Get Presigned Download/Playback URL
   */
  public getPresignedDownloadUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = MediaController.getParamKey(req);
      const downloadUrl = await this.service.getDownloadPresignedUrl(key);

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
  };

  /**
   * 6. List Media
   */
  public listMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string | undefined;
      const prefix = category ? `${category}/` : undefined;

      const items = await this.service.list(prefix);

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
  };

  /**
   * 7. Delete Media
   */
  public deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = MediaController.getParamKey(req);
      await this.service.delete(key);

      res.status(200).json({
        success: true,
        message: `Object "${key}" deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 8. Storage Statistics & Metrics
   */
  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prefix = req.query.prefix as string | undefined;
      const stats = await this.service.getStats(prefix);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  // Static backward compatibility wrappers for existing server routes
  private static defaultController = new MediaController();
  public static uploadDirect = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.uploadDirect(req, res, next);
  public static getPresignedUploadUrl = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.getPresignedUploadUrl(req, res, next);
  public static viewOrStreamMedia = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.viewOrStreamMedia(req, res, next);
  public static downloadMedia = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.downloadMedia(req, res, next);
  public static getPresignedDownloadUrl = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.getPresignedDownloadUrl(req, res, next);
  public static listMedia = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.listMedia(req, res, next);
  public static deleteMedia = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.deleteMedia(req, res, next);
  public static getStats = (req: Request, res: Response, next: NextFunction) =>
    MediaController.defaultController.getStats(req, res, next);
}

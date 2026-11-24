import path from 'path';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

export type MediaCategory = 'images' | 'videos' | 'audio' | 'documents' | 'files';

/**
 * Detects category based on MIME type or file extension
 */
export function detectCategory(mimeType?: string, fileName?: string): MediaCategory {
  let resolvedMime = mimeType;
  if (!resolvedMime && fileName) {
    resolvedMime = (mime.lookup(fileName) || '') as string;
  }

  if (!resolvedMime) {
    return 'files';
  }

  if (resolvedMime.startsWith('image/')) return 'images';
  if (resolvedMime.startsWith('video/')) return 'videos';
  if (resolvedMime.startsWith('audio/')) return 'audio';

  if (
    resolvedMime.includes('pdf') ||
    resolvedMime.includes('document') ||
    resolvedMime.includes('sheet') ||
    resolvedMime.includes('presentation') ||
    resolvedMime.includes('msword') ||
    resolvedMime.startsWith('text/')
  ) {
    return 'documents';
  }

  return 'files';
}

/**
 * Generates a clean, timestamped, collision-free storage key organized by category.
 * Example: images/1795507085667-b0f9c686-profile_photo.png
 */
export function generateStorageKey(
  originalName: string,
  mimeType?: string,
  preferredCategory?: MediaCategory
): { key: string; category: MediaCategory; contentType: string } {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const contentType = mimeType || (mime.lookup(originalName) as string) || 'application/octet-stream';
  const category = preferredCategory || detectCategory(contentType, originalName);

  const key = `${category}/${Date.now()}-${uuidv4().substring(0, 8)}-${base}${ext}`;

  return { key, category, contentType };
}

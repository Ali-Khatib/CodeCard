import { FILE_LIMITS } from '@codecard/config';
import { PROJECT_MEDIA_IMAGE_MIME_TYPES } from '@codecard/validation';
import type { StorageResourceType } from '@/lib/storage/path';
import { isAllowedStorageExtension, normalizeStorageExtension } from '@/lib/storage/path';

const BLOCKED_EXTENSIONS = new Set([
  'svg',
  'html',
  'htm',
  'js',
  'mjs',
  'cjs',
  'exe',
  'bat',
  'cmd',
  'sh',
  'php',
  'jar',
  'vbs',
]);

const MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'application/pdf': ['pdf'],
};

export type UploadValidationResult =
  | { ok: true; extension: string; mimeType: string; maxBytes: number }
  | { ok: false; status: 400 | 413 | 415; message: string };

function maxBytesForResourceType(resourceType: StorageResourceType): number {
  switch (resourceType) {
    case 'avatar':
      return FILE_LIMITS.image.maxBytes;
    case 'project-media':
      return Math.max(FILE_LIMITS.image.maxBytes, FILE_LIMITS.video.maxBytes);
    case 'private-doc':
      return FILE_LIMITS.document.maxBytes;
    case 'research-figure':
      return FILE_LIMITS.image.maxBytes;
    default:
      return FILE_LIMITS.image.maxBytes;
  }
}

function allowedMimeTypesForResourceType(
  resourceType: StorageResourceType,
  mediaRole?: 'poster' | 'screenshot',
): readonly string[] {
  if (resourceType === 'project-media' && mediaRole) {
    return PROJECT_MEDIA_IMAGE_MIME_TYPES;
  }

  switch (resourceType) {
    case 'avatar':
      return FILE_LIMITS.image.mimeTypes;
    case 'project-media':
      return [...FILE_LIMITS.image.mimeTypes, ...FILE_LIMITS.video.mimeTypes];
    case 'private-doc':
      return FILE_LIMITS.document.mimeTypes;
    case 'research-figure':
      return PROJECT_MEDIA_IMAGE_MIME_TYPES;
    default:
      return FILE_LIMITS.image.mimeTypes;
  }
}

export function extractUploadExtension(filename: string): string | null {
  const trimmed = filename.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    return null;
  }

  const parts = trimmed.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const extension = parts[1]?.trim().toLowerCase();
  if (!extension || !/^[a-z0-9]{2,5}$/.test(extension)) {
    return null;
  }

  return extension;
}

export function validateUploadMetadata(input: {
  resourceType: StorageResourceType;
  filename: string;
  mimeType: string;
  size: number;
  mediaRole?: 'poster' | 'screenshot';
}): UploadValidationResult {
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, status: 400, message: 'File size must be greater than zero.' };
  }

  const extension = extractUploadExtension(input.filename);
  if (!extension) {
    return { ok: false, status: 400, message: 'Invalid filename.' };
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  const normalizedMime = input.mimeType.trim().toLowerCase();
  const allowedMimeTypes = allowedMimeTypesForResourceType(input.resourceType, input.mediaRole);
  if (!allowedMimeTypes.includes(normalizedMime as (typeof allowedMimeTypes)[number])) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  const mimeExtensions = MIME_TO_EXTENSIONS[normalizedMime] ?? [];
  if (!mimeExtensions.includes(extension)) {
    return { ok: false, status: 415, message: 'File type does not match filename.' };
  }

  if (!isAllowedStorageExtension(input.resourceType, extension)) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  const maxBytes = maxBytesForResourceType(input.resourceType);
  if (input.size > maxBytes) {
    return { ok: false, status: 413, message: 'File is too large.' };
  }

  return {
    ok: true,
    extension: normalizeStorageExtension(extension),
    mimeType: normalizedMime,
    maxBytes,
  };
}

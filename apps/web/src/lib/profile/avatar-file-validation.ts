import { FILE_LIMITS } from '@codecard/config';

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
};

export type AvatarFileValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; status: 400 | 413 | 415; message: string };

function extractAvatarExtension(filename: string): string | null {
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

export function validateAvatarFileMetadata(input: {
  filename: string;
  mimeType: string;
  size: number;
}): AvatarFileValidationResult {
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, status: 400, message: 'File size must be greater than zero.' };
  }

  const extension = extractAvatarExtension(input.filename);
  if (!extension) {
    return { ok: false, status: 400, message: 'Invalid filename.' };
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  const normalizedMime = input.mimeType.trim().toLowerCase();
  const allowedMimeTypes = FILE_LIMITS.image.mimeTypes.filter(
    (mime) => mime !== 'image/avif',
  );
  if (!allowedMimeTypes.includes(normalizedMime as (typeof allowedMimeTypes)[number])) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  const mimeExtensions = MIME_TO_EXTENSIONS[normalizedMime] ?? [];
  if (!mimeExtensions.includes(extension)) {
    return { ok: false, status: 415, message: 'File type does not match filename.' };
  }

  const allowedExtensions = FILE_LIMITS.image.extensions.filter((ext) => ext !== 'avif');
  if (!allowedExtensions.includes(extension as (typeof allowedExtensions)[number])) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  if (input.size > FILE_LIMITS.image.maxBytes) {
    return { ok: false, status: 413, message: 'File is too large.' };
  }

  return { ok: true, mimeType: normalizedMime };
}

export function mapAvatarValidationMessage(
  result: Extract<AvatarFileValidationResult, { ok: false }>,
): string {
  if (result.status === 413) {
    return 'Image must be 5 MB or smaller.';
  }
  if (result.status === 415) {
    return 'Use a JPEG, PNG, or WebP image.';
  }
  return result.message;
}

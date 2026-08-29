/**
 * Content-prefix (magic-byte) checks for signed upload intents.
 * Intent APIs never receive the full file; clients send the first bytes so the
 * server can reject spoofed MIME/extension before issuing a signed URL.
 * Finalize still re-verifies the stored object (defense in depth).
 */

import {
  detectImageMimeFromMagicBytes,
  looksLikeActiveOrNonImageContent,
  mimeMatchesDetected,
} from '@/lib/storage/content-signature';

export const UPLOAD_CONTENT_PREFIX_BYTES = 32;
/** Base64 of 32 bytes is ~44 chars; allow padding / small headroom. */
export const UPLOAD_CONTENT_PREFIX_BASE64_MAX = 96;

export type UploadContentPrefixResult =
  | { ok: true }
  | { ok: false; status: 400 | 415; message: string };

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > UPLOAD_CONTENT_PREFIX_BASE64_MAX) return null;
  if (!/^[A-Za-z0-9+/]+=*$/.test(trimmed)) return null;
  try {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(trimmed, 'base64'));
    }
    const binary = atob(trimmed);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

export function encodeContentPrefixBase64(bytes: Uint8Array): string {
  return bytesToBase64(bytes.slice(0, UPLOAD_CONTENT_PREFIX_BYTES));
}

export async function readFileContentPrefixBase64(
  file: Blob,
  byteCount = UPLOAD_CONTENT_PREFIX_BYTES,
): Promise<string> {
  const buf = new Uint8Array(await file.slice(0, byteCount).arrayBuffer());
  return encodeContentPrefixBase64(buf);
}

/**
 * Validate that the declared MIME matches magic bytes in the content prefix,
 * and reject HTML/SVG/PDF/active masquerades.
 */
export function validateUploadContentPrefix(input: {
  mimeType: string;
  contentPrefixBase64: string;
}): UploadContentPrefixResult {
  const bytes = base64ToBytes(input.contentPrefixBase64);
  if (!bytes || bytes.length < 3) {
    return { ok: false, status: 400, message: 'Invalid file content preview.' };
  }

  if (looksLikeActiveOrNonImageContent(bytes)) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  const detected = detectImageMimeFromMagicBytes(bytes);
  if (!mimeMatchesDetected(input.mimeType, detected)) {
    return { ok: false, status: 415, message: 'Unsupported file type.' };
  }

  return { ok: true };
}

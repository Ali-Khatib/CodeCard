import type { SupabaseClient } from '@supabase/supabase-js';
import {
  detectImageMimeFromMagicBytes,
  looksLikeActiveOrNonImageContent,
  mimeMatchesDetected,
} from '@/lib/storage/content-signature';

const SNIFF_BYTES = 16;

export type StoredImageVerification =
  | { ok: true; detectedMime: string; size: number }
  | { ok: false; reason: 'missing' | 'too_large' | 'active_content' | 'magic_mismatch' | 'read_failed' };

/**
 * Download object bytes (bounded) and verify raster magic bytes against declared MIME/size.
 */
export async function verifyStoredRasterImage(options: {
  supabase: SupabaseClient;
  bucket: string;
  path: string;
  declaredMime: string;
  maxBytes: number;
}): Promise<StoredImageVerification> {
  const { supabase, bucket, path, declaredMime, maxBytes } = options;

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    return { ok: false, reason: error ? 'read_failed' : 'missing' };
  }

  const buffer = new Uint8Array(await data.arrayBuffer());
  if (buffer.length === 0) return { ok: false, reason: 'missing' };
  if (buffer.length > maxBytes) return { ok: false, reason: 'too_large' };

  const sniff = buffer.slice(0, Math.min(SNIFF_BYTES, buffer.length));
  if (looksLikeActiveOrNonImageContent(sniff)) {
    return { ok: false, reason: 'active_content' };
  }

  const detected = detectImageMimeFromMagicBytes(sniff);
  if (!mimeMatchesDetected(declaredMime, detected)) {
    return { ok: false, reason: 'magic_mismatch' };
  }

  return { ok: true, detectedMime: detected!, size: buffer.length };
}

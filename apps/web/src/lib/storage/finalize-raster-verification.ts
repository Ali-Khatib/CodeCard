import { FILE_LIMITS, STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageResourceType } from '@/lib/storage/path';
import { loadOpenUploadIntent, markUploadIntentFinalized } from '@/lib/storage/upload-intents';
import { verifyStoredRasterImage } from '@/lib/storage/verify-stored-image';
import { bestEffortRemoveTrustedStorageObject } from '@/lib/storage/storage-cleanup';

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function declaredMimeFromImagePath(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXT_TO_MIME[ext] ?? null;
}

function bucketForResource(resourceType: StorageResourceType): string {
  if (resourceType === 'avatar') return STORAGE_BUCKETS.avatars;
  if (resourceType === 'project-media' || resourceType === 'research-figure') {
    return STORAGE_BUCKETS.projectMedia;
  }
  return STORAGE_BUCKETS.privateDocs;
}

/**
 * Before attaching a stored raster object to a DB record: verify magic bytes
 * against the signed-upload intent (or path extension fallback) and remove
 * unsafe objects.
 */
export async function requireVerifiedRasterObjectForFinalize(
  supabase: SupabaseClient,
  input: {
    path: string;
    resourceType: Extract<StorageResourceType, 'avatar' | 'project-media' | 'research-figure'>;
  },
): Promise<
  | { ok: true; detectedMime: string; size: number }
  | { ok: false }
> {
  const bucket = bucketForResource(input.resourceType);
  const intent = await loadOpenUploadIntent(supabase, input.path);
  const declaredMime = intent?.mime_type ?? declaredMimeFromImagePath(input.path);
  const maxBytes = intent?.max_bytes ?? FILE_LIMITS.image.maxBytes;

  if (!declaredMime) {
    await bestEffortRemoveTrustedStorageObject(supabase, {
      resourceType: input.resourceType,
      path: input.path,
    });
    return { ok: false };
  }

  if (intent && intent.bucket !== bucket) {
    await bestEffortRemoveTrustedStorageObject(supabase, {
      resourceType: input.resourceType,
      path: input.path,
    });
    return { ok: false };
  }

  const verified = await verifyStoredRasterImage({
    supabase,
    bucket,
    path: input.path,
    declaredMime,
    maxBytes,
  });

  if (!verified.ok) {
    await bestEffortRemoveTrustedStorageObject(supabase, {
      resourceType: input.resourceType,
      path: input.path,
    });
    return { ok: false };
  }

  return {
    ok: true,
    detectedMime: verified.detectedMime,
    size: verified.size,
  };
}

export async function completeUploadIntentAfterFinalize(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  await markUploadIntentFinalized(supabase, path);
}

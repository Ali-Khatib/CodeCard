import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageResourceType } from '@/lib/storage/path';
import { bucketForStorageResourceType, parseCanonicalStoragePath } from '@/lib/storage/path';

export type TrustedStorageCleanupResult =
  | { ok: true; removed: boolean }
  | { ok: false; reason: 'invalid_path' | 'remove_failed' };

/**
 * Removes a storage object only after the caller has already verified ownership.
 * Path must already be a canonical owner-scoped object key (never a URL or client-supplied value).
 */
export async function removeTrustedStorageObject(
  supabase: SupabaseClient,
  input: {
    resourceType: StorageResourceType;
    path: string;
  },
): Promise<TrustedStorageCleanupResult> {
  if (
    typeof input.path !== 'string' ||
    !input.path.trim() ||
    input.path !== input.path.trim() ||
    input.path.includes('://') ||
    input.path.startsWith('/') ||
    input.path.includes('..')
  ) {
    return { ok: false, reason: 'invalid_path' };
  }

  let segments;
  try {
    segments = parseCanonicalStoragePath(input.path);
  } catch {
    return { ok: false, reason: 'invalid_path' };
  }

  if (segments.resourceType !== input.resourceType) {
    return { ok: false, reason: 'invalid_path' };
  }

  const bucket = bucketForStorageResourceType(input.resourceType);
  if (
    (input.resourceType === 'avatar' && bucket !== STORAGE_BUCKETS.avatars) ||
    (input.resourceType === 'project-media' && bucket !== STORAGE_BUCKETS.projectMedia) ||
    (input.resourceType === 'research-figure' && bucket !== STORAGE_BUCKETS.projectMedia) ||
    (input.resourceType === 'private-doc' && bucket !== STORAGE_BUCKETS.privateDocs)
  ) {
    return { ok: false, reason: 'invalid_path' };
  }

  const { error } = await supabase.storage.from(bucket).remove([input.path]);
  if (error) {
    return { ok: false, reason: 'remove_failed' };
  }

  return { ok: true, removed: true };
}

/**
 * Best-effort owner-scoped cleanup after a successful DB reference change.
 * Never throws; orphan reconciliation remains WS04-T010.
 */
export async function bestEffortRemoveTrustedStorageObject(
  supabase: SupabaseClient,
  input: {
    resourceType: StorageResourceType;
    path: string | null | undefined;
  },
): Promise<{ cleaned: boolean }> {
  if (!input.path) {
    return { cleaned: false };
  }

  const result = await removeTrustedStorageObject(supabase, {
    resourceType: input.resourceType,
    path: input.path,
  });

  return { cleaned: result.ok && result.removed };
}

export function extractAvatarPathFromPublicUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  const trimmed = avatarUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    try {
      parseCanonicalStoragePath(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }

    const marker = `/storage/v1/object/public/${STORAGE_BUCKETS.avatars}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) {
      return null;
    }

    const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    if (!path || path.includes('..')) {
      return null;
    }

    parseCanonicalStoragePath(path);
    return path;
  } catch {
    return null;
  }
}

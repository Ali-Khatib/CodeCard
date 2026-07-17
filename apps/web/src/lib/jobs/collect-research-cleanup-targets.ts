import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '@codecard/config';
import { listTrustedResearchFigureStoragePaths } from '@/lib/research/research-figure-core';
import {
  buildStorageCleanupPayload,
  type StorageCleanupObject,
  type StorageCleanupPayload,
} from '@/lib/jobs/cleanup-storage-payload';

/**
 * Capture research-figure storage targets before paper deletion cascades.
 * External PDF / image URLs are ignored.
 */
export async function collectResearchStorageCleanupTargets(
  supabase: SupabaseClient,
  input: {
    paper: { id: string; tenant_id: string; owner_user_id: string };
    userId: string;
  },
): Promise<
  | { ok: true; payload: StorageCleanupPayload | null }
  | { ok: false; reason: 'query_failed' | 'invalid_targets' }
> {
  const paths = await listTrustedResearchFigureStoragePaths(
    supabase,
    input.paper.id,
    input.paper,
    input.userId,
  );

  const objects: StorageCleanupObject[] = paths.map((path) => ({
    bucket: STORAGE_BUCKETS.projectMedia,
    path,
    resource_type: 'research-figure' as const,
  }));

  if (objects.length === 0) {
    return { ok: true, payload: null };
  }

  const built = buildStorageCleanupPayload({
    resourceType: 'research',
    resourceId: input.paper.id,
    ownerUserId: input.paper.owner_user_id,
    tenantId: input.paper.tenant_id,
    objects,
  });

  if (!built.ok) {
    return { ok: false, reason: 'invalid_targets' };
  }

  return { ok: true, payload: built.payload };
}

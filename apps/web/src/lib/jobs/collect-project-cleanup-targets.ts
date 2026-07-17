import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '@codecard/config';
import { assertOwnedProjectMediaStoragePath } from '@/lib/projects/project-media-core';
import {
  buildStorageCleanupPayload,
  type StorageCleanupObject,
  type StorageCleanupPayload,
} from '@/lib/jobs/cleanup-storage-payload';

/**
 * Capture project-media storage targets before DB cascade removes rows.
 */
export async function collectProjectStorageCleanupTargets(
  supabase: SupabaseClient,
  input: {
    project: { id: string; tenant_id: string; owner_user_id: string };
    userId: string;
  },
): Promise<
  | { ok: true; payload: StorageCleanupPayload | null }
  | { ok: false; reason: 'query_failed' | 'invalid_targets' }
> {
  const { data, error } = await supabase
    .from('project_media_assets')
    .select('id, type, storage_path')
    .eq('project_id', input.project.id);

  if (error) {
    return { ok: false, reason: 'query_failed' };
  }

  const objects: StorageCleanupObject[] = [];
  for (const row of data ?? []) {
    const path = row.storage_path as string | null;
    if (!path) continue;

    const role = row.type === 'poster' ? 'poster' : 'screenshot';
    const check = assertOwnedProjectMediaStoragePath(
      path,
      input.project,
      input.userId,
      role as 'poster' | 'screenshot',
    );
    if (!check.ok) {
      return { ok: false, reason: 'invalid_targets' };
    }

    objects.push({
      bucket: STORAGE_BUCKETS.projectMedia,
      path,
      resource_type: 'project-media',
    });
  }

  if (objects.length === 0) {
    return { ok: true, payload: null };
  }

  const built = buildStorageCleanupPayload({
    resourceType: 'project',
    resourceId: input.project.id,
    ownerUserId: input.project.owner_user_id,
    tenantId: input.project.tenant_id,
    objects,
  });

  if (!built.ok) {
    return { ok: false, reason: 'invalid_targets' };
  }

  return { ok: true, payload: built.payload };
}

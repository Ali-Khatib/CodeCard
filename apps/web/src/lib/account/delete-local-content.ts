import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '@codecard/config';
import {
  extractAvatarPathFromPublicUrl,
} from '@/lib/storage/storage-cleanup';
import { parseCanonicalStoragePath } from '@/lib/storage/path';
import {
  buildStorageCleanupPayload,
  type StorageCleanupObject,
  type StorageCleanupPayload,
} from '@/lib/jobs/cleanup-storage-payload';
import { collectProjectStorageCleanupTargets } from '@/lib/jobs/collect-project-cleanup-targets';
import { collectResearchStorageCleanupTargets } from '@/lib/jobs/collect-research-cleanup-targets';
import { enqueueStorageCleanupJob } from '@/lib/jobs/cleanup-storage';

/**
 * Internal local-content + storage-preparation stage for account deletion.
 *
 * MUST NOT be invoked by the production route while T005–T008 capabilities are missing.
 * Preserves: auth.users, Stripe/local billing, analytics, audit_logs, moderation/DMCA, jobs.
 */

export type LocalAccountDeletionContext = {
  ownerUserId: string;
  tenantId: string;
  profileId: string;
};

export type LocalAccountDeletionResult =
  | {
      ok: true;
      deleted: {
        profileLinks: boolean;
        projects: number;
        researchPapers: number;
        savedConnections: boolean;
        collections: boolean;
      };
      cleanupJobId: string | null;
      objectCount: number;
    }
  | { ok: false; reason: 'query_failed' | 'invalid_targets' | 'enqueue_failed' | 'delete_failed' };

export async function assertPersonalTenantSoleMember(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<{ ok: true } | { ok: false; reason: 'shared_tenant' | 'query_failed' }> {
  const { count, error } = await supabase
    .from('tenant_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error || count == null) {
    return { ok: false, reason: 'query_failed' };
  }

  if (count > 1) {
    return { ok: false, reason: 'shared_tenant' };
  }

  return { ok: true };
}

export async function collectAccountStorageCleanupTargets(
  supabase: SupabaseClient,
  ctx: LocalAccountDeletionContext,
): Promise<
  | { ok: true; payload: StorageCleanupPayload | null }
  | { ok: false; reason: 'query_failed' | 'invalid_targets' }
> {
  const objects: StorageCleanupObject[] = [];

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, avatar_url, tenant_id, owner_user_id')
    .eq('id', ctx.profileId)
    .eq('owner_user_id', ctx.ownerUserId)
    .maybeSingle();

  if (profileError) return { ok: false, reason: 'query_failed' };
  if (!profile) return { ok: false, reason: 'query_failed' };

  const avatarPath = extractAvatarPathFromPublicUrl(profile.avatar_url);
  if (avatarPath) {
    try {
      const segments = parseCanonicalStoragePath(avatarPath);
      if (
        segments.resourceType === 'avatar' &&
        segments.ownerUserId === ctx.ownerUserId &&
        segments.tenantId === ctx.tenantId
      ) {
        objects.push({
          bucket: STORAGE_BUCKETS.avatars,
          path: avatarPath,
          resource_type: 'avatar',
        });
      }
    } catch {
      // Ignore non-canonical avatar references (external URLs already filtered).
    }
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, tenant_id, owner_user_id')
    .eq('owner_user_id', ctx.ownerUserId)
    .eq('profile_id', ctx.profileId);

  if (projectsError) return { ok: false, reason: 'query_failed' };

  for (const project of projects ?? []) {
    const collected = await collectProjectStorageCleanupTargets(supabase, {
      project: {
        id: project.id,
        tenant_id: project.tenant_id,
        owner_user_id: project.owner_user_id,
      },
      userId: ctx.ownerUserId,
    });
    if (!collected.ok) return { ok: false, reason: collected.reason };
    if (collected.payload) {
      objects.push(...collected.payload.objects);
    }
  }

  const { data: papers, error: papersError } = await supabase
    .from('research_papers')
    .select('id, tenant_id, owner_user_id')
    .eq('owner_user_id', ctx.ownerUserId)
    .eq('profile_id', ctx.profileId);

  if (papersError) return { ok: false, reason: 'query_failed' };

  for (const paper of papers ?? []) {
    const collected = await collectResearchStorageCleanupTargets(supabase, {
      paper: {
        id: paper.id,
        tenant_id: paper.tenant_id,
        owner_user_id: paper.owner_user_id,
      },
      userId: ctx.ownerUserId,
    });
    if (!collected.ok) return { ok: false, reason: collected.reason };
    if (collected.payload) {
      objects.push(...collected.payload.objects);
    }
  }

  if (objects.length === 0) {
    return { ok: true, payload: null };
  }

  const built = buildStorageCleanupPayload({
    resourceType: 'account',
    resourceId: ctx.profileId,
    ownerUserId: ctx.ownerUserId,
    tenantId: ctx.tenantId,
    objects,
  });

  if (!built.ok) return { ok: false, reason: 'invalid_targets' };
  return { ok: true, payload: built.payload };
}

/**
 * Delete approved local account content after cleanup job is durably enqueued.
 * Does not touch Auth, Stripe, analytics, audit_logs, or moderation/DMCA.
 */
export async function executeLocalAccountContentDeletion(
  supabase: SupabaseClient,
  serviceSupabase: SupabaseClient,
  ctx: LocalAccountDeletionContext,
): Promise<LocalAccountDeletionResult> {
  const targets = await collectAccountStorageCleanupTargets(supabase, ctx);
  if (!targets.ok) {
    return { ok: false, reason: targets.reason };
  }

  let cleanupJobId: string | null = null;
  let objectCount = 0;

  if (targets.payload) {
    objectCount = targets.payload.objects.length;
    const enqueued = await enqueueStorageCleanupJob(serviceSupabase, {
      tenantId: ctx.tenantId,
      payload: targets.payload,
    });
    if (!enqueued.ok) {
      return { ok: false, reason: 'enqueue_failed' };
    }
    cleanupJobId = enqueued.jobId;
  }

  // Private organizational data (owner-scoped).
  const { error: notesError } = await supabase
    .from('connection_notes')
    .delete()
    .eq('owner_user_id', ctx.ownerUserId);
  if (notesError) return { ok: false, reason: 'delete_failed' };

  // collection_items cascade when collections are deleted.
  const { error: collectionsError } = await supabase
    .from('collections')
    .delete()
    .eq('owner_user_id', ctx.ownerUserId);
  if (collectionsError) return { ok: false, reason: 'delete_failed' };

  const { error: connectionsError } = await supabase
    .from('saved_connections')
    .delete()
    .eq('owner_user_id', ctx.ownerUserId);
  if (connectionsError) return { ok: false, reason: 'delete_failed' };

  const { data: papers, error: papersListError } = await supabase
    .from('research_papers')
    .select('id')
    .eq('owner_user_id', ctx.ownerUserId)
    .eq('profile_id', ctx.profileId);
  if (papersListError) return { ok: false, reason: 'delete_failed' };

  const { error: researchError } = await supabase
    .from('research_papers')
    .delete()
    .eq('owner_user_id', ctx.ownerUserId)
    .eq('profile_id', ctx.profileId);
  if (researchError) return { ok: false, reason: 'delete_failed' };

  const { data: projects, error: projectsListError } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_user_id', ctx.ownerUserId)
    .eq('profile_id', ctx.profileId);
  if (projectsListError) return { ok: false, reason: 'delete_failed' };

  const { error: projectsError } = await supabase
    .from('projects')
    .delete()
    .eq('owner_user_id', ctx.ownerUserId)
    .eq('profile_id', ctx.profileId);
  if (projectsError) return { ok: false, reason: 'delete_failed' };

  const { error: linksError } = await supabase
    .from('profile_links')
    .delete()
    .eq('profile_id', ctx.profileId);
  if (linksError) return { ok: false, reason: 'delete_failed' };

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', ctx.profileId)
    .eq('owner_user_id', ctx.ownerUserId);
  if (profileError) return { ok: false, reason: 'delete_failed' };

  return {
    ok: true,
    deleted: {
      profileLinks: true,
      projects: projects?.length ?? 0,
      researchPapers: papers?.length ?? 0,
      savedConnections: true,
      collections: true,
    },
    cleanupJobId,
    objectCount,
  };
}

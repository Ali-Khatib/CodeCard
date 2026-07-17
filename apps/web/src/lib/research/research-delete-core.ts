import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedResearchPaper,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/research/research-access-core';
import { collectResearchStorageCleanupTargets } from '@/lib/jobs/collect-research-cleanup-targets';
import {
  cancelStorageCleanupJob,
  enqueueStorageCleanupJob,
  processStorageCleanupJobById,
} from '@/lib/jobs/cleanup-storage';

export type ResearchDeleteState = {
  success?: boolean;
  alreadyDeleted?: boolean;
  error?: string;
  errorCode?: 'auth' | 'not_found' | 'server';
  researchPaperId?: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  wasPublished?: boolean;
  redirectTo?: string;
  cleanupWarning?: boolean;
};

export type ResearchDeleteOptions = {
  user?: AuthUser | null;
  createServiceClient?: () => Promise<SupabaseClient>;
};

/**
 * Deletes an owned research paper.
 *
 * Idempotency: if the paper is already gone or not visible to this owner,
 * return a safe already-removed success without revealing whether a foreign
 * paper exists. Related projects and external PDF URLs are never deleted remotely.
 * research_figures cascade via FK after the paper row is removed.
 * CodeCard-owned figure objects are cleaned via durable WS04-T010 jobs.
 */
export async function executeDeleteResearch(
  supabase: SupabaseClient,
  researchPaperId: string,
  options?: ResearchDeleteOptions,
): Promise<ResearchDeleteState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(researchPaperId)) {
    return {
      success: true,
      alreadyDeleted: true,
      redirectTo: '/dashboard/research',
    };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId,
  });

  if ('error' in owned) {
    if (owned.errorCode === 'not_found') {
      return {
        success: true,
        alreadyDeleted: true,
        researchPaperId,
        redirectTo: '/dashboard/research',
      };
    }
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { paper, profile } = owned;

  const targets = await collectResearchStorageCleanupTargets(supabase, {
    paper,
    userId: auth.user.id,
  });
  if (!targets.ok) {
    return {
      error: 'Could not delete this research paper. Please try again.',
      errorCode: 'server',
    };
  }

  let jobId: string | null = null;
  let service: SupabaseClient | null = null;

  if (targets.payload) {
    if (!options?.createServiceClient) {
      return {
        error: 'Could not delete this research paper. Please try again.',
        errorCode: 'server',
      };
    }

    try {
      service = await options.createServiceClient();
    } catch {
      return {
        error: 'Could not delete this research paper. Please try again.',
        errorCode: 'server',
      };
    }

    const enqueued = await enqueueStorageCleanupJob(service, {
      tenantId: paper.tenant_id,
      payload: targets.payload,
    });
    if (!enqueued.ok) {
      return {
        error: 'Could not delete this research paper. Please try again.',
        errorCode: 'server',
      };
    }
    jobId = enqueued.jobId;
  }

  const { error } = await supabase
    .from('research_papers')
    .delete()
    .eq('id', paper.id)
    .eq('owner_user_id', auth.user.id);

  if (error) {
    if (jobId && service) {
      await cancelStorageCleanupJob(service, jobId, 'content_delete_failed');
    }
    return {
      error: 'Could not delete this research paper. Please try again.',
      errorCode: 'server',
    };
  }

  let cleanupWarning = false;
  if (jobId && service) {
    const processed = await processStorageCleanupJobById(service, jobId);
    if (!processed.ok) {
      cleanupWarning = true;
    }
  }

  return {
    success: true,
    researchPaperId: paper.id,
    paperSlug: paper.slug,
    profileSlug: profile.slug,
    wasPublished: paper.is_published,
    redirectTo: '/dashboard/research',
    cleanupWarning: cleanupWarning || undefined,
  };
}

/** Figure cleanup uses durable WS04-T010 jobs with immediate drain after delete. */
export const RESEARCH_DELETE_STORAGE_DEFERRED = false;

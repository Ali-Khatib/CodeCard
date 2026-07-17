import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedProject,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/projects/project-access-core';
import { collectProjectStorageCleanupTargets } from '@/lib/jobs/collect-project-cleanup-targets';
import {
  cancelStorageCleanupJob,
  enqueueStorageCleanupJob,
  processStorageCleanupJobById,
} from '@/lib/jobs/cleanup-storage';

export type ProjectDeleteState = {
  success?: boolean;
  error?: string;
  errorCode?: 'auth' | 'not_found' | 'server';
  projectId?: string;
  profileSlug?: string | null;
  wasPublished?: boolean;
  redirectTo?: string;
  cleanupWarning?: boolean;
};

export type ProjectDeleteOptions = {
  user?: AuthUser | null;
  /** Server-only service client factory for durable cleanup jobs. */
  createServiceClient?: () => Promise<SupabaseClient>;
};

export async function executeDeleteProject(
  supabase: SupabaseClient,
  projectId: string,
  options?: ProjectDeleteOptions,
): Promise<ProjectDeleteState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  const owned = await loadOwnedProject(supabase, {
    userId: auth.user.id,
    projectId,
  });
  if ('error' in owned) {
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { project, profile } = owned;

  const targets = await collectProjectStorageCleanupTargets(supabase, {
    project,
    userId: auth.user.id,
  });
  if (!targets.ok) {
    return {
      error: 'Could not delete this project. Please try again.',
      errorCode: 'server',
    };
  }

  let jobId: string | null = null;
  let service: SupabaseClient | null = null;

  if (targets.payload) {
    if (!options?.createServiceClient) {
      return {
        error: 'Could not delete this project. Please try again.',
        errorCode: 'server',
      };
    }

    try {
      service = await options.createServiceClient();
    } catch {
      return {
        error: 'Could not delete this project. Please try again.',
        errorCode: 'server',
      };
    }

    const enqueued = await enqueueStorageCleanupJob(service, {
      tenantId: project.tenant_id,
      payload: targets.payload,
    });
    if (!enqueued.ok) {
      return {
        error: 'Could not delete this project. Please try again.',
        errorCode: 'server',
      };
    }
    jobId = enqueued.jobId;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', project.id)
    .eq('owner_user_id', auth.user.id);

  if (error) {
    if (jobId && service) {
      await cancelStorageCleanupJob(service, jobId, 'content_delete_failed');
    }
    return {
      error: 'Could not delete this project. Please try again.',
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
    projectId: project.id,
    profileSlug: profile.slug,
    wasPublished: project.is_published,
    redirectTo: '/dashboard/projects',
    cleanupWarning: cleanupWarning || undefined,
  };
}

/**
 * Project deletion enqueues durable storage cleanup (WS04-T010) before cascade,
 * then drains the job immediately. Residual failures remain retryable via jobs.
 */
export const PROJECT_DELETE_STORAGE_DEFERRED = false;

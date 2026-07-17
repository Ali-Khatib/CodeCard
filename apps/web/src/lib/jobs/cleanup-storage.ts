import type { SupabaseClient } from '@supabase/supabase-js';
import {
  STORAGE_CLEANUP_JOB_TYPE,
  STORAGE_CLEANUP_MAX_ATTEMPTS,
  computeCleanupRetryDelaySeconds,
  parseStorageCleanupPayload,
  type StorageCleanupPayload,
} from '@/lib/jobs/cleanup-storage-payload';
import { removeTrustedStorageObject } from '@/lib/storage/storage-cleanup';
import type { StorageResourceType } from '@/lib/storage/path';

export type StorageCleanupJobRow = {
  id: string;
  tenant_id: string | null;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: unknown;
  result: unknown;
  error: string | null;
  attempts: number;
  available_at: string;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProcessStorageCleanupResult =
  | { ok: true; jobId: string; removedCount: number; alreadyMissingCount: number }
  | {
      ok: false;
      jobId?: string;
      reason:
        | 'no_job'
        | 'malformed_payload'
        | 'storage_failure'
        | 'claim_failed'
        | 'terminal_failure'
        | 'update_failed';
      retryable: boolean;
    };

/**
 * Remove one validated cleanup object. Missing objects count as success.
 */
export async function removeStorageObjectWithMissingTolerance(
  supabase: SupabaseClient,
  object: StorageCleanupPayload['objects'][number],
): Promise<
  | { ok: true; removed: boolean; alreadyMissing: boolean }
  | { ok: false; category: 'invalid_path' | 'temporary_storage_failure' }
> {
  const trusted = await removeTrustedStorageObject(supabase, {
    resourceType: object.resource_type as StorageResourceType,
    path: object.path,
  });

  if (trusted.ok) {
    return {
      ok: true,
      removed: trusted.removed,
      alreadyMissing: !trusted.removed,
    };
  }

  if (trusted.reason === 'invalid_path') {
    return { ok: false, category: 'invalid_path' };
  }

  return { ok: false, category: 'temporary_storage_failure' };
}

export async function enqueueStorageCleanupJob(
  serviceSupabase: SupabaseClient,
  input: {
    tenantId: string;
    payload: StorageCleanupPayload;
  },
): Promise<{ ok: true; jobId: string } | { ok: false; reason: 'insert_failed' }> {
  const { data, error } = await serviceSupabase
    .from('jobs')
    .insert({
      tenant_id: input.tenantId,
      type: STORAGE_CLEANUP_JOB_TYPE,
      status: 'pending',
      payload: input.payload,
      attempts: 0,
      available_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    return { ok: false, reason: 'insert_failed' };
  }

  return { ok: true, jobId: data.id as string };
}

export async function cancelStorageCleanupJob(
  serviceSupabase: SupabaseClient,
  jobId: string,
  safeError: string,
): Promise<void> {
  await serviceSupabase
    .from('jobs')
    .update({
      status: 'failed',
      error: safeError,
      claimed_at: null,
      result: { cancelled: true },
    })
    .eq('id', jobId)
    .eq('type', STORAGE_CLEANUP_JOB_TYPE)
    .in('status', ['pending', 'processing']);
}

export async function claimStorageCleanupJobs(
  serviceSupabase: SupabaseClient,
  limit = 1,
): Promise<StorageCleanupJobRow[]> {
  const { data, error } = await serviceSupabase.rpc('claim_storage_cleanup_jobs', {
    p_limit: limit,
    p_max_attempts: STORAGE_CLEANUP_MAX_ATTEMPTS,
  });

  if (error || !data) {
    return [];
  }

  return data as StorageCleanupJobRow[];
}

async function markJobCompleted(
  serviceSupabase: SupabaseClient,
  jobId: string,
  result: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await serviceSupabase
    .from('jobs')
    .update({
      status: 'completed',
      error: null,
      result,
      claimed_at: null,
    })
    .eq('id', jobId)
    .eq('type', STORAGE_CLEANUP_JOB_TYPE)
    .eq('status', 'processing');

  return !error;
}

async function markJobRetryOrFailed(
  serviceSupabase: SupabaseClient,
  job: StorageCleanupJobRow,
  safeError: string,
  retryable: boolean,
): Promise<'retry_scheduled' | 'terminal_failure' | 'update_failed'> {
  if (!retryable || job.attempts >= STORAGE_CLEANUP_MAX_ATTEMPTS) {
    const { error } = await serviceSupabase
      .from('jobs')
      .update({
        status: 'failed',
        error: safeError,
        claimed_at: null,
        result: { terminal: true, category: safeError },
      })
      .eq('id', job.id)
      .eq('type', STORAGE_CLEANUP_JOB_TYPE)
      .eq('status', 'processing');

    return error ? 'update_failed' : 'terminal_failure';
  }

  const delaySeconds = computeCleanupRetryDelaySeconds(job.attempts);
  const availableAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
  const { error } = await serviceSupabase
    .from('jobs')
    .update({
      status: 'pending',
      error: safeError,
      available_at: availableAt,
      claimed_at: null,
      result: { retryable: true, category: safeError },
    })
    .eq('id', job.id)
    .eq('type', STORAGE_CLEANUP_JOB_TYPE)
    .eq('status', 'processing');

  return error ? 'update_failed' : 'retry_scheduled';
}

/**
 * Process a single claimed storage cleanup job.
 * Service-role client only. Does not log paths, payloads, or credentials.
 */
export async function processClaimedStorageCleanupJob(
  serviceSupabase: SupabaseClient,
  job: StorageCleanupJobRow,
): Promise<ProcessStorageCleanupResult> {
  if (job.type !== STORAGE_CLEANUP_JOB_TYPE) {
    await markJobRetryOrFailed(serviceSupabase, job, 'unsupported_job_type', false);
    return { ok: false, jobId: job.id, reason: 'malformed_payload', retryable: false };
  }

  const parsed = parseStorageCleanupPayload(job.payload);
  if (!parsed.ok) {
    await markJobRetryOrFailed(serviceSupabase, job, parsed.reason, false);
    return { ok: false, jobId: job.id, reason: 'malformed_payload', retryable: false };
  }

  let removedCount = 0;
  let alreadyMissingCount = 0;

  for (const object of parsed.payload.objects) {
    const removal = await removeStorageObjectWithMissingTolerance(serviceSupabase, object);
    if (!removal.ok) {
      if (removal.category === 'invalid_path') {
        await markJobRetryOrFailed(serviceSupabase, job, 'invalid_owner_path', false);
        return { ok: false, jobId: job.id, reason: 'malformed_payload', retryable: false };
      }

      const outcome = await markJobRetryOrFailed(
        serviceSupabase,
        job,
        'temporary_storage_failure',
        true,
      );
      return {
        ok: false,
        jobId: job.id,
        reason: outcome === 'terminal_failure' ? 'terminal_failure' : 'storage_failure',
        retryable: outcome === 'retry_scheduled',
      };
    }

    if (removal.alreadyMissing) {
      alreadyMissingCount += 1;
    } else if (removal.removed) {
      removedCount += 1;
    }
  }

  const completed = await markJobCompleted(serviceSupabase, job.id, {
    removedCount,
    alreadyMissingCount,
    objectCount: parsed.payload.objects.length,
  });

  if (!completed) {
    return { ok: false, jobId: job.id, reason: 'update_failed', retryable: true };
  }

  return { ok: true, jobId: job.id, removedCount, alreadyMissingCount };
}

/**
 * Claim and process up to `limit` eligible cleanup jobs.
 */
export async function drainStorageCleanupJobs(
  serviceSupabase: SupabaseClient,
  limit = 1,
): Promise<ProcessStorageCleanupResult[]> {
  const claimed = await claimStorageCleanupJobs(serviceSupabase, limit);
  if (claimed.length === 0) {
    return [{ ok: false, reason: 'no_job', retryable: false }];
  }

  const results: ProcessStorageCleanupResult[] = [];
  for (const job of claimed) {
    results.push(await processClaimedStorageCleanupJob(serviceSupabase, job));
  }
  return results;
}

/**
 * Process a specific job by id (immediate drain after content deletion).
 */
export async function processStorageCleanupJobById(
  serviceSupabase: SupabaseClient,
  jobId: string,
): Promise<ProcessStorageCleanupResult> {
  const { data, error } = await serviceSupabase.rpc('claim_storage_cleanup_job_by_id', {
    p_job_id: jobId,
    p_max_attempts: STORAGE_CLEANUP_MAX_ATTEMPTS,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return { ok: false, jobId, reason: 'claim_failed', retryable: true };
  }

  const job = (Array.isArray(data) ? data[0] : data) as StorageCleanupJobRow;
  return processClaimedStorageCleanupJob(serviceSupabase, job);
}

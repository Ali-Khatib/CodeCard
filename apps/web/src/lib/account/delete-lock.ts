import type { SupabaseClient } from '@supabase/supabase-js';

export const ACCOUNT_DELETION_LOCK_TTL_MS = 15 * 60 * 1000;

export type DeletionLockResult =
  | { ok: true; operationId: string; correlationId: string }
  | { ok: false; reason: 'in_progress' | 'insert_failed' };

/**
 * Acquire an account-scoped durable deletion lock via service-role client.
 * Relies on partial unique index account_deletion_one_in_progress.
 */
export async function acquireAccountDeletionLock(
  serviceSupabase: SupabaseClient,
  ownerUserId: string,
  ttlMs: number = ACCOUNT_DELETION_LOCK_TTL_MS,
): Promise<DeletionLockResult> {
  const now = Date.now();
  const lockExpiresAt = new Date(now + ttlMs).toISOString();

  // Expire stale in-progress locks before attempting insert.
  await serviceSupabase
    .from('account_deletion_operations')
    .update({ status: 'aborted', last_error_code: 'lock_expired' })
    .eq('owner_user_id', ownerUserId)
    .eq('status', 'in_progress')
    .lt('lock_expires_at', new Date(now).toISOString());

  const { data, error } = await serviceSupabase
    .from('account_deletion_operations')
    .insert({
      owner_user_id: ownerUserId,
      status: 'in_progress',
      locked_at: new Date(now).toISOString(),
      lock_expires_at: lockExpiresAt,
    })
    .select('id, correlation_id')
    .single();

  if (error || !data?.id) {
    const message = (error?.message ?? '').toLowerCase();
    if (message.includes('duplicate') || message.includes('unique')) {
      return { ok: false, reason: 'in_progress' };
    }
    return { ok: false, reason: 'insert_failed' };
  }

  return {
    ok: true,
    operationId: data.id as string,
    correlationId: data.correlation_id as string,
  };
}

export async function releaseAccountDeletionLock(
  serviceSupabase: SupabaseClient,
  operationId: string,
  status: 'completed' | 'failed' | 'aborted',
  lastErrorCode?: string,
): Promise<void> {
  await serviceSupabase
    .from('account_deletion_operations')
    .update({
      status,
      last_error_code: lastErrorCode ?? null,
    })
    .eq('id', operationId)
    .eq('status', 'in_progress');
}

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * WS13-T006 — server-readable suspension check for publish paths.
 *
 * Uses the durable `account_suspensions` marker via a subject-scoped RPC.
 * Auth ban_duration may invalidate future sessions, but active JWTs are not
 * claimed to be revoked immediately; publish paths must still consult this marker.
 */

export const ACCOUNT_SUSPENDED_MESSAGE =
  'Your account is suspended and cannot publish content.';

export const ACCOUNT_STATUS_UNAVAILABLE_MESSAGE =
  'We could not verify your account status right now. Publishing is paused — try again in a moment.';

export const ACCOUNT_SUSPENSION_LEARN_MORE_HREF =
  '/dashboard/settings#publishing-restrictions';

export type AccountSuspensionStatus = 'clear' | 'suspended' | 'unknown';

export async function getCurrentAccountSuspensionStatus(
  supabase: SupabaseClient,
): Promise<AccountSuspensionStatus> {
  try {
    const { data, error } = await supabase.rpc('is_current_account_suspended');
    if (error) return 'unknown';
    return data === true ? 'suspended' : 'clear';
  } catch {
    return 'unknown';
  }
}

/** True only when the durable suspension marker is active. */
export async function isCurrentAccountSuspended(
  supabase: SupabaseClient,
): Promise<boolean> {
  return (await getCurrentAccountSuspensionStatus(supabase)) === 'suspended';
}

/** Blocks publish when suspended or when the probe cannot be confirmed. */
export async function getPublishBlockForSuspension(
  supabase: SupabaseClient,
): Promise<{ error: string } | null> {
  const status = await getCurrentAccountSuspensionStatus(supabase);
  if (status === 'suspended') {
    return { error: ACCOUNT_SUSPENDED_MESSAGE };
  }
  if (status === 'unknown') {
    return { error: ACCOUNT_STATUS_UNAVAILABLE_MESSAGE };
  }
  return null;
}

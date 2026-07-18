import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * WS13-T006 — server-readable suspension check for publish paths.
 *
 * Uses the durable `account_suspensions` marker via a subject-scoped RPC.
 * Auth ban_duration may invalidate future sessions, but active JWTs are not
 * claimed to be revoked immediately; publish paths must still consult this marker.
 */
export async function isCurrentAccountSuspended(
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_current_account_suspended');
    if (error) {
      // Fail closed for publish attempts when the suspension probe is unavailable.
      return true;
    }
    return data === true;
  } catch {
    return true;
  }
}

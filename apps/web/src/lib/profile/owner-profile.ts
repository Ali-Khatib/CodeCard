import type { SupabaseClient } from '@supabase/supabase-js';

/** Columns the signed-in shell reads. Keep this list in the schema contract test. */
export const OWNER_SHELL_PROFILE_COLUMNS =
  'id, slug, display_name, avatar_url, headline, bio, is_public';

/** Columns the dashboard home reads. Keep this list in the schema contract test. */
export const OWNER_HOME_PROFILE_COLUMNS =
  'id, tenant_id, owner_user_id, slug, display_name, headline, bio, avatar_url, location, card_history, skills, is_public, audience_role, created_at, updated_at';

type ProfileQueryError = { code?: string; message?: string } | null;

export function isSchemaMismatchError(error: ProfileQueryError): boolean {
  if (!error) return false;
  if (error.code === '42703' || error.code === 'PGRST204' || error.code === 'PGRST205') {
    return true;
  }
  return /does not exist|schema cache/i.test(error.message ?? '');
}

/**
 * Load the signed-in user's profile. If the auth user has no row yet, ask the
 * database to provision one and read again. A missing column is not retried.
 */
export async function loadOwnerProfile<T extends { id: string }>(
  supabase: SupabaseClient,
  userId: string,
  columns: string,
): Promise<{ profile: T | null; error: ProfileQueryError }> {
  async function read() {
    return supabase
      .from('profiles')
      .select(columns)
      .eq('owner_user_id', userId)
      .maybeSingle();
  }

  const first = await read();
  if (first.error || first.data) {
    return { profile: (first.data as T | null) ?? null, error: first.error };
  }

  const healed = await supabase.rpc('ensure_owner_profile');
  if (healed.error) {
    return { profile: null, error: healed.error };
  }

  const second = await read();
  return { profile: (second.data as T | null) ?? null, error: second.error };
}

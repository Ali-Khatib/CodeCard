import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { userHasPasswordRecoveryPrivilege } from '@/lib/auth/recovery-session';

/**
 * Block authenticated application APIs while password-recovery privilege is set.
 * Call after getUser() when a user is present.
 */
export function recoverySessionForbiddenResponse(
  user: User | null | undefined,
): NextResponse | null {
  if (!userHasPasswordRecoveryPrivilege(user)) {
    return null;
  }

  return NextResponse.json(
    { error: 'Complete password reset before accessing the application.' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  );
}

/** Async wrapper for call sites that already have a supabase client. */
export async function recoverySessionForbiddenForClient(
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return recoverySessionForbiddenResponse(user);
}

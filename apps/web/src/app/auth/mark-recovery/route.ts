import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stampPasswordRecoveryPrivilege } from '@/lib/auth/recovery-privilege';
import { isAuthConfigured } from '@/lib/auth/configured';
import { getAppOrigin } from '@/lib/auth/redirect';

/**
 * Stamp server-side recovery privilege for an already-authenticated recovery
 * session (e.g. hash/implicit recovery links), then send the user to
 * reset-password. Requires a verified session — anonymous callers get bounced.
 *
 * Redirects use the configured app origin only (never request.url) to avoid
 * open redirects via Host / URL spoofing.
 */
export async function GET(_request: Request) {
  const origin = getAppOrigin();

  if (!isAuthConfigured()) {
    return NextResponse.redirect(`${origin}/forgot-password`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/forgot-password`);
  }

  await stampPasswordRecoveryPrivilege(user.id);
  return NextResponse.redirect(`${origin}/reset-password`);
}

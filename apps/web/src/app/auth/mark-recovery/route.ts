import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stampPasswordRecoveryPrivilege } from '@/lib/auth/recovery-privilege';
import { isAuthConfigured } from '@/lib/auth/configured';

/**
 * Stamp server-side recovery privilege for an already-authenticated recovery
 * session (e.g. hash/implicit recovery links), then send the user to
 * reset-password. Requires a verified session — anonymous callers get bounced.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

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

import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { clearPasswordRecoveryPrivilege } from '@/lib/auth/recovery-privilege';
import { userHasPasswordRecoveryPrivilege } from '@/lib/auth/recovery-session';
import { mapPasswordResetClientError } from '@/lib/auth/password-recovery';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { logSecurityEvent } from '@/lib/security/security-events';

/**
 * Complete password reset under recovery privilege:
 * update password → clear server-side recovery flag → global sign-out.
 * Clients must not clear recovery privilege independently.
 */
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsedBody = await parseJsonBody(request, 4 * 1024);
  if (!parsedBody.ok) return parsedBody.response;

  const validated = resetPasswordSchema.safeParse(parsedBody.data);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.errors[0]?.message ?? 'Invalid password' },
      { status: 422 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!userHasPasswordRecoveryPrivilege(user)) {
    return NextResponse.json(
      { error: 'Password reset session required.' },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (updateError) {
    return NextResponse.json({ error: mapPasswordResetClientError() }, { status: 400 });
  }

  try {
    await clearPasswordRecoveryPrivilege(user.id);
  } catch {
    logSecurityEvent('SESSION_REVOKED', { reason: 'recovery_privilege_clear_failed' });
    return NextResponse.json({ error: mapPasswordResetClientError() }, { status: 500 });
  }

  await supabase.auth.signOut({ scope: 'global' });

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

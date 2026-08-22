import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth/configured';
import { stampPasswordRecoveryPrivilege } from '@/lib/auth/recovery-privilege';
import {
  buildAuthErrorUrl,
  classifyCodeExchangeError,
  logOAuthCallbackFailure,
  resolveOAuthCallback,
} from '@/lib/auth/oauth-callback';

function isRecoveryExchange(resolution: {
  method: 'code' | 'token_hash';
  otpType?: string;
  redirectPath: string;
}): boolean {
  if (resolution.method === 'token_hash' && resolution.otpType === 'recovery') {
    return true;
  }
  return resolution.redirectPath.startsWith('/reset-password');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const resolution = resolveOAuthCallback(searchParams, {
    authConfigured: isAuthConfigured(),
  });

  if (resolution.kind === 'error') {
    logOAuthCallbackFailure(resolution.reason);
    return NextResponse.redirect(
      buildAuthErrorUrl(origin, resolution.reason, resolution.redirectPath),
    );
  }

  try {
    const supabase = await createClient();
    const { error } =
      resolution.method === 'token_hash'
        ? await supabase.auth.verifyOtp({
            token_hash: resolution.tokenHash,
            type: resolution.otpType as EmailOtpType,
          })
        : await supabase.auth.exchangeCodeForSession(resolution.code);

    if (error) {
      const reason = classifyCodeExchangeError(error.message);
      logOAuthCallbackFailure(reason);
      return NextResponse.redirect(
        buildAuthErrorUrl(origin, reason, resolution.redirectPath),
      );
    }

    if (isRecoveryExchange(resolution)) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await stampPasswordRecoveryPrivilege(user.id);
      }
    }

    return NextResponse.redirect(`${origin}${resolution.redirectPath}`);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'exchange_failed';
    const reason = classifyCodeExchangeError(message);
    logOAuthCallbackFailure(reason);
    return NextResponse.redirect(
      buildAuthErrorUrl(origin, reason, resolution.redirectPath),
    );
  }
}

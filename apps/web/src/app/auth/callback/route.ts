import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth/configured';
import {
  buildAuthErrorUrl,
  logOAuthCallbackFailure,
  resolveOAuthCallback,
} from '@/lib/auth/oauth-callback';

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

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(resolution.code);

  if (error) {
    logOAuthCallbackFailure('exchange_failed');
    return NextResponse.redirect(
      buildAuthErrorUrl(origin, 'exchange_failed', resolution.redirectPath),
    );
  }

  return NextResponse.redirect(`${origin}${resolution.redirectPath}`);
}

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import {
  buildSignInRetryUrl,
  oauthErrorMessage,
  type OAuthErrorReason,
} from '@/lib/auth/oauth-callback';
import { sanitizeInternalRedirect } from '@/lib/auth/redirect';

const KNOWN_REASONS = new Set<OAuthErrorReason>([
  'provider_denied',
  'missing_code',
  'exchange_failed',
  'misconfigured',
  'malformed_state',
]);

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const rawReason = searchParams.get('reason');
  const reason: OAuthErrorReason = KNOWN_REASONS.has(rawReason as OAuthErrorReason)
    ? (rawReason as OAuthErrorReason)
    : 'exchange_failed';
  const redirectPath = sanitizeInternalRedirect(searchParams.get('redirect'));
  const retryHref = buildSignInRetryUrl(redirectPath);

  return (
    <AuthShell
      title="Sign-in incomplete"
      subtitle={oauthErrorMessage(reason)}
    >
      <div className="space-y-3" role="alert" aria-live="assertive">
        <Link href={retryHref} className="cc-btn-pill-primary flex w-full justify-center py-2.5 text-[15px]">
          Try again
        </Link>
        <Link
          href="/sign-in"
          className="cc-btn-pill-ghost flex w-full justify-center py-2.5 text-[15px]"
        >
          Return to sign in
        </Link>
        <Link
          href={LIVE_DEMO_HREF}
          className="cc-btn-pill-ghost flex w-full justify-center py-2.5 text-[15px]"
        >
          Explore demo workspace
        </Link>
        <Link
          href="/"
          className="block pt-2 text-center text-[14px] text-[#7a7876] underline-offset-2 hover:text-[#222222] hover:underline"
        >
          Back to landing
        </Link>
      </div>
    </AuthShell>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}

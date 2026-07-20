import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * WS14-T015 — gated Sentry verification probe.
 *
 * Enabled only when CODECARD_SENTRY_VERIFY=1. Disabled by default so it cannot
 * be abused publicly. After a successful dashboard verification, unset the env
 * var on Vercel (or leave it unset in Production forever).
 *
 * Emits a clearly labeled, non-sensitive exception — no PII, tokens, or secrets.
 */
export async function GET() {
  if (process.env.CODECARD_SENTRY_VERIFY !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const label = 'CodeCard WS14-T015 Sentry verification event';
  const err = new Error(label);
  err.name = 'CodeCardSentryVerification';

  Sentry.withScope((scope) => {
    scope.setTag('codecard.verification', 'ws14-t015');
    scope.setLevel('error');
    scope.setContext('verification', {
      purpose: 'controlled_sentry_smoke',
      contains_secrets: false,
      contains_pii: false,
    });
    Sentry.captureException(err);
  });

  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    message: label,
    hint: 'Confirm this event in Sentry, then unset CODECARD_SENTRY_VERIFY.',
  });
}

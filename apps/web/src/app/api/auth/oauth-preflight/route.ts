import { NextResponse } from 'next/server';

/**
 * Probes a Supabase authorize URL before the browser follows it.
 * Catches "provider is not enabled" so the UI can show a clear message.
 *
 * SSRF: the outbound request is rebuilt from NEXT_PUBLIC_SUPABASE_URL only —
 * never from an attacker-controlled host/path.
 */
export async function POST(request: Request) {
  let url: unknown;
  try {
    const body = (await request.json()) as { url?: unknown };
    url = body.url;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_body' }, { status: 400 });
  }

  if (typeof url !== 'string' || !url) {
    return NextResponse.json({ ok: false, reason: 'invalid_url' }, { status: 400 });
  }

  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!supabaseOrigin) {
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 503 });
  }

  let parsed: URL;
  let allowedOrigin: URL;
  try {
    parsed = new URL(url);
    allowedOrigin = new URL(supabaseOrigin);
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_url' }, { status: 400 });
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.origin !== allowedOrigin.origin ||
    parsed.pathname !== '/auth/v1/authorize'
  ) {
    return NextResponse.json({ ok: false, reason: 'invalid_url' }, { status: 400 });
  }

  // Rebuild from the trusted origin so fetch never receives a user-controlled host.
  const safeUrl = new URL('/auth/v1/authorize', allowedOrigin);
  safeUrl.search = parsed.search;

  try {
    const response = await fetch(safeUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: 'application/json' },
    });

    // Only block when Supabase explicitly says the provider is off.
    // Any redirect / opaque / unexpected status still lets the browser continue —
    // false "oauth_failed" here was aborting working GitHub flows.
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ ok: true });
    }

    const text = await response.text();
    const lower = text.toLowerCase();
    if (
      lower.includes('provider is not enabled') ||
      lower.includes('unsupported provider')
    ) {
      return NextResponse.json({ ok: false, reason: 'provider_disabled' });
    }

    return NextResponse.json({ ok: true, reason: 'preflight_inconclusive' });
  } catch {
    // Network failure — let the client attempt the redirect anyway.
    return NextResponse.json({ ok: true, reason: 'preflight_skipped' });
  }
}

import { NextResponse } from 'next/server';

/**
 * Probes a Supabase authorize URL before the browser follows it.
 * Catches "provider is not enabled" so the UI can show a clear message.
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
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_url' }, { status: 400 });
  }

  const allowedPrefix = `${supabaseOrigin}/auth/v1/authorize`;
  if (!url.startsWith(allowedPrefix) || parsed.origin !== new URL(supabaseOrigin).origin) {
    return NextResponse.json({ ok: false, reason: 'invalid_url' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: 'application/json' },
    });

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

    return NextResponse.json({ ok: false, reason: 'oauth_failed' });
  } catch {
    // Network failure — let the client attempt the redirect anyway.
    return NextResponse.json({ ok: true, reason: 'preflight_skipped' });
  }
}

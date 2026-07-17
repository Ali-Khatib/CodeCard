import { getAppOrigin } from '@/lib/auth/redirect';

/** Opaque rejection for browser CSRF/same-origin failures. */
export const CSRF_FORBIDDEN_MESSAGE = 'Forbidden';

/**
 * Parse a browser Origin header into a canonical origin string.
 * Rejects malformed values, non-http(s) schemes, and credentialed URLs.
 */
export function parseBrowserOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null') return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Trusted origins for browser cookie mutations.
 * Sources: request URL origin, NEXT_PUBLIC_APP_URL, VERCEL_URL.
 * Does not trust client-supplied Host / X-Forwarded-Host headers.
 */
export function collectAllowedOrigins(request: Request): Set<string> {
  const allowed = new Set<string>();

  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    // ignore malformed request URL
  }

  const appOrigin = getAppOrigin();
  if (appOrigin) {
    const parsed = parseBrowserOrigin(appOrigin);
    if (parsed) allowed.add(parsed);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//i, '').split('/')[0];
    if (host) allowed.add(`https://${host}`);
  }

  return allowed;
}

/**
 * CSRF / same-origin guard for cookie-authenticated browser mutations.
 *
 * Policy:
 * - Reject Sec-Fetch-Site: cross-site
 * - When Origin is present: require exact match against trusted origins (parsed)
 * - When Origin is absent: require Sec-Fetch-Site same-origin or same-site
 * - Missing Origin AND missing/untrusted fetch metadata → reject (fail closed)
 *
 * Does not apply to Stripe webhooks (signature auth) or public ingest routes.
 */
export function isSameOriginMutation(request: Request): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const originHeader = request.headers.get('origin');
  if (!originHeader) {
    return secFetchSite === 'same-origin' || secFetchSite === 'same-site';
  }

  const origin = parseBrowserOrigin(originHeader);
  if (!origin) return false;

  return collectAllowedOrigins(request).has(origin);
}

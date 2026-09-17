import { SLUG_REGEX } from '@codecard/validation';

export type CanonicalPublicProfileUrlResult =
  | { ok: true; url: string; origin: string; slug: string }
  | { ok: false; error: string };

export type ScannedCodeCardResult =
  | { ok: true; slug: string; fromQr: boolean; publicUrl: string }
  | { ok: false; error: string };

const BLOCKED_FIRST_SEGMENTS = new Set([
  'dashboard',
  'app',
  'sign-in',
  'sign-up',
  'pricing',
  'legal',
  'admin',
]);

export function normalizeTrustedAppOrigin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes(' ') || trimmed.includes('\\')) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  if (!parsed.hostname) return null;
  if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname !== '') return null;
  if (parsed.search || parsed.hash) return null;

  return `${parsed.protocol}//${parsed.host}`;
}

export function getMobileAppOrigin(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | null {
  const fromEnv = normalizeTrustedAppOrigin(env.EXPO_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv;
  if (env.NODE_ENV === 'production') return null;
  return normalizeTrustedAppOrigin('http://localhost:3000');
}

export function buildCanonicalPublicProfileUrl(
  profileSlug: string | null | undefined,
  origin: string,
): CanonicalPublicProfileUrlResult {
  const slug = (profileSlug ?? '').trim().toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) {
    return { ok: false, error: 'A valid public profile slug is required.' };
  }

  const trusted = normalizeTrustedAppOrigin(origin);
  if (!trusted) {
    return { ok: false, error: 'Application URL is not configured. Set EXPO_PUBLIC_APP_URL.' };
  }

  return {
    ok: true,
    origin: trusted,
    slug,
    url: `${trusted}/${slug}`,
  };
}

export function getPublicProfileLinkForShare(
  profileSlug: string | null | undefined,
  origin: string,
): string | null {
  const canonical = buildCanonicalPublicProfileUrl(profileSlug, origin);
  return canonical.ok ? canonical.url : null;
}

export function buildQrProfileUrl(canonicalProfileUrl: string): string | null {
  try {
    const parsed = new URL(canonicalProfileUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    if (!parsed.pathname || parsed.pathname === '/') return null;

    parsed.searchParams.set('source', 'qr');
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parseScannedCodeCardUrl(raw: string, origin: string): ScannedCodeCardResult {
  const trusted = normalizeTrustedAppOrigin(origin);
  if (!trusted) return { ok: false, error: 'Missing app origin.' };

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'Not a CodeCard QR.' };
  }

  if (parsed.origin !== trusted) {
    return { ok: false, error: 'QR is not a CodeCard profile.' };
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length !== 1) {
    return { ok: false, error: 'QR is not a public CodeCard.' };
  }

  const slug = segments[0].toLowerCase();
  if (BLOCKED_FIRST_SEGMENTS.has(slug) || !SLUG_REGEX.test(slug)) {
    return { ok: false, error: 'QR is not a public CodeCard.' };
  }

  const publicUrl = `${trusted}/${slug}`;
  return {
    ok: true,
    slug,
    fromQr: parsed.searchParams.get('source') === 'qr',
    publicUrl,
  };
}

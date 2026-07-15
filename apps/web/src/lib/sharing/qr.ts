import { SLUG_REGEX } from '@codecard/validation';
import QRCode from 'qrcode';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';

export const PROFILE_QR_ERROR_CORRECTION = 'M' as const;
export const PROFILE_QR_MARGIN = 4;
export const PROFILE_QR_PREVIEW_SIZE = 280;
export const PROFILE_QR_DOWNLOAD_SIZE = 1024;
export const PROFILE_QR_DARK = '#111111';
export const PROFILE_QR_LIGHT = '#ffffff';

export type ProfileQrOptions = {
  /** Preview/download size in CSS pixels (square). */
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
};

export type CanonicalPublicProfileUrlResult =
  | { ok: true; url: string; origin: string; slug: string }
  | { ok: false; error: string };

export type ProfileQrGenerateResult =
  | {
      ok: true;
      url: string;
      slug: string;
      pngDataUrl: string;
      svg: string;
      size: number;
      filename: string;
    }
  | { ok: false; error: string };

/** Normalize configured app origin: protocol + host, no trailing slash, no path. */
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

/**
 * Trusted application origin for share/QR surfaces.
 * Never derived from user-controlled request headers or profile content.
 */
export function getTrustedAppOrigin(env: NodeJS.ProcessEnv = process.env): string | null {
  const fromEnv = normalizeTrustedAppOrigin(env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv;

  // Development/test may omit NEXT_PUBLIC_APP_URL; production must configure it.
  if (env.NODE_ENV === 'production') return null;
  return normalizeTrustedAppOrigin('http://localhost:3000');
}

export function buildCanonicalPublicProfileUrl(
  profileSlug: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): CanonicalPublicProfileUrlResult {
  const slug = normalizePublicProfileSlug(profileSlug ?? '');
  if (!slug || !SLUG_REGEX.test(slug)) {
    return { ok: false, error: 'A valid public profile slug is required.' };
  }

  const origin = getTrustedAppOrigin(env);
  if (!origin) {
    return {
      ok: false,
      error: 'Application URL is not configured. Set NEXT_PUBLIC_APP_URL.',
    };
  }

  return {
    ok: true,
    origin,
    slug,
    url: `${origin}/${slug}`,
  };
}

/**
 * Absolute public profile URL for clipboard / displayed share text.
 * Returns null when slug or trusted origin is invalid — callers must not copy.
 */
export function getPublicProfileLinkForClipboard(
  profileSlug: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const canonical = buildCanonicalPublicProfileUrl(profileSlug, env);
  return canonical.ok ? canonical.url : null;
}

export function buildProfileQrFilename(slug: string): string {
  const safe = normalizePublicProfileSlug(slug);
  if (!safe) return 'codecard-profile-qr.png';
  return `codecard-${safe}-qr.png`;
}

function qrRenderOptions(size: number, options?: ProfileQrOptions) {
  return {
    errorCorrectionLevel: options?.errorCorrectionLevel ?? PROFILE_QR_ERROR_CORRECTION,
    margin: options?.margin ?? PROFILE_QR_MARGIN,
    width: size,
    color: {
      dark: PROFILE_QR_DARK,
      light: PROFILE_QR_LIGHT,
    },
  } as const;
}

/** Extract the UTF-8 payload from QR segments created by `qrcode`. */
export function readQrSegmentPayload(url: string): string {
  const created = QRCode.create(url, {
    errorCorrectionLevel: PROFILE_QR_ERROR_CORRECTION,
  });
  const bytes = created.segments.flatMap((segment) => {
    const data = segment.data;
    if (typeof data === 'string') return Array.from(new TextEncoder().encode(data));
    return Array.from(data as Uint8Array | number[]);
  });
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

/**
 * Generate a scannable profile QR for the canonical public URL.
 * Preview and download must call this with the same URL helper.
 */
export async function generateProfileQr(
  profileSlug: string | null | undefined,
  options?: ProfileQrOptions,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProfileQrGenerateResult> {
  const canonical = buildCanonicalPublicProfileUrl(profileSlug, env);
  if (!canonical.ok) return { ok: false, error: canonical.error };

  const size = options?.size ?? PROFILE_QR_PREVIEW_SIZE;
  const render = qrRenderOptions(size, options);

  try {
    const [pngDataUrl, svg] = await Promise.all([
      QRCode.toDataURL(canonical.url, render),
      QRCode.toString(canonical.url, { ...render, type: 'svg' }),
    ]);

    if (!pngDataUrl.startsWith('data:image/png;base64,')) {
      return { ok: false, error: 'QR generation did not return a PNG data URL.' };
    }
    if (!svg.includes('<svg')) {
      return { ok: false, error: 'QR generation did not return SVG markup.' };
    }

    const encoded = readQrSegmentPayload(canonical.url);
    if (encoded !== canonical.url) {
      return { ok: false, error: 'QR payload does not match the canonical profile URL.' };
    }

    return {
      ok: true,
      url: canonical.url,
      slug: canonical.slug,
      pngDataUrl,
      svg,
      size,
      filename: buildProfileQrFilename(canonical.slug),
    };
  } catch {
    return { ok: false, error: 'Could not generate a QR code for this profile link.' };
  }
}

export async function generateProfileQrPreview(
  profileSlug: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProfileQrGenerateResult> {
  return generateProfileQr(profileSlug, { size: PROFILE_QR_PREVIEW_SIZE }, env);
}

export async function generateProfileQrDownload(
  profileSlug: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProfileQrGenerateResult> {
  return generateProfileQr(profileSlug, { size: PROFILE_QR_DOWNLOAD_SIZE }, env);
}

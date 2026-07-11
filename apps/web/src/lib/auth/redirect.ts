const DEFAULT_FALLBACK = '/dashboard';

/** Paths that must not be used as post-auth destinations (prevents auth loops). */
const AUTH_LOOP_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/auth/callback',
  '/auth/error',
] as const;

const DANGEROUS_SCHEME = /^(javascript|data|vbscript|file):/i;

function decodeRedirectInput(path: string): string {
  let decoded = path.trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function splitInternalPath(path: string): { pathname: string; search: string; hash: string } {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf('?');
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  return { pathname, search, hash };
}

function isAuthLoopPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return AUTH_LOOP_PREFIXES.some(
    (prefix) => lower === prefix || lower.startsWith(`${prefix}/`),
  );
}

function hasDangerousScheme(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (DANGEROUS_SCHEME.test(trimmed)) return true;
  const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
  const schemeIndex = withoutLeadingSlash.indexOf(':');
  if (schemeIndex > 0 && schemeIndex < 12) {
    const scheme = withoutLeadingSlash.slice(0, schemeIndex);
    if (!scheme.includes('/') && !scheme.includes('\\') && scheme !== 'http' && scheme !== 'https') {
      return true;
    }
  }
  return false;
}

function isUnsafeRedirectValue(value: string): boolean {
  if (!value.startsWith('/')) return true;
  if (value.startsWith('//')) return true;
  if (value.includes('://') || value.includes('\\') || value.includes('@')) return true;
  if (hasDangerousScheme(value)) return true;
  return false;
}

/** Allow only same-origin relative paths for post-auth redirects. */
export function sanitizeInternalRedirect(
  path: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
): string {
  if (!path) return fallback;

  const normalized = decodeRedirectInput(path);
  if (!normalized || !normalized.trim()) return fallback;
  if (isUnsafeRedirectValue(normalized)) return fallback;

  const { pathname, search, hash } = splitInternalPath(normalized);
  if (isUnsafeRedirectValue(pathname)) return fallback;
  if (search.includes('://') || hash.includes('://')) return fallback;
  if (isAuthLoopPath(pathname)) return fallback;

  return `${pathname}${search}${hash}`;
}

export function getAppOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function authCallbackRedirectUrl(redirectPath: string): string {
  const safe = sanitizeInternalRedirect(redirectPath, '/dashboard');
  return `${getAppOrigin()}/auth/callback?redirect=${encodeURIComponent(safe)}`;
}

export const PASSWORD_RESET_GENERIC_SUCCESS =
  'If an account exists for this email, a reset link has been sent.';

export const PASSWORD_RESET_GENERIC_ERROR =
  'Something went wrong. Please try again in a moment.';

export const PASSWORD_RESET_COOLDOWN_MS = 60_000;

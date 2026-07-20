/**
 * WS14-T015 — sensitive-field scrubbing for Sentry events.
 * Never send auth headers, cookies, tokens, passwords, or reset URLs.
 */

const SENSITIVE_HEADER =
  /^(authorization|cookie|set-cookie|x-supabase-auth|x-forwarded-authorization)$/i;

const SENSITIVE_QUERY_KEY =
  /^(access_token|refresh_token|token|password|code|recovery|secret|apikey|api_key|authorization)$/i;

const SENSITIVE_VALUE =
  /(sk_live_|sk_test_|whsec_|eyJ[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._~+/=-]+|password|recovery|access_token|refresh_token)/i;

export function scrubHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER.test(key)) {
      out[key] = '[Filtered]';
      continue;
    }
    out[key] = SENSITIVE_VALUE.test(value) ? '[Filtered]' : value;
  }
  return out;
}

export function scrubUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url, 'https://codecard.local');
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEY.test(key)) {
        parsed.searchParams.set(key, '[Filtered]');
      }
    }
    // Absolute URLs keep origin; relative keep path+query.
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return SENSITIVE_VALUE.test(url) ? '[Filtered]' : url;
  }
}

export function scrubExtra(
  extra: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!extra) return extra;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (SENSITIVE_QUERY_KEY.test(key)) {
      out[key] = '[Filtered]';
      continue;
    }
    if (typeof value === 'string' && SENSITIVE_VALUE.test(value)) {
      out[key] = '[Filtered]';
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Drop expected client/auth noise that should not page on-call. */
export function isNoisyExpectedError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    /NEXT_REDIRECT/i.test(message) ||
    /NEXT_NOT_FOUND/i.test(message) ||
    /AbortError/i.test(message)
  );
}

import {
  isAllowedProfileLinkHref,
  isAllowedProjectLinkHref,
  isValidDoiUrlValue,
  isValidExternalPdfUrl,
  normalizeDoiUrl,
  normalizeExternalPdfUrl,
} from '@codecard/validation';

/**
 * Centralized public href guards for visitor-facing renderers.
 * Reject unsafe schemes rather than attempting to sanitize them into clickable links.
 */

export function toSafeHttpHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!trimmed || trimmed.startsWith('//')) return null;
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function toSafeProfileHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  return isAllowedProfileLinkHref(trimmed) ? trimmed : null;
}

export function toSafeProjectHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  return isAllowedProjectLinkHref(trimmed) ? trimmed : null;
}

export function toSafeExternalPdfHref(url: string | null | undefined): string | null {
  const normalized = normalizeExternalPdfUrl(url);
  if (!normalized) return null;
  return isValidExternalPdfUrl(normalized) ? normalized : null;
}

export function toSafeDoiHref(url: string | null | undefined): string | null {
  const normalized = normalizeDoiUrl(url);
  if (!normalized || !isValidDoiUrlValue(normalized)) return null;
  return toSafeHttpHref(normalized);
}

/** Payload shapes that must remain inert as React text (never become HTML). */
export const PUBLIC_XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  '  javascript:alert(1)',
  'java\tscript:alert(1)',
  'data:text/html,hi',
  'vbscript:msgbox(1)',
  '//evil.example/path',
  '"><img src=x onerror=alert(1)>',
  '</a><script>alert(1)</script>',
  '</script><script>alert(1)</script>',
  '[Click](javascript:alert(1))',
  '<iframe src="javascript:alert(1)">',
  '<object data="javascript:alert(1)">',
  '<a href="javascript:alert(1)">x</a>',
  '{"@context":"</script><script>alert(1)</script>"}',
  `${'A'.repeat(5000)}<script>alert(1)</script>`,
] as const;

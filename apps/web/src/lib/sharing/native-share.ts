/**
 * Native Web Share helpers for the canonical public profile URL.
 * Client-only — do not call from Server Components.
 */

import { getPublicProfileLinkForClipboard } from './qr';

export type ProfileNativeSharePayload = {
  title: string;
  text: string;
  url: string;
};

export type ShareProfileResult =
  | { ok: true; status: 'shared' }
  | { ok: true; status: 'cancelled' }
  | { ok: false; error: string };

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Strip control characters and clamp plain-text share fields. */
export function sanitizeSharePlainText(value: string, maxLength: number): string {
  return value
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function isNativeShareSupported(
  nav: Pick<Navigator, 'share'> | null | undefined = typeof navigator !== 'undefined'
    ? navigator
    : null,
): boolean {
  return Boolean(nav && typeof nav.share === 'function');
}

export function canShareProfilePayload(
  payload: ProfileNativeSharePayload,
  nav: Navigator | null | undefined = typeof navigator !== 'undefined' ? navigator : null,
): boolean {
  if (!isNativeShareSupported(nav)) return false;
  if (!nav || typeof nav.canShare !== 'function') return true;
  try {
    return nav.canShare({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
  } catch {
    return true;
  }
}

export function buildProfileNativeSharePayload(options: {
  displayName?: string | null;
  profileSlug?: string | null;
  env?: NodeJS.ProcessEnv;
}): { ok: true; payload: ProfileNativeSharePayload } | { ok: false; error: string } {
  const url = getPublicProfileLinkForClipboard(options.profileSlug, options.env);
  if (!url) {
    return {
      ok: false,
      error: 'A valid public profile link is required before sharing.',
    };
  }

  const name =
    sanitizeSharePlainText(options.displayName ?? '', 80) || 'CodeCard';
  const title = sanitizeSharePlainText(`${name} on CodeCard`, 120);
  const text = sanitizeSharePlainText('View my public CodeCard profile.', 200);

  return {
    ok: true,
    payload: {
      title,
      text,
      url,
    },
  };
}

export function isShareCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name) : '';
  return name === 'AbortError';
}

/**
 * Open the OS share sheet for the profile payload.
 * Cancellation is not treated as an application error.
 */
export async function shareProfileNative(
  payload: ProfileNativeSharePayload,
  nav: Navigator | null | undefined = typeof navigator !== 'undefined' ? navigator : null,
): Promise<ShareProfileResult> {
  if (!isNativeShareSupported(nav) || !nav) {
    return {
      ok: false,
      error: 'Native sharing is not available in this browser.',
    };
  }

  if (!canShareProfilePayload(payload, nav)) {
    return {
      ok: false,
      error: 'This browser cannot share the profile link.',
    };
  }

  try {
    await nav.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
    return { ok: true, status: 'shared' };
  } catch (error) {
    if (isShareCancellation(error)) {
      return { ok: true, status: 'cancelled' };
    }
    return {
      ok: false,
      error: 'Could not open sharing options. Try copying your public link instead.',
    };
  }
}

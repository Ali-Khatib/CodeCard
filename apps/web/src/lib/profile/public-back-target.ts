import { hasSupabaseAuthCookie } from '@/lib/auth/session-expiry';

/** Dashboard Home tab. Signed-in visitors return here from a public CodeCard. */
export const SIGNED_IN_PUBLIC_BACK_HREF = '/dashboard';

export function parseCookieHeader(header: string): { name: string; value: string }[] {
  return header.split(';').flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const eq = trimmed.indexOf('=');
    const name = (eq === -1 ? trimmed : trimmed.slice(0, eq)).trim();
    if (!name) return [];
    const value = eq === -1 ? '' : trimmed.slice(eq + 1);
    return [{ name, value }];
  });
}

/**
 * Public profiles render without the viewer session, so the default back link
 * is the marketing home. A signed-in browser should open the Home tab.
 * Explicit destinations (demo workspace, owner preview) stay as given.
 */
export function publicProfileBackHrefForViewer(
  backHref: string,
  cookieHeader: string | null | undefined,
): string {
  if (backHref !== '/') return backHref;
  if (!cookieHeader) return backHref;
  if (!hasSupabaseAuthCookie(parseCookieHeader(cookieHeader))) return backHref;
  return SIGNED_IN_PUBLIC_BACK_HREF;
}

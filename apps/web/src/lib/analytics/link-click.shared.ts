/**
 * Server-safe link_click helpers shared by the browser tracker and the
 * /api/analytics route handler.
 *
 * These are pure functions/constants. They MUST NOT live in a `'use client'`
 * module: route handlers importing from a client module receive client
 * reference proxies, and calling one throws at runtime (real 500s for every
 * link_click — found by WS14-T008 real integration testing).
 */

/** Approved profile-link categories for `link_click` (exact match, no aliases). */
export const PROFILE_LINK_CLICK_CATEGORIES = [
  'website',
  'github',
  'linkedin',
  'twitter',
  'resume',
  'other',
] as const;

/** Approved project-link categories for `link_click`. */
export const PROJECT_LINK_CLICK_CATEGORIES = [
  'live',
  'demo',
  'repo',
  'paper',
  'other',
] as const;

export type ProfileLinkClickCategory = (typeof PROFILE_LINK_CLICK_CATEGORIES)[number];
export type ProjectLinkClickCategory = (typeof PROJECT_LINK_CLICK_CATEGORIES)[number];

export function normalizeProfileLinkCategory(raw: string | null | undefined): ProfileLinkClickCategory | null {
  if (!raw) return null;
  const t = raw.toLowerCase().trim();
  if (t === 'x') return 'twitter';
  if ((PROFILE_LINK_CLICK_CATEGORIES as readonly string[]).includes(t)) {
    return t as ProfileLinkClickCategory;
  }
  if (t === 'email') return null; // mailto / contact — not an external share link for T002
  return 'other';
}

export function normalizeProjectLinkCategory(raw: string | null | undefined): ProjectLinkClickCategory | null {
  if (!raw) return null;
  const t = raw.toLowerCase().trim();
  if ((PROJECT_LINK_CLICK_CATEGORIES as readonly string[]).includes(t)) {
    return t as ProjectLinkClickCategory;
  }
  return 'other';
}

export function isApprovedLinkCategory(
  kind: 'profile' | 'project',
  category: unknown,
): boolean {
  if (typeof category !== 'string') return false;
  if (kind === 'profile') {
    return (PROFILE_LINK_CLICK_CATEGORIES as readonly string[]).includes(category);
  }
  return (PROJECT_LINK_CLICK_CATEGORIES as readonly string[]).includes(category);
}

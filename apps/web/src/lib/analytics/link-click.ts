'use client';

import { createSessionId, isAnalyticsResourceId, trackEvent } from '@codecard/analytics';

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

/**
 * Best-effort `link_click` after a real activation. Never blocks navigation.
 */
export function trackLinkClick(options: {
  profileId?: string | null;
  projectId?: string | null;
  linkCategory: string;
  kind: 'profile' | 'project';
}): void {
  const profileId = options.profileId ?? undefined;
  if (!isAnalyticsResourceId(profileId)) return;

  const category =
    options.kind === 'profile'
      ? normalizeProfileLinkCategory(options.linkCategory)
      : normalizeProjectLinkCategory(options.linkCategory);
  if (!category) return;

  const projectId = options.projectId ?? undefined;
  if (options.kind === 'project' && !isAnalyticsResourceId(projectId)) return;

  void trackEvent('/api/analytics', {
    event_type: 'link_click',
    profile_id: profileId,
    project_id: options.kind === 'project' ? projectId : undefined,
    target_type: options.kind === 'project' ? 'project' : 'profile',
    target_id: options.kind === 'project' ? projectId : profileId,
    session_id: createSessionId(),
    metadata: {
      link_category: category,
      link_kind: options.kind,
    },
  });
}

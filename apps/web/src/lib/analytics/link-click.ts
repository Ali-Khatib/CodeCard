'use client';

import { createSessionId, isAnalyticsResourceId, trackEvent } from '@codecard/analytics';
import {
  normalizeProfileLinkCategory,
  normalizeProjectLinkCategory,
} from './link-click.shared';

// Pure category helpers live in the server-safe shared module: the
// /api/analytics route handler must never import them through this
// `'use client'` module (client-reference proxies throw on the server).
export {
  PROFILE_LINK_CLICK_CATEGORIES,
  PROJECT_LINK_CLICK_CATEGORIES,
  normalizeProfileLinkCategory,
  normalizeProjectLinkCategory,
  isApprovedLinkCategory,
  type ProfileLinkClickCategory,
  type ProjectLinkClickCategory,
} from './link-click.shared';

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

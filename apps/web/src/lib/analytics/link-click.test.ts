import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  isApprovedLinkCategory,
  normalizeProfileLinkCategory,
  normalizeProjectLinkCategory,
  trackLinkClick,
} from './link-click';

vi.mock('@codecard/analytics', () => ({
  isAnalyticsResourceId: (id: string | undefined) =>
    Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)),
  createSessionId: () => 'session-test',
  trackEvent: vi.fn(async () => undefined),
}));

import { trackEvent } from '@codecard/analytics';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ID = '22222222-2222-4222-8222-222222222222';

describe('WS08-T002 link click analytics', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes approved profile and project categories', () => {
    expect(normalizeProfileLinkCategory('GitHub')).toBe('github');
    expect(normalizeProfileLinkCategory('x')).toBe('twitter');
    expect(normalizeProfileLinkCategory('email')).toBeNull();
    expect(normalizeProjectLinkCategory('live')).toBe('live');
    expect(normalizeProjectLinkCategory('demo')).toBe('demo');
    expect(isApprovedLinkCategory('profile', 'github')).toBe(true);
    expect(isApprovedLinkCategory('profile', 'EMAIL')).toBe(false);
    expect(isApprovedLinkCategory('project', 'repo')).toBe(true);
  });

  it('emits link_click for a public profile link without raw URL', () => {
    trackLinkClick({
      profileId: PROFILE_ID,
      linkCategory: 'github',
      kind: 'profile',
    });

    expect(trackEvent).toHaveBeenCalledWith('/api/analytics', {
      event_type: 'link_click',
      profile_id: PROFILE_ID,
      project_id: undefined,
      target_type: 'profile',
      target_id: PROFILE_ID,
      session_id: 'session-test',
      metadata: { link_category: 'github', link_kind: 'profile' },
    });
    const payload = vi.mocked(trackEvent).mock.calls[0]?.[1] as { metadata?: Record<string, unknown> };
    expect(JSON.stringify(payload)).not.toContain('https://');
  });

  it('emits link_click for a published project link', () => {
    trackLinkClick({
      profileId: PROFILE_ID,
      projectId: PROJECT_ID,
      linkCategory: 'repo',
      kind: 'project',
    });

    expect(trackEvent).toHaveBeenCalledWith('/api/analytics', {
      event_type: 'link_click',
      profile_id: PROFILE_ID,
      project_id: PROJECT_ID,
      target_type: 'project',
      target_id: PROJECT_ID,
      session_id: 'session-test',
      metadata: { link_category: 'repo', link_kind: 'project' },
    });
  });

  it('skips invalid ids and email links', () => {
    trackLinkClick({ profileId: 'bad', linkCategory: 'github', kind: 'profile' });
    trackLinkClick({
      profileId: PROFILE_ID,
      linkCategory: 'email',
      kind: 'profile',
    });
    trackLinkClick({
      profileId: PROFILE_ID,
      projectId: 'bad',
      linkCategory: 'repo',
      kind: 'project',
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });
});

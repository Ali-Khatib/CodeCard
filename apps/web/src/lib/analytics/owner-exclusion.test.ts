import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isAuthenticatedContentOwner,
  isOwnerExcludedAudienceEvent,
  OWNER_EXCLUDED_AUDIENCE_EVENTS,
} from './owner-exclusion';

describe('WS08-T003 owner exclusion helpers', () => {
  it('marks only audience view/time events for owner exclusion', () => {
    for (const event of OWNER_EXCLUDED_AUDIENCE_EVENTS) {
      expect(isOwnerExcludedAudienceEvent(event)).toBe(true);
    }
    expect(isOwnerExcludedAudienceEvent('link_click')).toBe(false);
    expect(isOwnerExcludedAudienceEvent('profile_share')).toBe(false);
    expect(isOwnerExcludedAudienceEvent('qr_download')).toBe(false);
  });

  it('never trusts client ownership flags when resolving ownership', async () => {
    const getUser = vi.fn(async () => ({ data: { user: null } }));
    const from = vi.fn();
    const supabase = { auth: { getUser }, from } as never;

    const isOwner = await isAuthenticatedContentOwner(supabase, {
      profile_id: '11111111-1111-4111-8111-111111111111',
    });

    expect(isOwner).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});

describe('WS08-T003 isAuthenticatedContentOwner', () => {
  const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const OTHER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
  const PROJECT_ID = '22222222-2222-4222-8222-222222222222';
  const PAPER_ID = '33333333-3333-4333-8333-333333333333';

  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUser = vi.fn();
    mockFrom = vi.fn();
  });

  function supabase() {
    return { auth: { getUser: mockGetUser }, from: mockFrom } as never;
  }

  function ownershipQuery(ownerUserId: string | null) {
    const builder: Record<string, unknown> = {};
    const self = () => builder;
    builder.select = vi.fn(self);
    builder.eq = vi.fn(self);
    builder.maybeSingle = vi.fn(async () => ({
      data: ownerUserId ? { owner_user_id: ownerUserId } : null,
      error: null,
    }));
    return builder;
  }

  it('detects profile ownership server-side', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    mockFrom.mockReturnValue(ownershipQuery(OWNER_ID));

    await expect(
      isAuthenticatedContentOwner(supabase(), { profile_id: PROFILE_ID }),
    ).resolves.toBe(true);

    mockGetUser.mockResolvedValue({ data: { user: { id: OTHER_ID } } });
    await expect(
      isAuthenticatedContentOwner(supabase(), { profile_id: PROFILE_ID }),
    ).resolves.toBe(false);
  });

  it('detects project and research ownership', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') return ownershipQuery(OWNER_ID);
      if (table === 'research_papers') return ownershipQuery(OWNER_ID);
      return ownershipQuery(null);
    });

    await expect(
      isAuthenticatedContentOwner(supabase(), { project_id: PROJECT_ID }),
    ).resolves.toBe(true);
    await expect(
      isAuthenticatedContentOwner(supabase(), { research_paper_id: PAPER_ID }),
    ).resolves.toBe(true);
  });
});

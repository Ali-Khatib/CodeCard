import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  evaluateResearchPublishReadiness,
  executePublishResearch,
  executeUnpublishResearch,
} from './research-publish-core';

const PAPER_ID = '22222222-2222-4222-8222-222222222222';

const ownedProfile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
  slug: 'alex-chen',
  is_public: true,
};

const ownedPaper = {
  id: PAPER_ID,
  tenant_id: 'tenant-1',
  profile_id: 'profile-1',
  owner_user_id: 'user-1',
  related_project_id: null,
  slug: 'attention-is-all-you-need',
  title: 'Attention Is All You Need',
  abstract: 'Transformer architecture',
  authors: ['Ashish Vaswani'],
  venue: 'NeurIPS',
  publication_status: 'Published',
  year: 2017,
  pdf_url: null,
  doi_url: null,
  citation_text: null,
  tags: [],
  cover_image_url: null,
  is_published: false,
  sort_order: 0,
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  paper?: typeof ownedPaper | null;
  updateError?: { message: string } | null;
}) {
  let updatedPayload: unknown;
  const updateEq = vi.fn().mockResolvedValue({ error: options.updateError ?? null });

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: options.profile ?? null,
              error: options.profile ? null : { message: 'not found' },
            }),
          })),
        })),
      };
    }

    if (table === 'research_papers') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.paper ?? null,
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })),
        update: vi.fn((payload: unknown) => {
          updatedPayload = payload;
          return {
            eq: vi.fn(() => ({
              eq: updateEq,
            })),
          };
        }),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: options.user ?? null } }),
      },
      from,
    } as unknown as SupabaseClient,
    getUpdatedPayload: () => updatedPayload,
    updateEq,
  };
}

describe('evaluateResearchPublishReadiness', () => {
  it('requires title and slug only', () => {
    expect(
      evaluateResearchPublishReadiness({
        title: 'Paper',
        slug: 'paper',
        authors: [],
        abstract: null,
      }).ready,
    ).toBe(true);

    expect(
      evaluateResearchPublishReadiness({
        title: '   ',
        slug: 'paper',
        authors: [],
        abstract: null,
      }).ready,
    ).toBe(false);
  });
});

describe('executePublishResearch', () => {
  it('denies unauthenticated publish', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executePublishResearch(supabase, PAPER_ID);
    expect(result.errorCode).toBe('auth');
  });

  it('denies foreign paper', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: null,
    });
    const result = await executePublishResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });
    expect(result.errorCode).toBe('not_found');
  });

  it('keeps incomplete papers as drafts', async () => {
    const { supabase, updateEq } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: { ...ownedPaper, title: '  ', is_published: false },
    });
    const result = await executePublishResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });
    expect(result.errorCode).toBe('validation');
    expect(result.fieldErrors?.title).toMatch(/title/i);
    expect(result.is_published).toBe(false);
    expect(updateEq).not.toHaveBeenCalled();
  });

  it('publishes only the is_published field', async () => {
    const { supabase, getUpdatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
    });

    const result = await executePublishResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });

    expect(result.success).toBe(true);
    expect(result.is_published).toBe(true);
    expect(getUpdatedPayload()).toEqual({ is_published: true });
  });

  it('is idempotent when already published', async () => {
    const { supabase, updateEq } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: { ...ownedPaper, is_published: true },
    });

    const result = await executePublishResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });
    expect(result.success).toBe(true);
    expect(result.is_published).toBe(true);
    expect(updateEq).not.toHaveBeenCalled();
  });
});

describe('executeUnpublishResearch', () => {
  it('unpublishes without readiness checks', async () => {
    const { supabase, getUpdatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: { ...ownedPaper, is_published: true, title: '  ' },
    });

    const result = await executeUnpublishResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });
    expect(result.success).toBe(true);
    expect(result.is_published).toBe(false);
    expect(getUpdatedPayload()).toEqual({ is_published: false });
  });
});

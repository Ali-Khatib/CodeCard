import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeDeleteResearch,
  RESEARCH_DELETE_STORAGE_DEFERRED,
} from './research-delete-core';

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
  related_project_id: '33333333-3333-4333-8333-333333333333',
  slug: 'attention-is-all-you-need',
  title: 'Attention Is All You Need',
  abstract: null,
  authors: [],
  venue: null,
  publication_status: null,
  year: null,
  pdf_url: 'https://example.com/paper.pdf',
  doi_url: null,
  citation_text: null,
  tags: [],
  cover_image_url: null,
  is_published: true,
  sort_order: 0,
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  paper?: typeof ownedPaper | null;
  deleteError?: { message: string } | null;
}) {
  const paperDelete = vi.fn().mockResolvedValue({ error: options.deleteError ?? null });

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
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: paperDelete,
          })),
        })),
      };
    }

    if (table === 'research_figures') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
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
    paperDelete,
  };
}

describe('executeDeleteResearch', () => {
  it('denies unauthenticated delete', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeDeleteResearch(supabase, PAPER_ID);
    expect(result.errorCode).toBe('auth');
    expect(result.success).toBeUndefined();
  });

  it('deletes an owned paper and returns redirect target', async () => {
    const { supabase, paperDelete } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
    });

    const result = await executeDeleteResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });

    expect(result.success).toBe(true);
    expect(result.researchPaperId).toBe(PAPER_ID);
    expect(result.wasPublished).toBe(true);
    expect(result.paperSlug).toBe('attention-is-all-you-need');
    expect(result.redirectTo).toBe('/dashboard/research');
    expect(paperDelete).toHaveBeenCalled();
    expect(RESEARCH_DELETE_STORAGE_DEFERRED).toBe(true);
  });

  it('treats foreign or missing papers as already removed without leaking details', async () => {
    const { supabase, paperDelete } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: null,
    });

    const result = await executeDeleteResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });

    expect(result.success).toBe(true);
    expect(result.alreadyDeleted).toBe(true);
    expect(result.redirectTo).toBe('/dashboard/research');
    expect(result.error).toBeUndefined();
    expect(paperDelete).not.toHaveBeenCalled();
  });

  it('treats repeated delete as safe already-removed success', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: null,
    });

    const first = await executeDeleteResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });
    const second = await executeDeleteResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(second.alreadyDeleted).toBe(true);
  });

  it('hides raw delete errors', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
      deleteError: { message: 'permission denied for table research_papers' },
    });

    const result = await executeDeleteResearch(supabase, PAPER_ID, { user: { id: 'user-1' } });

    expect(result.errorCode).toBe('server');
    expect(result.error).not.toMatch(/permission denied/i);
  });
});

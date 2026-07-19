import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RESEARCH_SLUG_TAKEN_MESSAGE } from '@codecard/validation';
import {
  executeUpdateResearch,
  parseUpdateResearchFormData,
  validateUpdateResearchPayload,
} from './research-update-core';

const PAPER_ID = '22222222-2222-4222-8222-222222222222';
const PROJECT_ID = '33333333-3333-4333-8333-333333333333';

function makeFormData(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        fd.append(key, item);
      }
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

const validEntries: Record<string, string | string[]> = {
  research_paper_id: PAPER_ID,
  title: 'Attention Is All You Need',
  slug: 'attention-is-all-you-need',
  abstract: 'Transformer architecture',
  authors: ['Ashish Vaswani', 'Noam Shazeer'],
  venue: 'NeurIPS',
  publication_status: 'Published',
  year: '2017',
  doi_url: '10.5555/3295222.3295349',
  citation_text: 'Vaswani et al., 2017',
  tags: ['transformers'],
};

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
  related_project_id: PROJECT_ID,
  slug: 'attention-is-all-you-need',
  title: 'Attention Is All You Need',
  abstract: 'Transformer architecture',
  authors: ['Ashish Vaswani'],
  venue: 'NeurIPS',
  publication_status: 'Published',
  year: 2017,
  pdf_url: 'https://example.com/paper.pdf',
  doi_url: 'https://doi.org/10.5555/3295222.3295349',
  citation_text: 'Vaswani et al., 2017',
  tags: ['transformers'],
  cover_image_url: null,
  is_published: true,
  sort_order: 3,
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  paper?: typeof ownedPaper | null;
  updateError?: { code?: string; message?: string } | null;
  relatedProject?: Record<string, unknown> | null;
}) {
  let updatedPayload: unknown;

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
              eq: vi.fn().mockResolvedValue({ error: options.updateError ?? null }),
            })),
          };
        }),
      };
    }

    if (table === 'projects') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: options.relatedProject ?? null,
                error: null,
              }),
            })),
          })),
        })),
      };
    }

    if (table === 'circle_activity') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        // Production emit path uses upsert (onConflict: dedupe_key).
        upsert: vi.fn().mockResolvedValue({ error: null }),
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
  };
}

describe('parseUpdateResearchFormData', () => {
  it('omits related_project_id when the field is not posted', () => {
    const parsed = parseUpdateResearchFormData(makeFormData(validEntries));
    expect(parsed.research_paper_id).toBe(PAPER_ID);
    expect(parsed.related_project_id).toBeUndefined();
  });

  it('accepts explicit null related_project_id to clear the link', () => {
    const parsed = parseUpdateResearchFormData(
      makeFormData({ ...validEntries, related_project_id: '' }),
    );
    expect(parsed.related_project_id).toBeNull();
  });
});

describe('validateUpdateResearchPayload', () => {
  it('rejects ownership and publication fields', () => {
    const result = validateUpdateResearchPayload({
      ...validEntries,
      authors: ['A'],
      tags: [],
      owner_user_id: 'user-1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.errorCode).toBe('validation');
    }
  });

  it('rejects is_published and sort_order', () => {
    expect(
      validateUpdateResearchPayload({
        research_paper_id: PAPER_ID,
        title: 'T',
        slug: 't',
        authors: [],
        tags: [],
        is_published: true,
      }).success,
    ).toBe(false);
    expect(
      validateUpdateResearchPayload({
        research_paper_id: PAPER_ID,
        title: 'T',
        slug: 't',
        authors: [],
        tags: [],
        sort_order: 9,
      }).success,
    ).toBe(false);
  });
});

describe('executeUpdateResearch', () => {
  it('denies unauthenticated update', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeUpdateResearch(supabase, makeFormData(validEntries));
    expect(result.errorCode).toBe('auth');
  });

  it('denies missing profile', async () => {
    const { supabase } = createMockSupabase({ user: { id: 'user-1' }, profile: null });
    const result = await executeUpdateResearch(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });
    expect(result.errorCode).toBe('auth');
  });

  it('denies foreign/missing paper', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: null,
    });
    const result = await executeUpdateResearch(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });
    expect(result.errorCode).toBe('not_found');
  });

  it('persists allowlisted fields without changing publication or sort order', async () => {
    const { supabase, getUpdatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
    });

    const result = await executeUpdateResearch(
      supabase,
      makeFormData({
        ...validEntries,
        title: 'Updated Title',
        slug: 'updated-title',
        abstract: 'New abstract',
        authors: ['Ada', 'Grace'],
        venue: 'ICML',
        year: '2018',
      }),
      { user: { id: 'user-1' } },
    );

    expect(result.success).toBe(true);
    expect(result.researchPaperId).toBe(PAPER_ID);
    expect(result.isPublished).toBe(true);
    expect(result.previousSlug).toBe('attention-is-all-you-need');

    const payload = getUpdatedPayload() as Record<string, unknown>;
    expect(payload.title).toBe('Updated Title');
    expect(payload.slug).toBe('updated-title');
    expect(payload.abstract).toBe('New abstract');
    expect(payload.authors).toEqual(['Ada', 'Grace']);
    expect(payload.venue).toBe('ICML');
    expect(payload.year).toBe(2018);
    expect(payload).not.toHaveProperty('is_published');
    expect(payload).not.toHaveProperty('sort_order');
    expect(payload).not.toHaveProperty('owner_user_id');
    expect(payload).not.toHaveProperty('tenant_id');
    expect(payload).not.toHaveProperty('profile_id');
    expect(payload.related_project_id).toBe(PROJECT_ID);
  });

  it('rejects forged owner fields in the form', async () => {
    const fd = makeFormData(validEntries);
    fd.set('owner_user_id', 'attacker');
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
    });
    const result = await executeUpdateResearch(supabase, fd, { user: { id: 'user-1' } });
    expect(result.errorCode).toBe('validation');
  });

  it('maps duplicate slug to a safe field error', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
      updateError: { code: '23505', message: 'duplicate' },
    });
    const result = await executeUpdateResearch(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });
    expect(result.errorCode).toBe('slug_taken');
    expect(result.fieldErrors?.slug).toBe(RESEARCH_SLUG_TAKEN_MESSAGE);
  });

  it('accepts an owned related project when posted', async () => {
    const { supabase, getUpdatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
      relatedProject: {
        id: PROJECT_ID,
        owner_user_id: 'user-1',
        profile_id: 'profile-1',
        tenant_id: 'tenant-1',
      },
    });

    const result = await executeUpdateResearch(
      supabase,
      makeFormData({ ...validEntries, related_project_id: PROJECT_ID }),
      { user: { id: 'user-1' } },
    );

    expect(result.success).toBe(true);
    expect((getUpdatedPayload() as { related_project_id: string }).related_project_id).toBe(
      PROJECT_ID,
    );
  });

  it('rejects a foreign related project', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
      relatedProject: {
        id: PROJECT_ID,
        owner_user_id: 'user-1',
        profile_id: 'other-profile',
        tenant_id: 'tenant-1',
      },
    });

    const result = await executeUpdateResearch(
      supabase,
      makeFormData({ ...validEntries, related_project_id: PROJECT_ID }),
      { user: { id: 'user-1' } },
    );

    expect(result.errorCode).toBe('validation');
    expect(result.fieldErrors?.related_project_id).toMatch(/your projects/i);
  });

  it('clears related_project_id when an empty value is posted', async () => {
    const { supabase, getUpdatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paper: ownedPaper,
    });

    const result = await executeUpdateResearch(
      supabase,
      makeFormData({ ...validEntries, related_project_id: '' }),
      { user: { id: 'user-1' } },
    );

    expect(result.success).toBe(true);
    expect((getUpdatedPayload() as { related_project_id: null }).related_project_id).toBeNull();
  });
});

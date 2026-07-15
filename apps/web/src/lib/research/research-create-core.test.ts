import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RESEARCH_SLUG_TAKEN_MESSAGE } from '@codecard/validation';
import {
  executeCreateResearch,
  mapResearchCreateDbError,
  parseCreateResearchFormData,
  validateCreateResearchPayload,
} from './research-create-core';

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
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: Record<string, unknown> | null;
  paperCount?: number;
  insertError?: { code?: string; message?: string } | null;
  relatedProject?: Record<string, unknown> | null;
  relatedProjectError?: boolean;
}) {
  let insertedPayload: unknown;

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

    if (table === 'projects') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: options.relatedProjectError ? null : options.relatedProject ?? null,
                error: options.relatedProjectError ? { message: 'missing' } : null,
              }),
            })),
          })),
        })),
      };
    }

    if (table === 'research_papers') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              count: options.paperCount ?? 0,
              error: null,
            }),
          ),
        })),
        insert: vi.fn((payload: unknown) => {
          insertedPayload = payload;
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: options.insertError
                  ? null
                  : { id: 'paper-new', slug: (payload as { slug: string }).slug },
                error: options.insertError ?? null,
              }),
            })),
          };
        }),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: options.user ?? null } }),
    },
    from,
  } as unknown as SupabaseClient;

  return {
    supabase,
    insertedPayload: () => insertedPayload as Record<string, unknown> | undefined,
  };
}

describe('parseCreateResearchFormData', () => {
  it('reads known fields and ignores ownership payloads', () => {
    const fd = makeFormData({
      ...validEntries,
      owner_user_id: 'evil',
      tenant_id: 'evil',
      profile_id: 'evil',
      is_published: 'true',
      sort_order: '9',
    });
    const parsed = parseCreateResearchFormData(fd);
    expect(parsed.title).toBe('Attention Is All You Need');
    expect(parsed.authors).toEqual(['Ashish Vaswani', 'Noam Shazeer']);
    expect(parsed).not.toHaveProperty('owner_user_id');
    expect(parsed).not.toHaveProperty('is_published');
  });
});

describe('validateCreateResearchPayload', () => {
  it('rejects forbidden ownership fields', () => {
    const result = validateCreateResearchPayload({
      ...validEntries,
      owner_user_id: 'user-1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.errorCode).toBe('validation');
    }
  });

  it('accepts a valid payload', () => {
    const result = validateCreateResearchPayload(validEntries);
    expect(result.success).toBe(true);
  });
});

describe('executeCreateResearch', () => {
  it('denies unauthenticated creation', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeCreateResearch(supabase, makeFormData(validEntries));
    expect(result.success).toBeUndefined();
    expect(result.errorCode).toBe('auth');
  });

  it('fails safely when profile is missing', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: null,
    });
    const result = await executeCreateResearch(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });
    expect(result.errorCode).toBe('auth');
  });

  it('creates an unpublished paper for the authenticated profile', async () => {
    const { supabase, insertedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      paperCount: 2,
    });

    const result = await executeCreateResearch(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.success).toBe(true);
    expect(result.researchPaperId).toBe('paper-new');
    expect(result.redirectTo).toBe('/dashboard/research');
    expect(insertedPayload()?.is_published).toBe(false);
    expect(insertedPayload()?.owner_user_id).toBe('user-1');
    expect(insertedPayload()?.profile_id).toBe('profile-1');
    expect(insertedPayload()?.tenant_id).toBe('tenant-1');
    expect(insertedPayload()?.sort_order).toBe(2);
    expect(insertedPayload()?.cover_image_url).toBeNull();
    expect(insertedPayload()?.doi_url).toBe('https://doi.org/10.5555/3295222.3295349');
  });

  it('rejects a foreign related project without disclosing ownership details', async () => {
    const { supabase, insertedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      relatedProjectError: true,
    });

    const result = await executeCreateResearch(
      supabase,
      makeFormData({
        ...validEntries,
        related_project_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
      { user: { id: 'user-1' } },
    );

    expect(result.success).toBeUndefined();
    expect(result.fieldErrors?.related_project_id).toContain('your projects');
    expect(insertedPayload()).toBeUndefined();
  });

  it('accepts an owned related project', async () => {
    const { supabase, insertedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      relatedProject: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        owner_user_id: 'user-1',
        profile_id: 'profile-1',
        tenant_id: 'tenant-1',
      },
    });

    const result = await executeCreateResearch(
      supabase,
      makeFormData({
        ...validEntries,
        related_project_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
      { user: { id: 'user-1' } },
    );

    expect(result.success).toBe(true);
    expect(insertedPayload()?.related_project_id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });

  it('maps duplicate slug collisions to a friendly field error', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      insertError: { code: '23505', message: 'duplicate key' },
    });

    const result = await executeCreateResearch(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.errorCode).toBe('slug_taken');
    expect(result.fieldErrors?.slug).toBe(RESEARCH_SLUG_TAKEN_MESSAGE);
    expect(result.error).not.toMatch(/duplicate key|23505/i);
  });

  it('rejects forged publication and ownership form fields', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });

    const result = await executeCreateResearch(
      supabase,
      makeFormData({
        ...validEntries,
        is_published: 'true',
      }),
      { user: { id: 'user-1' } },
    );

    expect(result.errorCode).toBe('validation');
  });
});

describe('mapResearchCreateDbError', () => {
  it('hides raw database errors', () => {
    const mapped = mapResearchCreateDbError({ code: '42P01', message: 'relation missing' });
    expect(mapped.error).not.toMatch(/relation|42P01/i);
    expect(mapped.errorCode).toBe('server');
  });
});

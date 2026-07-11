import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeCreateProfileLink,
  executeDeleteProfileLink,
  executeMoveProfileLink,
  executeReorderProfileLinks,
  executeUpdateProfileLink,
} from './profile-link-core';

const profile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
  slug: 'alex-chen',
  is_public: false,
};

function makeFormData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof profile | null;
  links?: Array<{ id: string; type: string; label: string | null; url: string; sort_order: number }>;
  insertResult?: { id: string; type: string; label: string | null; url: string; sort_order: number } | null;
  updateError?: { message?: string } | null;
}) {
  let links = [...(options.links ?? [])];
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();

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

    if (table === 'profile_links') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: string) => {
            if (column === 'profile_id') {
              return {
                order: vi.fn().mockResolvedValue({ data: links, error: null }),
                maybeSingle: vi.fn().mockImplementation(async () => {
                  const found = links.find((link) => link.id === value);
                  return { data: found ?? null, error: null };
                }),
                eq: vi.fn((_col: string, linkId: string) => ({
                  maybeSingle: vi.fn().mockImplementation(async () => {
                    const found = links.find((link) => link.id === linkId);
                    return { data: found ?? null, error: null };
                  }),
                  single: vi.fn().mockImplementation(async () => {
                    const found = links.find((link) => link.id === linkId);
                    return { data: found ?? null, error: found ? null : { message: 'not found' } };
                  }),
                })),
              };
            }
            return {
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        })),
        insert: vi.fn((payload: unknown) => {
          insert(payload);
          const row = options.insertResult ?? {
            id: 'link-new',
            type: 'github',
            label: 'GitHub',
            url: 'https://github.com/alex',
            sort_order: links.length,
          };
          links.push(row);
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: row, error: null }),
            })),
          };
        }),
        update: vi.fn((payload: unknown) => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => {
              update(payload);
              return Promise.resolve({ error: options.updateError ?? null });
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => {
              del();
              return Promise.resolve({ error: null });
            }),
          })),
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
    insert,
    update,
    del,
    getLinks: () => links,
  };
}

describe('executeCreateProfileLink', () => {
  it('denies unauthenticated create', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeCreateProfileLink(
      supabase,
      makeFormData({ type: 'github', label: 'GitHub', url: 'https://github.com/alex' }),
    );
    expect(result.error).toMatch(/signed in/i);
  });

  it('creates an owned profile link', async () => {
    const { supabase, insert } = createMockSupabase({ user: { id: 'user-1' }, profile });
    const result = await executeCreateProfileLink(
      supabase,
      makeFormData({ type: 'github', label: 'GitHub', url: 'https://github.com/alex' }),
    );
    expect(result.success).toBe(true);
    expect(insert).toHaveBeenCalled();
  });

  it('rejects javascript URLs', async () => {
    const { supabase } = createMockSupabase({ user: { id: 'user-1' }, profile });
    const result = await executeCreateProfileLink(
      supabase,
      makeFormData({ type: 'website', label: 'Bad', url: 'javascript:alert(1)' }),
    );
    expect(result.success).toBeUndefined();
    expect(result.fieldErrors?.url || result.error).toBeTruthy();
  });

  it('rejects duplicate links', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile,
      links: [
        {
          id: 'link-1',
          type: 'github',
          label: null,
          url: 'https://github.com/alex',
          sort_order: 0,
        },
      ],
    });
    const result = await executeCreateProfileLink(
      supabase,
      makeFormData({ type: 'github', label: 'GitHub', url: 'https://github.com/alex' }),
    );
    expect(result.error).toMatch(/already exists/i);
  });
});

describe('executeUpdateProfileLink', () => {
  it('rejects foreign link IDs', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile,
      links: [],
    });
    const result = await executeUpdateProfileLink(
      supabase,
      makeFormData({
        link_id: 'foreign-link',
        type: 'github',
        label: 'GitHub',
        url: 'https://github.com/alex',
      }),
    );
    expect(result.error).toBe('Profile link not found.');
  });
});

describe('executeDeleteProfileLink', () => {
  it('deletes an owned link', async () => {
    const { supabase, del } = createMockSupabase({
      user: { id: 'user-1' },
      profile,
      links: [
        {
          id: 'link-1',
          type: 'github',
          label: null,
          url: 'https://github.com/alex',
          sort_order: 0,
        },
      ],
    });
    const result = await executeDeleteProfileLink(supabase, 'link-1');
    expect(result.success).toBe(true);
    expect(del).toHaveBeenCalled();
  });
});

describe('executeReorderProfileLinks', () => {
  const linkOneId = '11111111-1111-4111-8111-111111111111';

  it('rejects foreign IDs', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile,
      links: [
        {
          id: linkOneId,
          type: 'github',
          label: null,
          url: 'https://github.com/alex',
          sort_order: 0,
        },
      ],
    });
    const result = await executeReorderProfileLinks(supabase, ['33333333-3333-4333-8333-333333333333']);
    expect(result.error).toBeTruthy();
  });
});

describe('executeMoveProfileLink', () => {
  const linkOneId = '11111111-1111-4111-8111-111111111111';
  const linkTwoId = '22222222-2222-4222-8222-222222222222';

  it('moves a link down', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile,
      links: [
        {
          id: linkOneId,
          type: 'github',
          label: null,
          url: 'https://github.com/alex',
          sort_order: 0,
        },
        {
          id: linkTwoId,
          type: 'website',
          label: null,
          url: 'https://example.com',
          sort_order: 1,
        },
      ],
    });
    const result = await executeMoveProfileLink(supabase, linkOneId, 'down', { user: { id: 'user-1' } });
    expect(result.success).toBe(true);
  });
});

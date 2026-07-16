import { describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { buildAccountExportDocument } from './export-build';
import { ACCOUNT_EXPORT_SCHEMA_VERSION, FORBIDDEN_EXPORT_FIELD_NAMES } from './export-schema';

const OWNER_A = '11111111-1111-4111-8111-111111111111';
const PROFILE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: OWNER_A,
    email: 'owner-a@example.com',
    created_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-07-01T00:00:00.000Z',
    identities: [{ provider: 'email', id: '1' } as User['identities'] extends (infer I)[] | undefined ? I : never],
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    ...overrides,
  } as User;
}

function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
      }
      if (prop in target) return target[prop as string];
      const fn = vi.fn(() => self);
      target[prop as string] = fn;
      return fn;
    },
  });
  return self;
}

describe('WS10-T002 buildAccountExportDocument', () => {
  it('builds versioned export for authenticated owner without service role', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'profiles') {
        return createChain({
          data: {
            id: PROFILE_A,
            slug: 'owner-a',
            display_name: 'Owner A',
            headline: 'Engineer',
            bio: 'Bio',
            location: null,
            skills: ['TypeScript'],
            is_public: true,
            avatar_url: 'https://cdn.example.com/a.png',
            created_at: '2026-01-02T00:00:00.000Z',
            updated_at: '2026-01-03T00:00:00.000Z',
          },
          error: null,
        });
      }
      if (table === 'profile_links') {
        return createChain({
          data: [
            {
              id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
              type: 'github',
              label: 'GitHub',
              url: 'https://github.com/a',
              sort_order: 0,
              created_at: '2026-01-02T00:00:00.000Z',
              updated_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        });
      }
      return createChain({ data: [], error: null });
    });

    const result = await buildAccountExportDocument({ from } as never, mockUser());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.document.schema_version).toBe(ACCOUNT_EXPORT_SCHEMA_VERSION);
    expect(result.document.account.email).toBe('owner-a@example.com');
    expect(result.document.profile?.slug).toBe('owner-a');
    expect(result.document.profile_links).toHaveLength(1);
    expect(result.document.projects).toEqual([]);
    expect(result.document.research).toEqual([]);
    expect(result.document.analytics_summary).toBeNull();

    const serialized = JSON.stringify(result.document);
    for (const forbidden of FORBIDDEN_EXPORT_FIELD_NAMES) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
  });

  it('fails atomically when profile query errors', async () => {
    const from = vi.fn(() => createChain({ data: null, error: { message: 'boom' } }));
    const result = await buildAccountExportDocument({ from } as never, mockUser());
    expect(result).toEqual({ ok: false, error: 'query_failed' });
  });

  it('exports empty profile sections when no profile exists', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'profiles') {
        return createChain({ data: null, error: null });
      }
      return createChain({ data: [], error: null });
    });
    const result = await buildAccountExportDocument({ from } as never, mockUser());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.profile).toBeNull();
    expect(result.document.profile_links).toEqual([]);
  });
});

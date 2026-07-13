import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadProfileCompletion, loadProfileCompletionFlags } from './completion-data';

function createMockSupabase(options: {
  profileId?: string;
  links?: number;
  published?: number;
  projects?: number;
  linksError?: boolean;
  publishedError?: boolean;
  projectsError?: boolean;
}) {
  const ownerProfileId = options.profileId ?? 'profile-1';

  const from = vi.fn((table: string) => {
    if (table === 'profile_links') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_: string, profileId: string) =>
            Promise.resolve({
              count:
                profileId === ownerProfileId && !options.linksError ? (options.links ?? 0) : 0,
              error:
                profileId === ownerProfileId && options.linksError
                  ? { message: 'links failed' }
                  : null,
            }),
          ),
        })),
      };
    }

    if (table === 'projects') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_: string, profileId: string) => {
            if (profileId !== ownerProfileId) {
              const zero = Promise.resolve({ count: 0, error: null });
              return Object.assign(zero, {
                eq: vi.fn(() => zero),
              });
            }

            const anyProjectResult = Promise.resolve({
              count: options.projectsError ? null : (options.projects ?? 0),
              error: options.projectsError ? { message: 'projects failed' } : null,
            });

            return {
              eq: vi.fn((column: string) => {
                if (column === 'is_published') {
                  return Promise.resolve({
                    count: options.publishedError ? null : (options.published ?? 0),
                    error: options.publishedError ? { message: 'published failed' } : null,
                  });
                }
                return anyProjectResult;
              }),
              then: anyProjectResult.then.bind(anyProjectResult),
            };
          }),
        })),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return { from } as unknown as SupabaseClient;
}

describe('loadProfileCompletionFlags', () => {
  it('counts only persisted links and published projects for the owner profile', async () => {
    const supabase = createMockSupabase({ links: 2, published: 1, projects: 3 });
    const flags = await loadProfileCompletionFlags(supabase, 'profile-1');

    expect(flags.hasProfileLink).toBe(true);
    expect(flags.hasPublishedProject).toBe(true);
    expect(flags.hasAnyProject).toBe(true);
    expect(flags.error).toBeUndefined();
  });

  it('does not count another profile links or projects', async () => {
    const supabase = createMockSupabase({ links: 2, published: 1, projects: 3 });
    const flags = await loadProfileCompletionFlags(supabase, 'profile-other');

    expect(flags.hasProfileLink).toBe(false);
    expect(flags.hasPublishedProject).toBe(false);
    expect(flags.hasAnyProject).toBe(false);
  });

  it('treats draft-only projects as incomplete for published criterion', async () => {
    const supabase = createMockSupabase({ links: 0, published: 0, projects: 2 });
    const flags = await loadProfileCompletionFlags(supabase, 'profile-1');

    expect(flags.hasAnyProject).toBe(true);
    expect(flags.hasPublishedProject).toBe(false);
  });

  it('fails safely when queries error', async () => {
    const supabase = createMockSupabase({ linksError: true });
    const flags = await loadProfileCompletionFlags(supabase, 'profile-1');

    expect(flags.error).toBe('Could not load profile completion data.');
  });
});

describe('loadProfileCompletion', () => {
  it('calculates completion from authenticated owner profile fields and flags', async () => {
    const supabase = createMockSupabase({ links: 1, published: 1, projects: 1 });
    const result = await loadProfileCompletion(supabase, {
      id: 'profile-1',
      headline: 'Engineer',
      bio: 'Builder',
      avatar_url: 'https://cdn.example/a.jpg',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.completion.percentage).toBe(100);
      expect(result.hasAnyProject).toBe(true);
    }
  });

  it('returns a safe error when flag loading fails', async () => {
    const supabase = createMockSupabase({ publishedError: true });
    const result = await loadProfileCompletion(supabase, {
      id: 'profile-1',
      headline: null,
      bio: null,
      avatar_url: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Could not load profile completion data.');
    }
  });
});

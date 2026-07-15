import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeReorderResearch,
  sortResearchBySortOrder,
} from './research-order-core';

describe('sortResearchBySortOrder', () => {
  it('orders by sort_order then created_at then id', () => {
    const papers = [
      { id: 'c', sort_order: 1, created_at: '2026-01-02T00:00:00.000Z' },
      { id: 'a', sort_order: 0, created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'b', sort_order: 0, created_at: '2026-01-03T00:00:00.000Z' },
    ];

    expect(sortResearchBySortOrder(papers).map((paper) => paper.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('preserves published relative order after filtering drafts', () => {
    const papers = [
      { id: 'draft-a', sort_order: 0, is_published: false },
      { id: 'pub-b', sort_order: 1, is_published: true },
      { id: 'draft-c', sort_order: 2, is_published: false },
      { id: 'pub-d', sort_order: 3, is_published: true },
    ];

    const published = sortResearchBySortOrder(papers).filter((paper) => paper.is_published);
    expect(published.map((paper) => paper.id)).toEqual(['pub-b', 'pub-d']);
  });
});

const PAPER_ONE = '11111111-1111-4111-8111-111111111111';
const PAPER_TWO = '22222222-2222-4222-8222-222222222222';

function createMockSupabase(options: {
  user?: { id: string } | null;
  ownedPaperIds?: string[];
  updateError?: { message: string } | null;
} = {}) {
  const ownedPaperIds = options.ownedPaperIds ?? [PAPER_ONE, PAPER_TWO];
  const updates: Array<{ id: string; sort_order: number }> = [];

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'profile-1',
                tenant_id: 'tenant-1',
                owner_user_id: 'user-1',
                slug: 'alex-chen',
                is_public: true,
              },
              error: null,
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
              eq: vi.fn().mockResolvedValue({
                data: ownedPaperIds.map((id) => ({ id })),
                error: null,
              }),
            })),
          })),
        })),
        update: vi.fn((payload: { sort_order: number }) => ({
          eq: vi.fn((column: string, value: string) => {
            if (column === 'id') {
              updates.push({ id: value, sort_order: payload.sort_order });
            }
            return {
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue({ error: options.updateError ?? null }),
                })),
              })),
            };
          }),
        })),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: options.user === undefined ? { id: 'user-1' } : options.user },
        }),
      },
      from,
    } as unknown as SupabaseClient,
    updates,
  };
}

describe('executeReorderResearch', () => {
  it('denies unauthenticated reorder', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeReorderResearch(supabase, [PAPER_ONE, PAPER_TWO]);
    expect(result.error).toMatch(/signed in/i);
    expect(result.success).toBeUndefined();
  });

  it('persists sequential sort_order for a complete owned list', async () => {
    const { supabase, updates } = createMockSupabase();
    const result = await executeReorderResearch(supabase, [PAPER_TWO, PAPER_ONE], {
      user: { id: 'user-1' },
    });

    expect(result.success).toBe(true);
    expect(result.profileSlug).toBe('alex-chen');
    expect(updates).toEqual([
      { id: PAPER_TWO, sort_order: 0 },
      { id: PAPER_ONE, sort_order: 1 },
    ]);
  });

  it('rejects foreign or incomplete lists', async () => {
    const foreign = '33333333-3333-4333-8333-333333333333';
    const { supabase } = createMockSupabase();
    const incomplete = await executeReorderResearch(supabase, [PAPER_ONE], {
      user: { id: 'user-1' },
    });
    const withForeign = await executeReorderResearch(
      supabase,
      [PAPER_ONE, PAPER_TWO, foreign],
      { user: { id: 'user-1' } },
    );

    expect(incomplete.error).toMatch(/could not reorder/i);
    expect(withForeign.error).toMatch(/could not reorder/i);
  });

  it('rejects duplicate IDs', async () => {
    const { supabase } = createMockSupabase({
      ownedPaperIds: [PAPER_ONE, PAPER_TWO],
    });
    const result = await executeReorderResearch(supabase, [PAPER_ONE, PAPER_ONE], {
      user: { id: 'user-1' },
    });
    expect(result.error).toBeTruthy();
  });

  it('hides raw persistence errors', async () => {
    const { supabase } = createMockSupabase({
      updateError: { message: 'permission denied for table research_papers' },
    });
    const result = await executeReorderResearch(supabase, [PAPER_ONE, PAPER_TWO], {
      user: { id: 'user-1' },
    });
    expect(result.error).toBe('Could not reorder research papers.');
    expect(result.error).not.toMatch(/permission denied/i);
  });
});

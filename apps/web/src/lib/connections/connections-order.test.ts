import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LIMITS } from '@codecard/config';
import { reorderConnectionsSchema } from '@codecard/validation';
import {
  executeReorderConnections,
  moveIndex,
  weaveVisibleOrder,
} from './connections-order-core';

const CONN_ONE = '55555555-5555-4555-8555-555555555555';
const CONN_TWO = '66666666-6666-4666-8666-666666666666';
const CONN_THREE = '77777777-7777-4777-8777-777777777777';
const FOREIGN = '88888888-8888-4888-8888-888888888888';

describe('connection order helpers', () => {
  it('moves an item to a new index', () => {
    expect(moveIndex(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveIndex(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveIndex(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  it('weaves a visible reorder back into the full list', () => {
    expect(weaveVisibleOrder(['a', 'b', 'c', 'd'], ['d', 'b'])).toEqual([
      'a',
      'd',
      'c',
      'b',
    ]);
  });
});

describe('reorderConnectionsSchema', () => {
  it('accepts a unique uuid list within the saved-connections cap', () => {
    expect(
      reorderConnectionsSchema.safeParse({
        connection_ids: [CONN_ONE, CONN_TWO],
      }).success,
    ).toBe(true);
    expect(LIMITS.savedConnections.max).toBe(500);
  });

  it('rejects duplicates, empty lists, extra owner fields, and oversize lists', () => {
    expect(
      reorderConnectionsSchema.safeParse({
        connection_ids: [CONN_ONE, CONN_ONE],
      }).success,
    ).toBe(false);
    expect(reorderConnectionsSchema.safeParse({ connection_ids: [] }).success).toBe(
      false,
    );
    expect(
      reorderConnectionsSchema.safeParse({
        connection_ids: [CONN_ONE],
        owner_user_id: CONN_TWO,
      }).success,
    ).toBe(false);
    expect(
      reorderConnectionsSchema.safeParse({
        connection_ids: Array.from({ length: 501 }, () => CONN_ONE),
      }).success,
    ).toBe(false);
  });
});

function createMockSupabase(options: {
  user?: { id: string } | null;
  ownedIds?: string[];
  updateError?: { message: string } | null;
} = {}) {
  const ownedIds = options.ownedIds ?? [CONN_ONE, CONN_TWO];
  const updates: Array<{ id: string; sort_order: number }> = [];

  const from = vi.fn((table: string) => {
    if (table !== 'saved_connections') {
      throw new Error(`Unexpected table ${table}`);
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: ownedIds.map((id) => ({ id })),
          error: null,
        }),
      })),
      update: vi.fn((payload: { sort_order: number }) => ({
        eq: vi.fn((column: string, value: string) => {
          if (column === 'id') {
            updates.push({ id: value, sort_order: payload.sort_order });
          }
          return {
            eq: vi.fn().mockResolvedValue({ error: options.updateError ?? null }),
          };
        }),
      })),
    };
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

describe('executeReorderConnections', () => {
  it('denies unauthenticated reorder', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeReorderConnections(supabase, [CONN_ONE, CONN_TWO]);
    expect(result.error).toMatch(/signed in/i);
    expect(result.success).toBeUndefined();
  });

  it('persists sequential sort_order for a complete owned list', async () => {
    const { supabase, updates } = createMockSupabase();
    const result = await executeReorderConnections(supabase, [CONN_TWO, CONN_ONE], {
      user: { id: 'user-1' },
    });
    expect(result.success).toBe(true);
    expect(updates).toEqual([
      { id: CONN_TWO, sort_order: 0 },
      { id: CONN_ONE, sort_order: 1 },
    ]);
  });

  it('rejects foreign, incomplete, or duplicate lists', async () => {
    const { supabase } = createMockSupabase({
      ownedIds: [CONN_ONE, CONN_TWO, CONN_THREE],
    });
    const incomplete = await executeReorderConnections(supabase, [CONN_ONE, CONN_TWO], {
      user: { id: 'user-1' },
    });
    const foreign = await executeReorderConnections(
      supabase,
      [CONN_ONE, CONN_TWO, FOREIGN],
      { user: { id: 'user-1' } },
    );
    const duplicates = await executeReorderConnections(supabase, [CONN_ONE, CONN_ONE], {
      user: { id: 'user-1' },
    });
    expect(incomplete.error).toMatch(/could not reorder/i);
    expect(foreign.error).toMatch(/could not reorder/i);
    expect(duplicates.error).toBeTruthy();
  });

  it('hides raw persistence errors', async () => {
    const { supabase } = createMockSupabase({
      updateError: { message: 'permission denied for table saved_connections' },
    });
    const result = await executeReorderConnections(supabase, [CONN_ONE, CONN_TWO], {
      user: { id: 'user-1' },
    });
    expect(result.error).toBe('Could not reorder Connections.');
    expect(result.error).not.toMatch(/permission denied/i);
  });
});

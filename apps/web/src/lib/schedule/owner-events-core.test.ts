import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeCreateOwnerEvent,
  executeDeleteOwnerEvent,
  listOwnerUpcomingEvents,
} from './owner-events-core';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT = '77777777-7777-4777-8777-777777777777';
const EVENT_ID = '11111111-1111-4111-8111-111111111111';

function createMock(options: {
  count?: number;
  insertError?: { message?: string } | null;
  deleteRow?: boolean;
  list?: Array<{
    id: string;
    title: string;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    notes: string | null;
  }>;
}) {
  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'profile-1',
                tenant_id: TENANT,
                owner_user_id: OWNER,
                slug: 'alice',
                is_public: true,
              },
              error: null,
            }),
          })),
        })),
      };
    }
    if (table === 'owner_events') {
      return {
        select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            return {
              eq: vi.fn().mockResolvedValue({ count: options.count ?? 0, error: null }),
            };
          }
          return {
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: options.list ?? [],
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }),
        insert: vi.fn((payload: Record<string, unknown>) => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: options.insertError
                ? null
                : {
                    id: EVENT_ID,
                    title: payload.title,
                    location: payload.location,
                    starts_at: payload.starts_at,
                    ends_at: payload.ends_at,
                    notes: payload.notes,
                  },
              error: options.insertError ?? null,
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => ({
            eq: vi.fn((_col2: string, ownerId: string) => ({
              select: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data:
                    options.deleteRow && col === 'id' && val === EVENT_ID && ownerId === OWNER
                      ? {
                          id: EVENT_ID,
                          title: 'DevConf',
                          location: null,
                          starts_at: '2026-09-22T16:00:00.000Z',
                          ends_at: null,
                          notes: null,
                        }
                      : null,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      };
    }
    throw new Error(`Unexpected ${table}`);
  });

  return { client: { from } as unknown as SupabaseClient };
}

describe('owner events core', () => {
  it('creates an event for the authenticated owner', async () => {
    const { client } = createMock({ count: 0 });
    const result = await executeCreateOwnerEvent(
      client,
      {
        title: '  DevConf SF  ',
        location: 'Moscone',
        startsAt: '2026-09-22T16:00:00.000Z',
      },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(result.event?.title).toBe('DevConf SF');
    expect(result.event?.startsAt).toBe('2026-09-22T16:00:00.000Z');
  });

  it('rejects anonymous create and invalid dates', async () => {
    const { client } = createMock({ count: 0 });
    expect(
      (await executeCreateOwnerEvent(client, { title: 'Talk', startsAt: 'nope' }, { user: { id: OWNER } }))
        .code,
    ).toBe('INVALID_INPUT');
    expect(
      (
        await executeCreateOwnerEvent(
          client,
          { title: 'Talk', startsAt: '2026-09-22T16:00:00.000Z' },
          { user: null },
        )
      ).code,
    ).toBe('UNAUTHENTICATED');
  });

  it('does not delete another owner’s event', async () => {
    const { client } = createMock({ deleteRow: true });
    const result = await executeDeleteOwnerEvent(
      client,
      { eventId: EVENT_ID },
      { user: { id: OTHER } },
    );
    expect(result.code).toBe('NOT_FOUND');
  });

  it('lists upcoming events for the owner', async () => {
    const { client } = createMock({
      list: [
        {
          id: EVENT_ID,
          title: 'Coffee',
          location: null,
          starts_at: '2026-09-24T16:30:00.000Z',
          ends_at: null,
          notes: null,
        },
      ],
    });
    const result = await listOwnerUpcomingEvents(client, { user: { id: OWNER } });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].title).toBe('Coffee');
  });
});

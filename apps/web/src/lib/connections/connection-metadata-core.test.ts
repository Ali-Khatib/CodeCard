import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeReadConnectionMetadata,
  executeUpdateConnectionMetadata,
  sanitizePlainTextNote,
} from './connection-metadata-core';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT = '77777777-7777-4777-8777-777777777777';
const CONN = '55555555-5555-4555-8555-555555555555';
const OTHER_CONN = '66666666-6666-4666-8666-666666666666';

function createMock(options: {
  connection?: {
    id: string;
    owner_user_id: string;
    context: string | null;
    connected_at: string | null;
    met_at: string | null;
    source: string;
    updated_at: string;
    tenant_id: string;
  } | null;
  note?: string | null;
  updateError?: { message?: string } | null;
}) {
  const connection = options.connection;
  let noteBody = options.note ?? null;
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();

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
    if (table === 'saved_connections') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => ({
            eq: vi.fn((col2: string, ownerId: string) => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data:
                  connection && connection.id === val && connection.owner_user_id === ownerId
                    ? connection
                    : null,
                error: null,
              }),
            })),
          })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => {
              update(payload);
              if (connection && payload.context !== undefined) {
                connection.context = payload.context as string | null;
              }
              return Promise.resolve({ error: options.updateError ?? null });
            }),
          })),
        })),
      };
    }
    if (table === 'connection_notes') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: noteBody ? { body: noteBody } : null,
                error: null,
              }),
            })),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        insert: vi.fn((payload: Record<string, unknown>) => {
          insert(payload);
          noteBody = payload.body as string;
          return Promise.resolve({ error: null });
        }),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => {
              update(payload);
              noteBody = payload.body as string;
              return Promise.resolve({ error: null });
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => {
              del();
              noteBody = null;
              return Promise.resolve({ error: null });
            }),
          })),
        })),
      };
    }
    throw new Error(`Unexpected ${table}`);
  });

  return { client: { from } as unknown as SupabaseClient, insert, update, del, getNote: () => noteBody };
}

describe('connection metadata core', () => {
  it('sanitizes control characters while preserving newlines', () => {
    expect(sanitizePlainTextNote('hello\nworld\u0000')).toBe('hello\nworld');
  });

  it('lets the owner read and update their private note and context', async () => {
    const { client, insert } = createMock({
      connection: {
        id: CONN,
        owner_user_id: OWNER,
        context: null,
        connected_at: '2026-07-01T00:00:00.000Z',
        met_at: null,
        source: 'manual',
        updated_at: '2026-07-01T00:00:00.000Z',
        tenant_id: TENANT,
      },
      note: null,
    });

    const updated = await executeUpdateConnectionMetadata(
      client,
      {
        connectionId: CONN,
        privateNote: 'Met at DevConf\nFollow up on AI paper',
        context: 'Conference',
      },
      { user: { id: OWNER } },
    );
    expect(updated.success).toBe(true);
    expect(updated.metadata?.privateNote).toContain('DevConf');
    expect(updated.metadata?.context).toBe('Conference');
    expect(insert).toHaveBeenCalled();

    const read = await executeReadConnectionMetadata(
      client,
      { connectionId: CONN },
      { user: { id: OWNER } },
    );
    expect(read.metadata?.privateNote).toContain('Follow up');
  });

  it('clears a private note', async () => {
    const { client, del } = createMock({
      connection: {
        id: CONN,
        owner_user_id: OWNER,
        context: 'Intro',
        connected_at: null,
        met_at: null,
        source: 'manual',
        updated_at: '2026-07-01T00:00:00.000Z',
        tenant_id: TENANT,
      },
      note: 'old note',
    });
    const result = await executeUpdateConnectionMetadata(
      client,
      { connectionId: CONN, privateNote: null },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(result.metadata?.privateNote).toBeNull();
    expect(del).toHaveBeenCalled();
  });

  it('rejects oversized notes and anonymous access', async () => {
    const { client } = createMock({
      connection: {
        id: CONN,
        owner_user_id: OWNER,
        context: null,
        connected_at: null,
        met_at: null,
        source: 'manual',
        updated_at: '2026-07-01T00:00:00.000Z',
        tenant_id: TENANT,
      },
    });
    expect(
      (
        await executeUpdateConnectionMetadata(
          client,
          { connectionId: CONN, privateNote: 'x'.repeat(5001) },
          { user: { id: OWNER } },
        )
      ).code,
    ).toBe('INVALID_INPUT');
    expect(
      (
        await executeReadConnectionMetadata(client, { connectionId: CONN }, { user: null })
      ).code,
    ).toBe('UNAUTHENTICATED');
  });

  it('does not reveal another user’s Connection metadata', async () => {
    const { client } = createMock({
      connection: {
        id: OTHER_CONN,
        owner_user_id: OTHER,
        context: 'secret',
        connected_at: null,
        met_at: null,
        source: 'manual',
        updated_at: '2026-07-01T00:00:00.000Z',
        tenant_id: TENANT,
      },
      note: 'private to B',
    });
    const read = await executeReadConnectionMetadata(
      client,
      { connectionId: OTHER_CONN },
      { user: { id: OWNER } },
    );
    expect(read.code).toBe('NOT_FOUND');
    expect(read.metadata).toBeNull();
  });
});

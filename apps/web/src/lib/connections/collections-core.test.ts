import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeAddConnectionToCollection,
  executeCreateCollection,
  executeDeleteCollection,
  executeRemoveConnectionFromCollection,
  executeUpdateCollection,
  listCollectionsForConnection,
  listOwnerCollections,
} from './collections-core';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT = '77777777-7777-4777-8777-777777777777';
const COL_ID = '11111111-1111-4111-8111-111111111111';
const CONN_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_CONN = '33333333-3333-4333-8333-333333333333';

const ownerProfile = {
  id: '44444444-4444-4444-8444-444444444444',
  tenant_id: TENANT,
  owner_user_id: OWNER,
  slug: 'alice',
  is_public: true,
};

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  owner_user_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  collection_id: string;
  saved_connection_id: string;
  tenant_id: string;
};

function createMock(options: {
  collections?: CollectionRow[];
  items?: ItemRow[];
  connections?: Array<{ id: string; owner_user_id: string }>;
  insertError?: { code?: string; message?: string } | null;
}) {
  const collections = [...(options.collections ?? [])];
  const items = [...(options.items ?? [])];
  const connections = options.connections ?? [
    { id: CONN_ID, owner_user_id: OWNER },
    { id: OTHER_CONN, owner_user_id: OTHER },
  ];
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: ownerProfile, error: null }),
          })),
        })),
      };
    }

    if (table === 'collections') {
      return {
        select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            return {
              eq: vi.fn().mockResolvedValue({ count: collections.filter((c) => c.owner_user_id === OWNER).length, error: null }),
            };
          }
          return {
            eq: vi.fn((col: string, val: string) => {
              if (col === 'owner_user_id') {
                const owned = collections.filter((c) => c.owner_user_id === val);
                return {
                  order: vi.fn().mockResolvedValue({ data: owned, error: null }),
                  eq: vi.fn((col2: string, val2: string) => {
                    const found = owned.find((c) => (col2 === 'id' ? c.id === val2 : false)) ?? null;
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({ data: found, error: null }),
                    };
                  }),
                };
              }
              if (col === 'id') {
                return {
                  eq: vi.fn((col2: string, ownerId: string) => {
                    const found =
                      collections.find((c) => c.id === val && c.owner_user_id === ownerId) ?? null;
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({ data: found, error: null }),
                    };
                  }),
                };
              }
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }),
          };
        }),
        insert: vi.fn((payload: Record<string, unknown>) => {
          insert(payload);
          if (options.insertError) {
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: options.insertError }),
              })),
            };
          }
          const row: CollectionRow = {
            id: COL_ID,
            name: payload.name as string,
            description: (payload.description as string | null) ?? null,
            owner_user_id: payload.owner_user_id as string,
            tenant_id: payload.tenant_id as string,
            created_at: '2026-07-17T00:00:00.000Z',
            updated_at: '2026-07-17T00:00:00.000Z',
          };
          collections.push(row);
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: row, error: null }),
            })),
          };
        }),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn((col1: string, val1: string) => ({
            eq: vi.fn((col2: string, val2: string) => {
              update(payload);
              const idx = collections.findIndex(
                (c) => c.id === val1 && c.owner_user_id === val2,
              );
              if (idx >= 0) {
                collections[idx] = { ...collections[idx], ...payload } as CollectionRow;
              }
              return Promise.resolve({ error: options.insertError ?? null });
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn((col1: string, val1: string) => ({
            eq: vi.fn((col2: string, val2: string) => {
              del({ [col1]: val1, [col2]: val2 });
              const idx = collections.findIndex(
                (c) => c.id === val1 && c.owner_user_id === val2,
              );
              if (idx >= 0) {
                const removedId = collections[idx].id;
                collections.splice(idx, 1);
                for (let i = items.length - 1; i >= 0; i -= 1) {
                  if (items[i].collection_id === removedId) items.splice(i, 1);
                }
              }
              return Promise.resolve({ error: null });
            }),
          })),
        })),
      };
    }

    if (table === 'collection_items') {
      return {
        select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            return {
              eq: vi.fn((col: string, val: string) =>
                Promise.resolve({
                  count: items.filter((i) => i.collection_id === val).length,
                  error: null,
                }),
              ),
            };
          }
          return {
            eq: vi.fn((col: string, val: string) => {
              if (col === 'collection_id') {
                return {
                  eq: vi.fn((col2: string, val2: string) => {
                    const found =
                      items.find(
                        (i) => i.collection_id === val && i.saved_connection_id === val2,
                      ) ?? null;
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({ data: found, error: null }),
                    };
                  }),
                };
              }
              if (col === 'saved_connection_id') {
                const memberships = items.filter((i) => i.saved_connection_id === val);
                return Promise.resolve({
                  data: memberships.map((m) => {
                    const col = collections.find((c) => c.id === m.collection_id);
                    return {
                      collection_id: m.collection_id,
                      collections: col
                        ? {
                            id: col.id,
                            name: col.name,
                            owner_user_id: col.owner_user_id,
                          }
                        : null,
                    };
                  }),
                  error: null,
                });
              }
              return {
                in: vi.fn((col2: string, ids: string[]) =>
                  Promise.resolve({
                    data: items.filter((i) => ids.includes(i.collection_id)),
                    error: null,
                  }),
                ),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }),
            in: vi.fn((_col: string, ids: string[]) =>
              Promise.resolve({
                data: items.filter((i) => ids.includes(i.collection_id)),
                error: null,
              }),
            ),
          };
        }),
        insert: vi.fn((payload: Record<string, unknown>) => {
          insert(payload);
          if (options.insertError) {
            return Promise.resolve({ error: options.insertError });
          }
          items.push({
            id: 'item-1',
            collection_id: payload.collection_id as string,
            saved_connection_id: payload.saved_connection_id as string,
            tenant_id: payload.tenant_id as string,
          });
          return Promise.resolve({ error: null });
        }),
        delete: vi.fn(() => ({
          eq: vi.fn((col1: string, val1: string) => ({
            eq: vi.fn((col2: string, val2: string) => {
              del({ [col1]: val1, [col2]: val2 });
              const idx = items.findIndex(
                (i) => i.collection_id === val1 && i.saved_connection_id === val2,
              );
              if (idx >= 0) items.splice(idx, 1);
              return Promise.resolve({ error: null });
            }),
          })),
        })),
      };
    }

    if (table === 'saved_connections') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => ({
            eq: vi.fn((col2: string, val2: string) => {
              const found =
                connections.find((c) => c.id === val && c.owner_user_id === val2) ?? null;
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: found, error: null }),
              };
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: connections.find((c) => c.id === val) ?? null,
              error: null,
            }),
          })),
        })),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    client: { from } as unknown as SupabaseClient,
    insert,
    update,
    del,
    collections,
    items,
  };
}

describe('collections core', () => {
  it('creates a valid collection for the authenticated owner', async () => {
    const { client, insert } = createMock({});
    const result = await executeCreateCollection(
      client,
      { name: '  Recruiters  ', description: ' People to contact ' },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(result.collection?.name).toBe('Recruiters');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: OWNER,
        tenant_id: TENANT,
        name: 'Recruiters',
      }),
    );
  });

  it('rejects blank and oversized names', async () => {
    const { client, insert } = createMock({});
    expect(
      (await executeCreateCollection(client, { name: '   ' }, { user: { id: OWNER } })).code,
    ).toBe('INVALID_INPUT');
    expect(
      (
        await executeCreateCollection(
          client,
          { name: 'x'.repeat(81) },
          { user: { id: OWNER } },
        )
      ).code,
    ).toBe('INVALID_INPUT');
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects anonymous create', async () => {
    const { client } = createMock({});
    const result = await executeCreateCollection(client, { name: 'AI' }, { user: null });
    expect(result.code).toBe('UNAUTHENTICATED');
  });

  it('maps duplicate name unique violations', async () => {
    const { client } = createMock({ insertError: { code: '23505' } });
    const result = await executeCreateCollection(
      client,
      { name: 'Recruiters' },
      { user: { id: OWNER } },
    );
    expect(result.code).toBe('DUPLICATE_NAME');
  });

  it('renames an owned collection', async () => {
    const { client, update } = createMock({
      collections: [
        {
          id: COL_ID,
          name: 'Old',
          description: null,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const result = await executeUpdateCollection(
      client,
      { collectionId: COL_ID, name: 'New Name' },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
  });

  it('does not delete another user’s collection', async () => {
    const { client, del } = createMock({
      collections: [
        {
          id: COL_ID,
          name: 'Secret',
          description: null,
          owner_user_id: OTHER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const result = await executeDeleteCollection(
      client,
      { collectionId: COL_ID },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(result.code).toBe('NOT_FOUND');
    expect(del).not.toHaveBeenCalled();
  });

  it('deletes owned collection memberships but not Connections', async () => {
    const { client, collections, items } = createMock({
      collections: [
        {
          id: COL_ID,
          name: 'AI',
          description: null,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      items: [
        {
          id: 'item-1',
          collection_id: COL_ID,
          saved_connection_id: CONN_ID,
          tenant_id: TENANT,
        },
      ],
      connections: [{ id: CONN_ID, owner_user_id: OWNER }],
    });
    const result = await executeDeleteCollection(
      client,
      { collectionId: COL_ID },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(collections.find((c) => c.id === COL_ID)).toBeUndefined();
    expect(items.find((i) => i.collection_id === COL_ID)).toBeUndefined();
  });

  it('adds owned Connection to owned collection and rejects foreign Connection', async () => {
    const base = {
      collections: [
        {
          id: COL_ID,
          name: 'AI',
          description: null,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ] as CollectionRow[],
    };
    const ok = createMock(base);
    const addOk = await executeAddConnectionToCollection(
      ok.client,
      { collectionId: COL_ID, connectionId: CONN_ID },
      { user: { id: OWNER } },
    );
    expect(addOk.success).toBe(true);

    const bad = createMock(base);
    const addBad = await executeAddConnectionToCollection(
      bad.client,
      { collectionId: COL_ID, connectionId: OTHER_CONN },
      { user: { id: OWNER } },
    );
    expect(addBad.code).toBe('NOT_FOUND');
  });

  it('idempotently handles duplicate membership', async () => {
    const { client, insert } = createMock({
      collections: [
        {
          id: COL_ID,
          name: 'AI',
          description: null,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      items: [
        {
          id: 'item-1',
          collection_id: COL_ID,
          saved_connection_id: CONN_ID,
          tenant_id: TENANT,
        },
      ],
    });
    const result = await executeAddConnectionToCollection(
      client,
      { collectionId: COL_ID, connectionId: CONN_ID },
      { user: { id: OWNER } },
    );
    expect(result.success).toBe(true);
    expect(result.alreadyMember).toBe(true);
    expect(insert).not.toHaveBeenCalled();
  });

  it('removes membership and lists collections for a Connection', async () => {
    const { client } = createMock({
      collections: [
        {
          id: COL_ID,
          name: 'AI',
          description: null,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      items: [
        {
          id: 'item-1',
          collection_id: COL_ID,
          saved_connection_id: CONN_ID,
          tenant_id: TENANT,
        },
      ],
    });
    const listed = await listCollectionsForConnection(
      client,
      { connectionId: CONN_ID },
      { user: { id: OWNER } },
    );
    expect(listed.collectionIds).toEqual([COL_ID]);

    const removed = await executeRemoveConnectionFromCollection(
      client,
      { collectionId: COL_ID, connectionId: CONN_ID },
      { user: { id: OWNER } },
    );
    expect(removed.success).toBe(true);
  });

  it('lists only the owner’s collections', async () => {
    const { client } = createMock({
      collections: [
        {
          id: COL_ID,
          name: 'Mine',
          description: null,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: '99999999-9999-4999-8999-999999999999',
          name: 'Theirs',
          description: null,
          owner_user_id: OTHER,
          tenant_id: TENANT,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const result = await listOwnerCollections(client, { user: { id: OWNER } });
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].name).toBe('Mine');
  });
});

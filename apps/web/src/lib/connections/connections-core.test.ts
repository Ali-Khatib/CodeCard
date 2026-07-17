import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeAddConnection,
  executeConnectionStatus,
  executeRemoveConnection,
  listOwnerConnections,
} from './connections-core';

const OWNER_USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TARGET_USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OWNER_PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_PROFILE_ID = '22222222-2222-4222-8222-222222222222';
const DRAFT_PROFILE_ID = '33333333-3333-4333-8333-333333333333';
const SELF_PROFILE_ID = '44444444-4444-4444-8444-444444444444';
const CONN_ID = '55555555-5555-4555-8555-555555555555';
const CONN_OTHER = '66666666-6666-4666-8666-666666666666';
const TENANT_OWNER = '77777777-7777-4777-8777-777777777777';
const TENANT_TARGET = '88888888-8888-4888-8888-888888888888';

const ownerProfile = {
  id: OWNER_PROFILE_ID,
  tenant_id: TENANT_OWNER,
  owner_user_id: OWNER_USER,
  slug: 'alice',
  is_public: true,
};

const publishedTarget = {
  id: TARGET_PROFILE_ID,
  slug: 'bob-smith',
  display_name: 'Bob Smith',
  headline: 'Engineer',
  location: 'Berlin',
  avatar_url: 'https://cdn.example/bob.jpg',
  is_public: true,
  owner_user_id: TARGET_USER,
  tenant_id: TENANT_TARGET,
};

const draftTarget = {
  ...publishedTarget,
  id: DRAFT_PROFILE_ID,
  slug: 'draft-person',
  is_public: false,
  owner_user_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
};

type MockOptions = {
  ownerProfile?: typeof ownerProfile | null;
  targetById?: Record<string, typeof publishedTarget | null>;
  targetBySlug?: Record<string, typeof publishedTarget | null>;
  existingConnections?: Array<{
    id: string;
    saved_profile_id: string;
    owner_user_id: string;
    connected_at?: string | null;
    created_at?: string;
    source?: string;
    saved_profile?: typeof publishedTarget;
  }>;
  insertError?: { code?: string; message?: string } | null;
  insertRow?: {
    id: string;
    saved_profile_id: string;
    connected_at: string | null;
    created_at: string;
    source: string;
  } | null;
  connectionCount?: number;
  deleteError?: { message?: string } | null;
};

function createMockSupabase(options: MockOptions = {}) {
  const connections = [...(options.existingConnections ?? [])];
  const insert = vi.fn();
  const del = vi.fn();

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => {
          const chain: Record<string, unknown> = {};
          chain.eq = vi.fn((column: string, value: string) => {
            if (column === 'owner_user_id') {
              return {
                single: vi.fn().mockResolvedValue({
                  data: options.ownerProfile === undefined ? ownerProfile : options.ownerProfile,
                  error: options.ownerProfile === null ? { message: 'missing' } : null,
                }),
              };
            }

            if (column === 'id') {
              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: options.targetById?.[value] ?? null,
                  error: null,
                }),
              };
            }

            if (column === 'slug') {
              return {
                eq: vi.fn((col2: string, val2: unknown) => {
                  if (col2 === 'is_public' && val2 === true) {
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: options.targetBySlug?.[value] ?? null,
                        error: null,
                      }),
                    };
                  }
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  };
                }),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: options.targetBySlug?.[value] ?? null,
                  error: null,
                }),
              };
            }

            return {
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'missing' } }),
            };
          });
          return chain;
        }),
      };
    }

    if (table === 'saved_connections') {
      return {
        select: vi.fn((_columns?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            return {
              eq: vi.fn().mockResolvedValue({
                count: options.connectionCount ?? connections.length,
                error: null,
              }),
            };
          }

          const selectChain: Record<string, unknown> = {};
          selectChain.eq = vi.fn((column: string, value: string) => {
            if (column === 'owner_user_id') {
              const ownerFiltered = connections.filter((c) => c.owner_user_id === value);
              return {
                eq: vi.fn((col2: string, val2: string) => {
                  if (col2 === 'saved_profile_id') {
                    const found = ownerFiltered.find((c) => c.saved_profile_id === val2) ?? null;
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({ data: found, error: null }),
                    };
                  }
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  };
                }),
                order: vi.fn().mockResolvedValue({
                  data: ownerFiltered.map((c) => ({
                    id: c.id,
                    connected_at: c.connected_at ?? null,
                    created_at: c.created_at ?? '2026-01-01T00:00:00.000Z',
                    source: c.source ?? 'manual',
                    saved_profile: c.saved_profile ?? publishedTarget,
                  })),
                  error: null,
                }),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }

            if (column === 'id') {
              return {
                eq: vi.fn((col2: string, ownerId: string) => {
                  const found =
                    connections.find((c) => c.id === value && c.owner_user_id === ownerId) ?? null;
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: found, error: null }),
                  };
                }),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: connections.find((c) => c.id === value) ?? null,
                  error: null,
                }),
              };
            }

            return {
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          });
          return selectChain;
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
          const row = options.insertRow ?? {
            id: CONN_ID,
            saved_profile_id: payload.saved_profile_id as string,
            connected_at: payload.connected_at as string,
            created_at: '2026-07-17T00:00:00.000Z',
            source: (payload.source as string) ?? 'manual',
          };
          connections.push({
            id: row.id,
            saved_profile_id: row.saved_profile_id,
            owner_user_id: payload.owner_user_id as string,
            connected_at: row.connected_at,
            created_at: row.created_at,
            source: row.source,
            saved_profile: publishedTarget,
          });
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: row, error: null }),
            })),
          };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn((col1: string, val1: string) => ({
            eq: vi.fn((col2: string, val2: string) => {
              del({ [col1]: val1, [col2]: val2 });
              if (options.deleteError) {
                return Promise.resolve({ error: options.deleteError });
              }
              const idx = connections.findIndex(
                (c) => c.id === val1 && c.owner_user_id === val2,
              );
              if (idx >= 0) connections.splice(idx, 1);
              return Promise.resolve({ error: null });
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
    del,
    connections,
  };
}

describe('executeAddConnection', () => {
  it('rejects anonymous users', async () => {
    const { client } = createMockSupabase();
    const result = await executeAddConnection(
      client,
      { targetProfileId: TARGET_PROFILE_ID },
      { user: null },
    );
    expect(result.success).toBeUndefined();
    expect(result.code).toBe('UNAUTHENTICATED');
  });

  it('adds a published target for the authenticated owner', async () => {
    const { client, insert } = createMockSupabase({
      targetById: { [TARGET_PROFILE_ID]: publishedTarget },
    });
    const result = await executeAddConnection(
      client,
      { targetProfileId: TARGET_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.success).toBe(true);
    expect(result.connection?.savedProfileId).toBe(TARGET_PROFILE_ID);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: OWNER_USER,
        saved_profile_id: TARGET_PROFILE_ID,
        tenant_id: TENANT_OWNER,
        source: 'manual',
      }),
    );
    expect(insert.mock.calls[0][0]).not.toHaveProperty('email');
  });

  it('rejects self-connection by owner user id', async () => {
    const selfTarget = {
      ...publishedTarget,
      id: SELF_PROFILE_ID,
      owner_user_id: OWNER_USER,
    };
    const { client, insert } = createMockSupabase({
      targetById: { [SELF_PROFILE_ID]: selfTarget },
    });
    const result = await executeAddConnection(
      client,
      { targetProfileId: SELF_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.code).toBe('SELF_CONNECTION');
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects self-connection when target is own profile id', async () => {
    const selfProfile = {
      ...publishedTarget,
      id: OWNER_PROFILE_ID,
      owner_user_id: TARGET_USER,
    };
    const { client, insert } = createMockSupabase({
      targetById: { [OWNER_PROFILE_ID]: selfProfile },
    });
    const result = await executeAddConnection(
      client,
      { targetProfileId: OWNER_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.code).toBe('SELF_CONNECTION');
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects draft or private targets', async () => {
    const { client, insert } = createMockSupabase({
      targetById: { [DRAFT_PROFILE_ID]: draftTarget },
    });
    const result = await executeAddConnection(
      client,
      { targetProfileId: DRAFT_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.code).toBe('TARGET_NOT_AVAILABLE');
    expect(insert).not.toHaveBeenCalled();
  });

  it('returns idempotent already-connected for duplicates', async () => {
    const { client, insert } = createMockSupabase({
      targetById: { [TARGET_PROFILE_ID]: publishedTarget },
      existingConnections: [
        {
          id: CONN_ID,
          saved_profile_id: TARGET_PROFILE_ID,
          owner_user_id: OWNER_USER,
        },
      ],
    });
    const result = await executeAddConnection(
      client,
      { targetProfileId: TARGET_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.success).toBe(true);
    expect(result.alreadyConnected).toBe(true);
    expect(result.code).toBe('ALREADY_CONNECTED');
    expect(insert).not.toHaveBeenCalled();
  });

  it('resolves published targets by slug', async () => {
    const { client, insert } = createMockSupabase({
      targetBySlug: { 'bob-smith': publishedTarget },
    });
    const result = await executeAddConnection(
      client,
      { targetSlug: 'Bob-Smith' },
      { user: { id: OWNER_USER } },
    );
    expect(result.success).toBe(true);
    expect(insert).toHaveBeenCalled();
  });

  it('rejects client-provided owner impersonation by ignoring foreign owner fields', async () => {
    const { client, insert } = createMockSupabase({
      targetById: { [TARGET_PROFILE_ID]: publishedTarget },
    });
    await executeAddConnection(
      client,
      {
        targetProfileId: TARGET_PROFILE_ID,
        owner_user_id: '99999999-9999-4999-8999-999999999999',
        tenant_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      },
      { user: { id: OWNER_USER } },
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: OWNER_USER,
        tenant_id: TENANT_OWNER,
      }),
    );
  });
});

describe('executeRemoveConnection', () => {
  it('removes an owned connection', async () => {
    const { client, del } = createMockSupabase({
      existingConnections: [
        {
          id: CONN_ID,
          saved_profile_id: TARGET_PROFILE_ID,
          owner_user_id: OWNER_USER,
        },
      ],
    });
    const result = await executeRemoveConnection(
      client,
      { connectionId: CONN_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.success).toBe(true);
    expect(del).toHaveBeenCalledWith(
      expect.objectContaining({ id: CONN_ID, owner_user_id: OWNER_USER }),
    );
  });

  it('does not delete another user’s connection', async () => {
    const { client, del } = createMockSupabase({
      existingConnections: [
        {
          id: CONN_OTHER,
          saved_profile_id: TARGET_PROFILE_ID,
          owner_user_id: TARGET_USER,
        },
      ],
    });
    const result = await executeRemoveConnection(
      client,
      { connectionId: CONN_OTHER },
      { user: { id: OWNER_USER } },
    );
    expect(result.success).toBe(true);
    expect(result.code).toBe('NOT_FOUND');
    expect(del).not.toHaveBeenCalled();
  });

  it('rejects anonymous remove', async () => {
    const { client } = createMockSupabase();
    const result = await executeRemoveConnection(
      client,
      { connectionId: CONN_ID },
      { user: null },
    );
    expect(result.code).toBe('UNAUTHENTICATED');
  });
});

describe('listOwnerConnections', () => {
  it('lists only the authenticated owner’s connections with safe fields', async () => {
    const { client } = createMockSupabase({
      existingConnections: [
        {
          id: CONN_ID,
          saved_profile_id: TARGET_PROFILE_ID,
          owner_user_id: OWNER_USER,
          created_at: '2026-07-01T00:00:00.000Z',
          connected_at: '2026-07-01T00:00:00.000Z',
          source: 'manual',
          saved_profile: publishedTarget,
        },
      ],
    });
    const result = await listOwnerConnections(client, { user: { id: OWNER_USER } });
    expect(result.error).toBeUndefined();
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0].target.displayName).toBe('Bob Smith');
    expect(result.connections[0].target).not.toHaveProperty('email');
    expect(result.connections[0].target).not.toHaveProperty('owner_user_id');
    expect(JSON.stringify(result.connections)).not.toMatch(/email|stripe|password/i);
  });

  it('hides private details when a saved target becomes unpublished', async () => {
    const privateSaved = { ...publishedTarget, is_public: false };
    const { client } = createMockSupabase({
      existingConnections: [
        {
          id: CONN_ID,
          saved_profile_id: privateSaved.id,
          owner_user_id: OWNER_USER,
          saved_profile: privateSaved,
        },
      ],
    });
    const result = await listOwnerConnections(client, { user: { id: OWNER_USER } });
    expect(result.connections[0].target.isPublic).toBe(false);
    expect(result.connections[0].target.displayName).toBe('Private CodeCard');
    expect(result.connections[0].target.slug).toBe('');
    expect(result.connections[0].target.headline).toBeNull();
  });

  it('rejects anonymous list', async () => {
    const { client } = createMockSupabase();
    const result = await listOwnerConnections(client, { user: null });
    expect(result.code).toBe('UNAUTHENTICATED');
    expect(result.connections).toEqual([]);
  });
});

describe('executeConnectionStatus', () => {
  it('reports connected when an owned row exists', async () => {
    const { client } = createMockSupabase({
      existingConnections: [
        {
          id: CONN_ID,
          saved_profile_id: TARGET_PROFILE_ID,
          owner_user_id: OWNER_USER,
        },
      ],
    });
    const result = await executeConnectionStatus(
      client,
      { targetProfileId: TARGET_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.connected).toBe(true);
    expect(result.connectionId).toBe(CONN_ID);
  });

  it('reports not connected for other users’ rows', async () => {
    const { client } = createMockSupabase({
      existingConnections: [
        {
          id: CONN_OTHER,
          saved_profile_id: TARGET_PROFILE_ID,
          owner_user_id: TARGET_USER,
        },
      ],
    });
    const result = await executeConnectionStatus(
      client,
      { targetProfileId: TARGET_PROFILE_ID },
      { user: { id: OWNER_USER } },
    );
    expect(result.connected).toBe(false);
    expect(result.connectionId).toBeNull();
  });
});

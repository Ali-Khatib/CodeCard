import { describe, expect, it } from 'vitest';
import { addConnectionInputSchema } from '@codecard/validation';
import { buildSavedConnectionInsert, connectFromQrScan, listOwnerConnections } from './connections';

describe('mobile saved_connections contract', () => {
  it('creates only qr-sourced owner→target inserts against saved_connections', () => {
    const row = buildSavedConnectionInsert({
      tenantId: '11111111-1111-4111-8111-111111111111',
      ownerUserId: '22222222-2222-4222-8222-222222222222',
      savedProfileId: '33333333-3333-4333-8333-333333333333',
      connectedAt: '2026-09-07T12:00:00.000Z',
    });

    expect(row).toEqual({
      tenant_id: '11111111-1111-4111-8111-111111111111',
      owner_user_id: '22222222-2222-4222-8222-222222222222',
      saved_profile_id: '33333333-3333-4333-8333-333333333333',
      source: 'qr',
      connected_at: '2026-09-07T12:00:00.000Z',
    });

    expect(
      addConnectionInputSchema.safeParse({
        targetProfileId: row.saved_profile_id,
        source: row.source,
      }).success,
    ).toBe(true);
  });

  it('rejects non-qr create sources in the shared schema', () => {
    expect(
      addConnectionInputSchema.safeParse({
        targetProfileId: '33333333-3333-4333-8333-333333333333',
        source: 'manual',
      }).success,
    ).toBe(false);
  });

  it('loads owner connections from saved_connections with the embedded public profile', async () => {
    const supabase = {
      from: (table: string) => {
        expect(table).toBe('saved_connections');
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: 'conn-1',
                    source: 'qr',
                    connected_at: '2026-09-07T12:00:00.000Z',
                    created_at: '2026-09-07T12:00:00.000Z',
                    saved_profile_id: '33333333-3333-4333-8333-333333333333',
                    profile: {
                      id: '33333333-3333-4333-8333-333333333333',
                      slug: 'bob-smith',
                      display_name: 'Bob Smith',
                      headline: 'Systems',
                      avatar_url: null,
                      is_public: true,
                    },
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      },
    };

    const result = await listOwnerConnections(supabase as never, '22222222-2222-4222-8222-222222222222');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.connections).toEqual([
      {
        id: 'conn-1',
        source: 'qr',
        connectedAt: '2026-09-07T12:00:00.000Z',
        createdAt: '2026-09-07T12:00:00.000Z',
        profileId: '33333333-3333-4333-8333-333333333333',
        slug: 'bob-smith',
        displayName: 'Bob Smith',
        headline: 'Systems',
        avatarUrl: null,
        isPublic: true,
      },
    ]);
  });

  it('refuses connecting to your own profile and skips duplicate saved_connections rows', async () => {
    const target = {
      id: '33333333-3333-4333-8333-333333333333',
      tenant_id: '11111111-1111-4111-8111-111111111111',
      owner_user_id: '44444444-4444-4444-8444-444444444444',
      slug: 'bob-smith',
      display_name: 'Bob Smith',
      headline: null,
      avatar_url: null,
      is_public: true,
    };

    const self = await connectFromQrScan({} as never, {
      ownerUserId: '22222222-2222-4222-8222-222222222222',
      ownerTenantId: '11111111-1111-4111-8111-111111111111',
      ownerProfileId: target.id,
      target,
    });
    expect(self).toEqual({ ok: false, error: 'You cannot connect to your own CodeCard.' });

    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: 'existing' }, error: null }),
            }),
          }),
        }),
      }),
    };
    const duplicate = await connectFromQrScan(supabase as never, {
      ownerUserId: '22222222-2222-4222-8222-222222222222',
      ownerTenantId: '11111111-1111-4111-8111-111111111111',
      ownerProfileId: '55555555-5555-4555-8555-555555555555',
      target,
    });
    expect(duplicate).toEqual({ ok: true, alreadyConnected: true });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  encodeCircleFeedCursor,
  parseCircleFeedCursor,
} from '@/lib/circle/circle-activity-contract';
import { markCircleSeen } from '@/lib/circle/circle-read-state-core';
import { resolveUploadOwnership } from '@/lib/storage/upload-ownership';
import { executeRemoveConnection } from '@/lib/connections/connections-core';
import { accountExportRequestSchema } from '@/lib/account/export-schema';

const WEB = resolve(process.cwd());

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT_A = '11111111-1111-4111-8111-111111111111';
const CONN_A = '44444444-4444-4444-8444-444444444444';

/** Mutation surfaces audited for IDOR (WS11-T003). */
export const IDOR_MUTATION_INVENTORY = [
  'profile update/publish/links/avatar',
  'project create/update/publish/delete/reorder/links/media',
  'research create/update/publish/delete/reorder/figures',
  'upload signed-url ownership',
  'connections add/remove',
  'collections create/rename/delete/membership',
  'connection private notes/metadata',
  'circle activity emit + read-state + cursors',
  'account export/delete identity',
] as const;

describe('WS11-T003 mutation IDOR security', () => {
  it('documents the mutation inventory and session-bound ownership helpers', () => {
    expect(IDOR_MUTATION_INVENTORY.length).toBeGreaterThanOrEqual(8);
    const cores: Array<{ file: string; markers: RegExp[] }> = [
      {
        file: 'src/lib/projects/project-update-core.ts',
        markers: [/resolveAuthenticatedUser/, /\.eq\('owner_user_id'/],
      },
      {
        file: 'src/lib/projects/project-delete-core.ts',
        markers: [/resolveAuthenticatedUser|\.eq\('owner_user_id'/],
      },
      {
        file: 'src/lib/research/research-update-core.ts',
        markers: [/resolveAuthenticatedUser|\.eq\('owner_user_id'|owner_user_id/],
      },
      {
        file: 'src/lib/research/research-delete-core.ts',
        markers: [/owner_user_id/],
      },
      {
        file: 'src/lib/connections/connections-core.ts',
        markers: [/getAuthenticatedUser/, /owner_user_id/],
      },
      {
        file: 'src/lib/connections/collections-core.ts',
        markers: [/getAuthenticatedUser/, /owner_user_id/],
      },
      {
        file: 'src/lib/connections/connection-metadata-core.ts',
        markers: [/getAuthenticatedUser/, /owner_user_id/],
      },
      {
        file: 'src/lib/circle/circle-read-state-core.ts',
        markers: [/auth\.getUser/, /viewer_user_id/],
      },
      {
        file: 'src/lib/storage/upload-ownership.ts',
        markers: [/owner_user_id/, /userId/],
      },
      {
        file: 'src/lib/account/export-build.ts',
        markers: [/user\.id/, /owner_user_id/],
      },
      {
        file: 'src/app/api/account/delete/route.ts',
        markers: [/requireAuth:\s*true/, /isSameOriginMutation/],
      },
    ];
    for (const { file, markers } of cores) {
      const src = readWeb(file);
      for (const marker of markers) {
        expect(src, `${file} should match ${marker}`).toMatch(marker);
      }
    }
  });

  it('rejects Circle cursors that inject viewer/owner identity', () => {
    const base = {
      createdAt: '2026-07-17T12:00:00.000Z',
      id: PROJECT_A,
      filter: 'all' as const,
    };
    expect(parseCircleFeedCursor({ ...base, viewerId: USER_A }, 'all').ok).toBe(false);
    expect(parseCircleFeedCursor({ ...base, ownerUserId: USER_A }, 'all').ok).toBe(false);
    expect(parseCircleFeedCursor({ ...base, userId: USER_B }, 'all').ok).toBe(false);
    const valid = encodeCircleFeedCursor(base);
    expect(parseCircleFeedCursor(valid, 'all').ok).toBe(true);
    expect(parseCircleFeedCursor(valid, 'projects').ok).toBe(false);
  });

  it('marks Circle seen only for the authenticated viewer', async () => {
    const upsert = vi.fn(async (row: { viewer_user_id: string }) => {
      expect(row.viewer_user_id).toBe(USER_A);
      return { error: null };
    });
    const supabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: USER_A } }, error: null }),
      },
      from: vi.fn(() => ({ upsert })),
    };

    const ok = await markCircleSeen(supabase as never, {
      seenAt: '2026-07-17T15:00:00.000Z',
    });
    expect(ok).toEqual({ ok: true, lastSeenAt: '2026-07-17T15:00:00.000Z' });

    const anon = {
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      from: vi.fn(),
    };
    const denied = await markCircleSeen(anon as never);
    expect(denied.ok).toBe(false);
    expect(anon.from).not.toHaveBeenCalled();
  });

  it('denies upload ownership when resource belongs to another user', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      })),
    };

    const result = await resolveUploadOwnership(
      supabase as never,
      USER_B,
      'project-media',
      PROJECT_A,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.message).not.toMatch(/supabase|stack|SQL/i);
    }
  });

  it('cannot remove another owner Connection by ID (owner-scoped lookup)', async () => {
    const selectEqCalls: Array<[string, string]> = [];
    const supabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: USER_B } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === 'saved_connections') {
          return {
            select: () => ({
              eq: (col: string, value: string) => {
                selectEqCalls.push([col, value]);
                return {
                  eq: (col2: string, value2: string) => {
                    selectEqCalls.push([col2, value2]);
                    return {
                      maybeSingle: async () => ({ data: null, error: null }),
                    };
                  },
                };
              },
            }),
            delete: vi.fn(),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    };

    const result = await executeRemoveConnection(supabase as never, {
      connectionId: CONN_A,
    });
    // Foreign connection is absent for B → idempotent NOT_FOUND, never deletes A's row.
    expect(result.success).toBe(true);
    expect(result.code).toBe('NOT_FOUND');
    expect(selectEqCalls).toContainEqual(['id', CONN_A]);
    expect(selectEqCalls).toContainEqual(['owner_user_id', USER_B]);
  });

  it('binds project and research write queries to session owner_user_id', () => {
    for (const file of [
      'src/lib/projects/project-update-core.ts',
      'src/lib/projects/project-delete-core.ts',
      'src/lib/projects/project-publish-core.ts',
      'src/lib/research/research-update-core.ts',
      'src/lib/research/research-delete-core.ts',
      'src/lib/research/research-publish-core.ts',
    ]) {
      const src = readWeb(file);
      expect(src).toContain(".eq('owner_user_id'");
    }
  });

  it('keeps Connections collections and notes owner-scoped via authenticated user', () => {
    for (const file of [
      'src/lib/connections/collections-core.ts',
      'src/lib/connections/connection-metadata-core.ts',
      'src/lib/connections/connections-core.ts',
    ]) {
      const src = readWeb(file);
      expect(src).toContain('getAuthenticatedUser');
      expect(src).toContain('owner_user_id');
    }
  });

  it('prevents clients from creating arbitrary Circle activity via API', () => {
    const projectPublish = readWeb('src/lib/projects/project-publish-core.ts');
    const researchPublish = readWeb('src/lib/research/research-publish-core.ts');
    expect(projectPublish).toContain('emitProjectPublishedActivity');
    expect(researchPublish).toContain('emitResearchPublishedActivity');
    const apiRoutes = readdirSync(resolve(WEB, 'src/app/api'), { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('route.ts'));
    expect(apiRoutes.some((f) => /circle/i.test(f))).toBe(false);
  });

  it('resolves account export/delete identity only from authentication', () => {
    expect(accountExportRequestSchema.safeParse({}).success).toBe(true);
    // Strict schema rejects client-supplied target identity.
    expect(accountExportRequestSchema.safeParse({ userId: USER_B }).success).toBe(false);

    const exportRoute = readWeb('src/app/api/account/export/route.ts');
    const deleteRoute = readWeb('src/app/api/account/delete/route.ts');
    const exportBuild = readWeb('src/lib/account/export-build.ts');
    expect(exportRoute).toContain('requireAuth: true');
    expect(exportRoute).toContain('buildAccountExportDocument(supabase, user)');
    expect(exportRoute).toContain('user.id !== ctx.userId');
    expect(exportBuild).toContain('never client-supplied');
    expect(deleteRoute).toContain('requireAuth: true');
    expect(deleteRoute).toContain('isSameOriginMutation');
    expect(deleteRoute).not.toMatch(/body\.userId|data\.userId|targetUserId/);
  });

  it('keeps upload ownership checks on authenticated user id', () => {
    const ownership = readWeb('src/lib/storage/upload-ownership.ts');
    const uploadRoute = readWeb('src/app/api/upload/route.ts');
    expect(ownership).toContain(".eq('owner_user_id', userId)");
    expect(uploadRoute).toContain('resolveUploadOwnership');
    expect(uploadRoute).toContain('isSameOriginMutation');
  });

  it('uses disposable synthetic user IDs only in this suite', () => {
    expect(USER_A.startsWith('aaaaaaaa')).toBe(true);
    expect(USER_B.startsWith('bbbbbbbb')).toBe(true);
    expect(IDOR_MUTATION_INVENTORY.join(' ')).not.toMatch(/alex.?chen/i);
  });
});

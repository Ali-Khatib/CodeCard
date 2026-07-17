import { describe, expect, it, vi } from 'vitest';
import {
  assertPersonalTenantSoleMember,
  collectAccountStorageCleanupTargets,
} from './delete-local-content';

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROFILE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PROJECT = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PATH = `${TENANT}/${OWNER}/project-media/${PROJECT}/file.png`;

function createChain(result: { data: unknown; error: unknown; count?: number | null }) {
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

describe('WS10-T004 local content helpers', () => {
  it('blocks shared tenants', async () => {
    const from = vi.fn(() => createChain({ data: null, error: null, count: 2 }));
    const result = await assertPersonalTenantSoleMember({ from } as never, TENANT);
    expect(result).toEqual({ ok: false, reason: 'shared_tenant' });
  });

  it('allows sole-member personal tenants', async () => {
    const from = vi.fn(() => createChain({ data: null, error: null, count: 1 }));
    const result = await assertPersonalTenantSoleMember({ from } as never, TENANT);
    expect(result).toEqual({ ok: true });
  });

  it('collects owner-scoped storage targets and ignores foreign paths', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'profiles') {
        return createChain({
          data: {
            id: PROFILE,
            avatar_url: null,
            tenant_id: TENANT,
            owner_user_id: OWNER,
          },
          error: null,
        });
      }
      if (table === 'projects') {
        return createChain({
          data: [{ id: PROJECT, tenant_id: TENANT, owner_user_id: OWNER }],
          error: null,
        });
      }
      if (table === 'project_media_assets') {
        return createChain({
          data: [{ id: 'media-1', type: 'poster', storage_path: PATH }],
          error: null,
        });
      }
      if (table === 'research_papers') {
        return createChain({ data: [], error: null });
      }
      return createChain({ data: [], error: null });
    });

    const result = await collectAccountStorageCleanupTargets({ from } as never, {
      ownerUserId: OWNER,
      tenantId: TENANT,
      profileId: PROFILE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload?.objects).toHaveLength(1);
    expect(result.payload?.objects[0]?.path).toBe(PATH);
    expect(result.payload?.resource_type).toBe('account');
  });
});

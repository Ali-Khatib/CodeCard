import { describe, expect, it, vi } from 'vitest';
import { deleteTrustedTenantShell } from './delete-tenant-shell';

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT_ID = '22222222-2222-4222-8222-222222222222';

type Harness = {
  supabase: Parameters<typeof deleteTrustedTenantShell>[0];
  deleteEq: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
};

function harness(opts: {
  membershipCount?: number;
  countError?: boolean;
  deleteError?: boolean;
}): Harness {
  const deleteEq = vi.fn(async () => ({
    error: opts.deleteError ? { message: 'boom' } : null,
  }));

  const memberships = {
    select: vi.fn(() => memberships),
    eq: vi.fn(async () => ({
      count: opts.membershipCount ?? 0,
      error: opts.countError ? { message: 'boom' } : null,
    })),
  };

  const tenants = {
    delete: vi.fn(() => ({ eq: deleteEq })),
  };

  const from = vi.fn((table: string) => {
    if (table === 'tenant_memberships') return memberships;
    if (table === 'tenants') return tenants;
    throw new Error(`unexpected table ${table}`);
  });

  return {
    supabase: { from } as unknown as Parameters<typeof deleteTrustedTenantShell>[0],
    deleteEq,
    from,
  };
}

const ctx = {
  authenticatedUserId: OWNER_ID,
  trustedOwnerUserId: OWNER_ID,
  tenantId: TENANT_ID,
  correlationId: 'corr-1',
};

describe('deleteTrustedTenantShell', () => {
  it('deletes the tenant shell once no memberships remain', async () => {
    const h = harness({ membershipCount: 0 });
    await expect(deleteTrustedTenantShell(h.supabase, ctx)).resolves.toEqual({
      ok: true,
      deleted: true,
    });
    expect(h.deleteEq).toHaveBeenCalledWith('id', TENANT_ID);
  });

  it('refuses to delete a tenant that still has members', async () => {
    const h = harness({ membershipCount: 1 });
    await expect(deleteTrustedTenantShell(h.supabase, ctx)).resolves.toEqual({
      ok: false,
      reason: 'members_remain',
    });
    expect(h.deleteEq).not.toHaveBeenCalled();
  });

  it('rejects a mismatch between session and trusted owner', async () => {
    const h = harness({ membershipCount: 0 });
    await expect(
      deleteTrustedTenantShell(h.supabase, { ...ctx, trustedOwnerUserId: OTHER_ID }),
    ).resolves.toEqual({ ok: false, reason: 'target_mismatch' });
    expect(h.from).not.toHaveBeenCalled();
  });

  it('does not delete when the membership count cannot be read', async () => {
    const h = harness({ countError: true });
    await expect(deleteTrustedTenantShell(h.supabase, ctx)).resolves.toEqual({
      ok: false,
      reason: 'delete_failed',
    });
    expect(h.deleteEq).not.toHaveBeenCalled();
  });

  it('reports a failed delete', async () => {
    const h = harness({ membershipCount: 0, deleteError: true });
    await expect(deleteTrustedTenantShell(h.supabase, ctx)).resolves.toEqual({
      ok: false,
      reason: 'delete_failed',
    });
  });
});

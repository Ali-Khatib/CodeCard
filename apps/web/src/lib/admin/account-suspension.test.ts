import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { suspendAccount } from './account-suspension';

const actorUserId = '11111111-1111-4111-8111-111111111111';
const targetUserId = '22222222-2222-4222-8222-222222222222';
const reportId = '33333333-3333-4333-8333-333333333333';

const mockWriteAudit = vi.fn();

vi.mock('@/lib/admin/admin-audit', () => ({
  writeAdminAuditEvent: (...args: unknown[]) => mockWriteAudit(...args),
}));

function makeService(options: {
  user?: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    banned_until?: string | null;
    is_anonymous?: boolean;
  } | null;
  getError?: unknown;
  prepareOutcome?: string;
  prepareError?: unknown;
  banError?: unknown;
  otherAdminCount?: number;
  countError?: unknown;
}) {
  const getUserById = vi.fn().mockResolvedValue({
    data: options.user ? { user: options.user } : { user: null },
    error: options.getError ?? null,
  });
  const updateUserById = vi.fn().mockResolvedValue({
    data: { user: options.user },
    error: options.banError ?? null,
  });
  const rpc = vi.fn(async (name: string) => {
    if (name === 'admin_count_other_active_global_admins') {
      return {
        data: options.otherAdminCount ?? 0,
        error: options.countError ?? null,
      };
    }
    if (name === 'admin_prepare_account_suspension') {
      return {
        data: { outcome: options.prepareOutcome ?? 'updated', target_user_id: targetUserId },
        error: options.prepareError ?? null,
      };
    }
    throw new Error(`unexpected rpc ${name}`);
  });

  return {
    client: {
      auth: { admin: { getUserById, updateUserById } },
      rpc,
    },
    getUserById,
    updateUserById,
    rpc,
  };
}

describe('suspendAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteAudit.mockResolvedValue({ ok: true, inserted: true, auditId: 'audit-1' });
  });

  it('rejects self-suspension before Auth or database mutation', async () => {
    const mock = makeService({ user: { id: actorUserId } });
    await expect(
      suspendAccount(
        { actorUserId, targetUserId: actorUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'self_suspension' });
    expect(mock.getUserById).not.toHaveBeenCalled();
    expect(mockWriteAudit).not.toHaveBeenCalled();
  });

  it('rejects unknown targets', async () => {
    const mock = makeService({ user: null });
    await expect(
      suspendAccount(
        { actorUserId, targetUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'target_not_found' });
    expect(mock.updateUserById).not.toHaveBeenCalled();
  });

  it('rejects demo identities', async () => {
    const mock = makeService({
      user: { id: targetUserId, email: DEMO_WORKSPACE.email },
    });
    await expect(
      suspendAccount(
        { actorUserId, targetUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'demo_identity' });
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it('rejects service identities', async () => {
    const mock = makeService({
      user: {
        id: targetUserId,
        email: 'worker@service.codecard.internal',
        app_metadata: { codecard_service: true },
      },
    });
    await expect(
      suspendAccount(
        { actorUserId, targetUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'service_identity' });
  });

  it('blocks suspending the last global administrator', async () => {
    const mock = makeService({
      user: { id: targetUserId, email: 'admin@example.com', app_metadata: { role: 'admin' } },
      otherAdminCount: 0,
    });
    await expect(
      suspendAccount(
        { actorUserId, targetUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'last_admin' });
    expect(mock.updateUserById).not.toHaveBeenCalled();
  });

  it('prepares durable suspension then bans Auth exactly once', async () => {
    const mock = makeService({
      user: { id: targetUserId, email: 'user@example.com', app_metadata: {} },
      prepareOutcome: 'updated',
    });

    await expect(
      suspendAccount(
        { actorUserId, targetUserId, reportId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toMatchObject({
      ok: true,
      outcome: 'updated',
      targetUserId,
      authSuspended: true,
    });

    expect(mock.rpc).toHaveBeenCalledWith('admin_prepare_account_suspension', {
      p_actor_user_id: actorUserId,
      p_target_user_id: targetUserId,
      p_report_id: reportId,
    });
    expect(mock.updateUserById).toHaveBeenCalledTimes(1);
    expect(mock.updateUserById).toHaveBeenCalledWith(targetUserId, {
      ban_duration: '876000h',
    });
    expect(mockWriteAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId,
        action: 'user.suspended',
        resourceType: 'auth_user',
        resourceId: targetUserId,
        metadata: expect.not.objectContaining({
          note: expect.anything(),
          reason: expect.anything(),
          report: expect.anything(),
        }),
      }),
      expect.anything(),
    );
  });

  it('returns retryable partial failure when Auth ban fails after DB prepare', async () => {
    const mock = makeService({
      user: { id: targetUserId, email: 'user@example.com' },
      prepareOutcome: 'updated',
      banError: { message: 'private auth admin detail' },
    });

    await expect(
      suspendAccount(
        { actorUserId, targetUserId, reportId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'auth_partial' });

    expect(mockWriteAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.suspension_partial',
        result: 'partial',
      }),
      expect.anything(),
    );
  });

  it('is idempotent when already prepared and Auth-banned', async () => {
    const mock = makeService({
      user: {
        id: targetUserId,
        email: 'user@example.com',
        banned_until: '2099-01-01T00:00:00.000Z',
      },
      prepareOutcome: 'idempotent',
    });

    await expect(
      suspendAccount(
        { actorUserId, targetUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toMatchObject({ ok: true, outcome: 'idempotent', authSuspended: true });
    expect(mock.updateUserById).not.toHaveBeenCalled();
  });

  it('does not call Auth when database prepare fails', async () => {
    const mock = makeService({
      user: { id: targetUserId, email: 'user@example.com' },
      prepareError: { message: 'db unavailable' },
    });

    await expect(
      suspendAccount(
        { actorUserId, targetUserId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'service_unavailable' });
    expect(mock.updateUserById).not.toHaveBeenCalled();
  });

  it('maps report target mismatches without Auth mutation', async () => {
    const mock = makeService({
      user: { id: targetUserId, email: 'user@example.com' },
      prepareOutcome: 'target_mismatch',
    });

    await expect(
      suspendAccount(
        { actorUserId, targetUserId, reportId },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'target_mismatch' });
    expect(mock.updateUserById).not.toHaveBeenCalled();
  });
});

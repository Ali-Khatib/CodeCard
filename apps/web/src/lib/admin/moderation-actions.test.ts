import { describe, expect, it, vi } from 'vitest';
import { transitionModerationReport } from './moderation-actions';

function clientResult(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc }, rpc };
}

const input = {
  reportId: '11111111-1111-4111-8111-111111111111',
  actorUserId: '22222222-2222-4222-8222-222222222222',
} as const;

describe('transitionModerationReport', () => {
  it.each([
    ['resolve', 'resolved'],
    ['dismiss', 'dismissed'],
  ] as const)('executes the narrow %s RPC with server-derived actor context', async (action, status) => {
    const mock = clientResult({
      outcome: 'updated',
      resulting_status: status,
      audit_inserted: true,
    });

    const result = await transitionModerationReport(
      { ...input, action },
      { createPrivilegedClient: async () => mock.client as never },
    );

    expect(result).toEqual({
      ok: true,
      outcome: 'updated',
      status,
      auditInserted: true,
    });
    expect(mock.rpc).toHaveBeenCalledWith('admin_transition_moderation_report', {
      p_report_id: input.reportId,
      p_action: action,
      p_actor_user_id: input.actorUserId,
    });
  });

  it('treats a repeated identical transition as an idempotent success', async () => {
    const mock = clientResult({
      outcome: 'idempotent',
      resulting_status: 'resolved',
      audit_inserted: false,
    });

    await expect(
      transitionModerationReport(
        { ...input, action: 'resolve' },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({
      ok: true,
      outcome: 'idempotent',
      status: 'resolved',
      auditInserted: false,
    });
  });

  it.each([
    ['not_found', 'not_found'],
    ['conflict', 'conflict'],
  ] as const)('maps %s without leaking database details', async (outcome, reason) => {
    const mock = clientResult({ outcome });

    await expect(
      transitionModerationReport(
        { ...input, action: 'dismiss' },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason });
  });

  it('fails safely when the RPC or provider fails', async () => {
    const mock = clientResult(null, new Error('raw PostgREST detail'));

    await expect(
      transitionModerationReport(
        { ...input, action: 'resolve' },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toEqual({ ok: false, reason: 'service_unavailable' });
  });
});

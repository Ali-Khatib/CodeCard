import { describe, expect, it, vi } from 'vitest';
import { hideReportedContent } from './content-hiding';

const input = {
  actorUserId: '11111111-1111-4111-8111-111111111111',
  reportId: '22222222-2222-4222-8222-222222222222',
  targetType: 'project' as const,
  targetId: '33333333-3333-4333-8333-333333333333',
};

function mockClient(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc }, rpc };
}

describe('hideReportedContent', () => {
  it('executes the atomic hide using the server-derived actor', async () => {
    const mock = mockClient({
      outcome: 'updated',
      target_type: 'project',
      target_id: input.targetId,
      profile_slug: 'owner-profile',
      is_public: false,
      audit_inserted: true,
    });

    await expect(
      hideReportedContent(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({
      ok: true,
      outcome: 'updated',
      targetType: 'project',
      targetId: input.targetId,
      profileSlug: 'owner-profile',
      isPublic: false,
      auditInserted: true,
    });
    expect(mock.rpc).toHaveBeenCalledWith('admin_hide_reported_content', {
      p_actor_user_id: input.actorUserId,
      p_report_id: input.reportId,
      p_target_type: 'project',
      p_target_id: input.targetId,
    });
  });

  it('returns safe idempotent success for an existing hold', async () => {
    const mock = mockClient({
      outcome: 'idempotent',
      target_type: 'project',
      target_id: input.targetId,
      profile_slug: 'owner-profile',
      is_public: false,
      audit_inserted: false,
    });

    await expect(
      hideReportedContent(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toMatchObject({ ok: true, outcome: 'idempotent', auditInserted: false });
  });

  it.each([
    'report_not_found',
    'target_not_found',
    'target_mismatch',
    'conflict',
  ] as const)('maps %s without provider details', async (outcome) => {
    const mock = mockClient({ outcome });

    await expect(
      hideReportedContent(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: false, reason: outcome });
  });

  it('fails closed on provider errors', async () => {
    const mock = mockClient(null, new Error('private database detail'));

    await expect(
      hideReportedContent(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: false, reason: 'service_unavailable' });
  });
});

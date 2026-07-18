import { describe, expect, it, vi } from 'vitest';
import {
  ADMIN_AUDIT_METADATA_MAX_BYTES,
  validateAdminAuditInput,
  writeAdminAuditEvent,
} from './admin-audit';

const validInput = {
  actorUserId: '11111111-1111-4111-8111-111111111111',
  action: 'moderation_report.resolved' as const,
  resourceType: 'moderation_report' as const,
  resourceId: '22222222-2222-4222-8222-222222222222',
  result: 'succeeded' as const,
  idempotencyKey: 'moderation-report:222:resolve',
  metadata: {
    previous_status: 'pending',
    resulting_status: 'resolved',
    schema_version: 'ws13-t008-v1',
  },
};

function mockClient(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc }, rpc };
}

describe('canonical admin audit writer', () => {
  it('writes an allowlisted event with the already-authorized actor', async () => {
    const mock = mockClient({
      ok: true,
      inserted: true,
      audit_id: '33333333-3333-4333-8333-333333333333',
    });

    const result = await writeAdminAuditEvent(validInput, {
      createPrivilegedClient: async () => mock.client as never,
    });

    expect(result).toEqual({
      ok: true,
      inserted: true,
      auditId: '33333333-3333-4333-8333-333333333333',
    });
    expect(mock.rpc).toHaveBeenCalledWith('insert_admin_audit_event', {
      p_actor_user_id: validInput.actorUserId,
      p_action: 'moderation_report.resolved',
      p_resource_type: 'moderation_report',
      p_resource_id: validInput.resourceId,
      p_result: 'succeeded',
      p_idempotency_key: validInput.idempotencyKey,
      p_metadata: validInput.metadata,
    });
  });

  it('returns an idempotent existing audit without inserting a duplicate', async () => {
    const mock = mockClient({
      ok: true,
      inserted: false,
      audit_id: '33333333-3333-4333-8333-333333333333',
    });

    await expect(
      writeAdminAuditEvent(validInput, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toMatchObject({ ok: true, inserted: false });
  });

  it.each([
    [{ ...validInput, action: 'client.created_event' }, 'arbitrary action'],
    [{ ...validInput, actorUserId: 'caller-supplied' }, 'invalid actor'],
    [{ ...validInput, resourceType: 'project' }, 'action/resource mismatch'],
    [{ ...validInput, metadata: { token: 'secret' } }, 'token'],
    [{ ...validInput, metadata: { note: 'private note body' } }, 'private note'],
    [{ ...validInput, metadata: { report: 'full report body' } }, 'report body'],
    [{ ...validInput, metadata: { authorization: 'Bearer secret' } }, 'authorization'],
  ])('rejects %s (%s) before service-role use', async (input, label) => {
    const createPrivilegedClient = vi.fn();
    expect(label).toBeTruthy();

    const result = await writeAdminAuditEvent(input as never, {
      createPrivilegedClient,
    });

    expect(result).toEqual({ ok: false, reason: 'invalid_input' });
    expect(createPrivilegedClient).not.toHaveBeenCalled();
  });

  it('rejects oversized metadata deterministically', () => {
    const result = validateAdminAuditInput({
      ...validInput,
      metadata: { safe_summary: 'x'.repeat(ADMIN_AUDIT_METADATA_MAX_BYTES) },
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_input' });
  });

  it('returns an opaque structured failure for provider errors', async () => {
    const mock = mockClient(null, new Error('raw provider secret'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      writeAdminAuditEvent(validInput, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: false, reason: 'service_unavailable' });
    expect(log).toHaveBeenCalledWith('[admin-audit] write failed', {
      reason: 'provider_error',
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('raw provider secret');
    log.mockRestore();
  });
});

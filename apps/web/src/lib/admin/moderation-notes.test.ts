import { describe, expect, it, vi } from 'vitest';
import {
  moderationNoteUpdateSchema,
  updateModerationNote,
} from './moderation-notes';

const input = {
  actorUserId: '11111111-1111-4111-8111-111111111111',
  reportId: '22222222-2222-4222-8222-222222222222',
  note: '  Review with trust team.  ',
  expectedUpdatedAt: '2026-07-18T00:00:00.000Z',
};

function mockClient(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc }, rpc };
}

describe('moderation notes', () => {
  it('validates bounded plain text and rejects extra actor fields', () => {
    expect(
      moderationNoteUpdateSchema.safeParse({
        note: '<script>alert(1)</script>',
        expectedUpdatedAt: input.expectedUpdatedAt,
      }).success,
    ).toBe(true);
    expect(
      moderationNoteUpdateSchema.safeParse({
        note: 'x'.repeat(4001),
        expectedUpdatedAt: input.expectedUpdatedAt,
      }).success,
    ).toBe(false);
    expect(
      moderationNoteUpdateSchema.safeParse({
        note: 'safe',
        expectedUpdatedAt: input.expectedUpdatedAt,
        actorUserId: input.actorUserId,
      }).success,
    ).toBe(false);
  });

  it('normalizes and updates using the server-derived actor', async () => {
    const mock = mockClient({
      outcome: 'updated',
      note_present: true,
      note_length: 23,
      updated_at: '2026-07-18T00:01:00.000Z',
      audit_inserted: true,
    });

    await expect(
      updateModerationNote(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({
      ok: true,
      outcome: 'updated',
      notePresent: true,
      noteLength: 23,
      updatedAt: '2026-07-18T00:01:00.000Z',
      auditInserted: true,
    });

    expect(mock.rpc).toHaveBeenCalledWith('admin_update_moderation_note', {
      p_actor_user_id: input.actorUserId,
      p_report_id: input.reportId,
      p_note: 'Review with trust team.',
      p_expected_updated_at: input.expectedUpdatedAt,
    });
  });

  it('supports deliberate clearing', async () => {
    const mock = mockClient({
      outcome: 'updated',
      note_present: false,
      note_length: 0,
      updated_at: '2026-07-18T00:02:00.000Z',
      audit_inserted: true,
    });

    await expect(
      updateModerationNote(
        { ...input, note: '   ' },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).resolves.toMatchObject({ ok: true, notePresent: false, noteLength: 0 });
    expect(mock.rpc).toHaveBeenCalledWith(
      'admin_update_moderation_note',
      expect.objectContaining({ p_note: null }),
    );
  });

  it('returns deliberate optimistic-concurrency conflict', async () => {
    const mock = mockClient({
      outcome: 'conflict',
      updated_at: '2026-07-18T00:03:00.000Z',
    });

    await expect(
      updateModerationNote(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({
      ok: false,
      reason: 'conflict',
      updatedAt: '2026-07-18T00:03:00.000Z',
    });
  });

  it('keeps provider errors opaque', async () => {
    const mock = mockClient(null, new Error('private note and SQL detail'));
    await expect(
      updateModerationNote(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: false, reason: 'service_unavailable' });
  });
});

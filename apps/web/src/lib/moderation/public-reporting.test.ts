import { describe, expect, it, vi } from 'vitest';
import {
  createReportSourceFingerprint,
  submitPublicReport,
} from './public-reporting';

const input = {
  reporterUserId: null,
  targetType: 'profile' as const,
  targetId: '11111111-1111-4111-8111-111111111111',
  reasonCategory: 'spam' as const,
  description: '  Repeated misleading links.  ',
  sourceFingerprint: 'a'.repeat(64),
};

function mockClient(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc }, rpc };
}

describe('public moderation reporting', () => {
  it('creates stable privacy-preserving fingerprints without storing raw IP', () => {
    const first = createReportSourceFingerprint(
      { ip: '203.0.113.4', reporterUserId: null },
      'test-secret',
    );
    const second = createReportSourceFingerprint(
      { ip: '203.0.113.4', reporterUserId: null },
      'test-secret',
    );
    const authenticated = createReportSourceFingerprint(
      {
        ip: '203.0.113.4',
        reporterUserId: '22222222-2222-4222-8222-222222222222',
      },
      'test-secret',
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain('203.0.113.4');
    expect(authenticated).not.toBe(first);
  });

  it('submits only validated fields through the server RPC', async () => {
    const mock = mockClient({ outcome: 'accepted' });
    await expect(
      submitPublicReport(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: true });

    expect(mock.rpc).toHaveBeenCalledWith('submit_public_moderation_report', {
      p_reporter_user_id: null,
      p_target_type: 'profile',
      p_target_id: input.targetId,
      p_reason_category: 'spam',
      p_description: 'Repeated misleading links.',
      p_source_fingerprint: input.sourceFingerprint,
    });
  });

  it('returns the same accepted result for database-deduplicated submissions', async () => {
    const mock = mockClient({ outcome: 'accepted' });
    await expect(
      submitPublicReport(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: true });
  });

  it.each(['target_unavailable', 'invalid'] as const)(
    'maps %s without provider or moderation details',
    async (outcome) => {
      const mock = mockClient({ outcome });
      await expect(
        submitPublicReport(input, {
          createPrivilegedClient: async () => mock.client as never,
        }),
      ).resolves.toEqual({ ok: false, reason: outcome });
    },
  );

  it('keeps provider errors opaque', async () => {
    const mock = mockClient(null, new Error('private report SQL detail'));
    await expect(
      submitPublicReport(input, {
        createPrivilegedClient: async () => mock.client as never,
      }),
    ).resolves.toEqual({ ok: false, reason: 'service_unavailable' });
  });
});

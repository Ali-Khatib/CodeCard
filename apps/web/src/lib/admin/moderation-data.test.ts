import { describe, expect, it, vi } from 'vitest';
import {
  ADMIN_MODERATION_EXPLICIT_COLUMNS,
  listDmcaNotices,
  listModerationReports,
} from './moderation-data';

function makeClient(result: { data: Record<string, unknown>[]; count: number; error: unknown }) {
  const range = vi.fn().mockResolvedValue(result);
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.range = range;
  const from = vi.fn(() => chain);

  return {
    client: { from },
    from,
    select: chain.select,
    eq: chain.eq,
    order: chain.order,
    range,
  };
}

describe('privileged moderation data DTOs', () => {
  it('selects only explicit report columns, applies stable sorting, and omits private fields', async () => {
    const mock = makeClient({
      data: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          target_type: 'project',
          target_id: '22222222-2222-4222-8222-222222222222',
          reason: 'Spam',
          status: 'pending',
          created_at: '2026-07-18T00:00:00.000Z',
          updated_at: '2026-07-18T00:00:00.000Z',
          reporter_user_id: 'private-user',
          source_fingerprint: 'private-source',
        },
      ],
      count: 1,
      error: null,
    });

    const result = await listModerationReports(
      { page: 1, pageSize: 20, status: 'pending', targetType: 'project' },
      { createPrivilegedClient: async () => mock.client as never },
    );

    expect(mock.from).toHaveBeenCalledWith('moderation_reports');
    expect(mock.select).toHaveBeenCalledWith(ADMIN_MODERATION_EXPLICIT_COLUMNS.reports, {
      count: 'exact',
    });
    expect(mock.eq).toHaveBeenCalledWith('status', 'pending');
    expect(mock.eq).toHaveBeenCalledWith('target_type', 'project');
    expect(mock.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(mock.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(mock.range).toHaveBeenCalledWith(0, 19);
    expect(result.items[0]).not.toHaveProperty('reporter_user_id');
    expect(result.items[0]).not.toHaveProperty('source_fingerprint');
    expect(result.items[0]).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      targetType: 'project',
      targetId: '22222222-2222-4222-8222-222222222222',
      ownerUserId: null,
      reasonPreview: 'Spam',
      status: 'pending',
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
    });
  });

  it('selects a privacy-conscious DMCA list DTO', async () => {
    const mock = makeClient({
      data: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          claimant_name: 'Claimant',
          claimant_email: 'private@example.com',
          copyrighted_work: 'Original work',
          infringing_url: 'https://example.com/infringing',
          statement: 'private legal statement',
          signature: 'private signature',
          status: 'pending',
          created_at: '2026-07-18T00:00:00.000Z',
          updated_at: '2026-07-18T00:00:00.000Z',
        },
      ],
      count: 1,
      error: null,
    });

    const result = await listDmcaNotices(
      { page: 1, pageSize: 20, status: 'pending' },
      { createPrivilegedClient: async () => mock.client as never },
    );

    expect(mock.select).toHaveBeenCalledWith(ADMIN_MODERATION_EXPLICIT_COLUMNS.dmca, {
      count: 'exact',
    });
    expect(result.items[0]).not.toHaveProperty('claimant_email');
    expect(result.items[0]).not.toHaveProperty('statement');
    expect(result.items[0]).not.toHaveProperty('signature');
    expect(result.items[0]).toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      claimantName: 'Claimant',
      copyrightedWorkPreview: 'Original work',
      infringingUrl: 'https://example.com/infringing',
      status: 'pending',
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
    });
  });

  it('throws only a stable internal error on provider failures', async () => {
    const mock = makeClient({
      data: [],
      count: 0,
      error: new Error('sensitive provider detail'),
    });

    await expect(
      listModerationReports(
        { page: 1, pageSize: 20, status: 'pending' },
        { createPrivilegedClient: async () => mock.client as never },
      ),
    ).rejects.toThrow('ADMIN_MODERATION_READ_FAILED');
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  reconcileAbandonedUploadIntents,
  recordUploadIntent,
} from './upload-intents';
import {
  requireVerifiedRasterObjectForFinalize,
} from './finalize-raster-verification';

describe('upload intents and orphan reconciliation', () => {
  it('records a signed-upload intent for the authenticated owner', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient;

    const result = await recordUploadIntent(
      supabase,
      {
        tenantId: '11111111-1111-4111-8111-111111111111',
        ownerUserId: '22222222-2222-4222-8222-222222222222',
        resourceType: 'avatar',
        resourceId: '33333333-3333-4333-8333-333333333333',
      },
      {
        bucket: 'avatars',
        path: 't/u/avatar/p/x.png',
        mimeType: 'image/png',
        maxBytes: 1024,
      },
    );

    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: '22222222-2222-4222-8222-222222222222',
        object_path: 't/u/avatar/p/x.png',
        mime_type: 'image/png',
      }),
    );
  });

  it('dry-run reconciliation counts candidates without deleting', async () => {
    const removeObject = vi.fn();
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            is: vi.fn(() => ({
              lt: vi.fn().mockResolvedValue({
                data: [{ id: '1', bucket: 'avatars', object_path: 'orphan.png' }],
                error: null,
              }),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await reconcileAbandonedUploadIntents(supabase, {
      dryRun: true,
      gracePeriodHours: 24,
      now: new Date('2026-07-18T00:00:00.000Z'),
      removeObject,
    });

    expect(result).toEqual({ candidates: 1, abandoned: 0, dryRun: true });
    expect(removeObject).not.toHaveBeenCalled();
  });

  it('abandons eligible orphans idempotently after the grace period', async () => {
    const removeObject = vi.fn().mockResolvedValue(undefined);
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        is: updateEq,
      })),
    }));

    let selectCalls = 0;
    const supabase = {
      from: vi.fn(() => {
        selectCalls += 1;
        if (selectCalls === 1) {
          return {
            select: vi.fn(() => ({
              is: vi.fn(() => ({
                is: vi.fn(() => ({
                  lt: vi.fn().mockResolvedValue({
                    data: [{ id: '1', bucket: 'avatars', object_path: 'orphan.png' }],
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        return { update };
      }),
    } as unknown as SupabaseClient;

    const first = await reconcileAbandonedUploadIntents(supabase, {
      dryRun: false,
      gracePeriodHours: 24,
      now: new Date('2026-07-18T00:00:00.000Z'),
      removeObject,
    });
    expect(first.abandoned).toBe(1);
    expect(removeObject).toHaveBeenCalledWith('avatars', 'orphan.png');
  });
});

describe('requireVerifiedRasterObjectForFinalize', () => {
  it('removes unsafe objects when magic bytes do not match', async () => {
    const html = new TextEncoder().encode('<html>xss</html>');
    const download = vi.fn().mockResolvedValue({
      data: new Blob([Buffer.from(html)]),
      error: null,
    });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        bucket: 'avatars',
        object_path: 't/u/avatar/p/x.png',
        mime_type: 'image/png',
        max_bytes: 1024,
        resource_type: 'avatar',
        resource_id: '33333333-3333-4333-8333-333333333333',
      },
      error: null,
    });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'storage_upload_intents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  is: vi.fn(() => ({
                    maybeSingle,
                  })),
                })),
              })),
            })),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
      storage: {
        from: vi.fn(() => ({ download, remove, list: vi.fn() })),
      },
    } as unknown as SupabaseClient;

    const result = await requireVerifiedRasterObjectForFinalize(supabase, {
      path: '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/avatar/33333333-3333-4333-8333-333333333333/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png',
      resourceType: 'avatar',
    });

    expect(result).toEqual({ ok: false });
    expect(remove).toHaveBeenCalled();
  });
});

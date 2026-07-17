import { describe, expect, it, vi } from 'vitest';
import { STORAGE_BUCKETS } from '@codecard/config';
import {
  processClaimedStorageCleanupJob,
  removeStorageObjectWithMissingTolerance,
} from './cleanup-storage';
import type { StorageCleanupJobRow } from './cleanup-storage';

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PATH = `${TENANT}/${OWNER}/project-media/${PROJECT}/file.png`;
const OTHER_PATH = `${TENANT}/dddddddd-dddd-4ddd-8ddd-dddddddddddd/project-media/${PROJECT}/other.png`;

function baseJob(overrides: Partial<StorageCleanupJobRow> = {}): StorageCleanupJobRow {
  return {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    tenant_id: TENANT,
    type: 'storage_cleanup',
    status: 'processing',
    payload: {
      version: 1,
      operation: 'delete_objects',
      resource_type: 'project',
      resource_id: PROJECT,
      owner_user_id: OWNER,
      tenant_id: TENANT,
      objects: [
        {
          bucket: STORAGE_BUCKETS.projectMedia,
          path: PATH,
          resource_type: 'project-media',
        },
      ],
    },
    result: null,
    error: null,
    attempts: 1,
    available_at: new Date().toISOString(),
    claimed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('WS04-T010 cleanup processor', () => {
  it('removes objects and marks the job complete', async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }));
    const supabase = {
      storage: { from: vi.fn(() => ({ remove })) },
      from: vi.fn(() => ({ update })),
    };

    const result = await processClaimedStorageCleanupJob(supabase as never, baseJob());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.removedCount).toBe(1);
    expect(remove).toHaveBeenCalledWith([PATH]);
  });

  it('treats already-missing objects as success', async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: 'Object not found', statusCode: '404' } });
    const supabase = {
      storage: { from: vi.fn(() => ({ remove })) },
    };
    const result = await removeStorageObjectWithMissingTolerance(supabase as never, {
      bucket: STORAGE_BUCKETS.projectMedia,
      path: PATH,
      resource_type: 'project-media',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.alreadyMissing).toBe(true);
  });

  it('deletes nothing for malformed payloads', async () => {
    const remove = vi.fn();
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }));
    const supabase = {
      storage: { from: vi.fn(() => ({ remove })) },
      from: vi.fn(() => ({ update })),
    };

    const result = await processClaimedStorageCleanupJob(
      supabase as never,
      baseJob({
        payload: {
          version: 1,
          operation: 'delete_objects',
          resource_type: 'project',
          resource_id: PROJECT,
          owner_user_id: OWNER,
          tenant_id: TENANT,
          objects: [
            {
              bucket: STORAGE_BUCKETS.projectMedia,
              path: OTHER_PATH,
              resource_type: 'project-media',
            },
          ],
        },
      }),
    );

    expect(result.ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it('schedules retry on temporary storage failure', async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: 'timeout' } });
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }));
    const supabase = {
      storage: { from: vi.fn(() => ({ remove })) },
      from: vi.fn(() => ({ update })),
    };

    const result = await processClaimedStorageCleanupJob(supabase as never, baseJob({ attempts: 1 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.retryable).toBe(true);
    expect(result.reason).toBe('storage_failure');
  });

  it('marks terminal failure after max attempts', async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: 'timeout' } });
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }));
    const supabase = {
      storage: { from: vi.fn(() => ({ remove })) },
      from: vi.fn(() => ({ update })),
    };

    const result = await processClaimedStorageCleanupJob(supabase as never, baseJob({ attempts: 5 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.retryable).toBe(false);
    expect(result.reason).toBe('terminal_failure');
  });
});

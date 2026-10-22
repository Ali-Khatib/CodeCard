import { describe, expect, it, vi } from 'vitest';
import { postOwnedForm } from './post-owned-form';

describe('postOwnedForm', () => {
  it('returns the confirmed body only when the response succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ success: true, projectId: 'p1' }), { status: 200 }),
      ),
    );
    const body = new FormData();
    const result = await postOwnedForm<{ success?: boolean; projectId?: string }>('/api/projects?op=create', body);
    expect(result).toEqual({ success: true, projectId: 'p1' });
    vi.unstubAllGlobals();
  });

  it('does not report success when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    const result = await postOwnedForm('/api/projects?op=update', new FormData());
    expect(result.success).toBeUndefined();
    expect(result.error).toBeTruthy();
    vi.unstubAllGlobals();
  });
});

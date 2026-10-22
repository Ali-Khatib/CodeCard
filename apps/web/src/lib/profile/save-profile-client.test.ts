import { afterEach, describe, expect, it, vi } from 'vitest';
import { postProfileSave } from './save-profile-client';

function formData() {
  const fd = new FormData();
  fd.set('display_name', 'Alex');
  return fd;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postProfileSave', () => {
  it('returns success only after the server confirms the write', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, updatedAt: '2026-03-01T00:00:00.000Z' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const result = await postProfileSave(formData());
    expect(result).toEqual({ success: true, updatedAt: '2026-03-01T00:00:00.000Z' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('does not report success when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await postProfileSave(formData());
    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/try again/i);
  });

  it('does not report success when persistence is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: 'Profile not found.' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const result = await postProfileSave(formData());
    expect(result.success).toBeUndefined();
    expect(result.error).toBe('Profile not found.');
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSignedUploadIntent } from './upload-core';

describe('createSignedUploadIntent', () => {
  it('signs only after building the canonical path', async () => {
    const createSignedUploadUrl = vi.fn().mockResolvedValue({
      data: {
        signedUrl: 'https://storage.example/upload',
        token: 'token',
        path: 'ignored',
      },
      error: null,
    });

    const supabase = {
      storage: {
        from: vi.fn(() => ({ createSignedUploadUrl })),
      },
    } as unknown as SupabaseClient;

    const result = await createSignedUploadIntent(
      supabase,
      {
        tenantId: '11111111-1111-4111-8111-111111111111',
        ownerUserId: '22222222-2222-4222-8222-222222222222',
        resourceType: 'avatar',
        resourceId: '33333333-3333-4333-8333-333333333333',
      },
      {
        ok: true,
        extension: 'png',
        mimeType: 'image/png',
        maxBytes: 1024,
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intent.path.split('/')).toHaveLength(5);
      expect(result.intent.signedUrl).toBe('https://storage.example/upload');
    }
    expect(createSignedUploadUrl).toHaveBeenCalledTimes(1);
  });
});

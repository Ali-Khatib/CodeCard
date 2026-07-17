import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSignedUploadIntent } from './upload-core';

describe('createSignedUploadIntent', () => {
  it('signs only after building the canonical path and records an upload intent', async () => {
    const createSignedUploadUrl = vi.fn().mockResolvedValue({
      data: {
        signedUrl: 'https://storage.example/upload',
        token: 'token',
        path: 'ignored',
      },
      error: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });

    const supabase = {
      storage: {
        from: vi.fn(() => ({ createSignedUploadUrl })),
      },
      from: vi.fn((table: string) => {
        expect(table).toBe('storage_upload_intents');
        return { insert };
      }),
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
      expect(result.intent.mimeType).toBe('image/png');
      expect(result.intent.maxBytes).toBe(1024);
    }
    expect(createSignedUploadUrl).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the intent ledger insert fails', async () => {
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
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: { message: 'db' } }),
      })),
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

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(500);
      expect(result.message).not.toMatch(/db|stack|supabase/i);
    }
  });
});

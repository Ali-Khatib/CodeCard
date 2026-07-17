import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyStoredRasterImage } from './verify-stored-image';

function blobFrom(bytes: Uint8Array): Blob {
  return new Blob([Buffer.from(bytes)]);
}

describe('verifyStoredRasterImage', () => {
  it('accepts a PNG whose magic matches the declared MIME within size limits', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    const download = vi.fn().mockResolvedValue({ data: blobFrom(png), error: null });
    const supabase = {
      storage: { from: vi.fn(() => ({ download })) },
    } as unknown as SupabaseClient;

    const result = await verifyStoredRasterImage({
      supabase,
      bucket: 'avatars',
      path: 't/u/avatar/p/x.png',
      declaredMime: 'image/png',
      maxBytes: 1024,
    });

    expect(result).toEqual({ ok: true, detectedMime: 'image/png', size: png.length });
  });

  it('rejects HTML renamed as PNG and does not claim antivirus scanning', async () => {
    const html = new TextEncoder().encode('<!DOCTYPE html><html></html>');
    const download = vi.fn().mockResolvedValue({ data: blobFrom(html), error: null });
    const supabase = {
      storage: { from: vi.fn(() => ({ download })) },
    } as unknown as SupabaseClient;

    const result = await verifyStoredRasterImage({
      supabase,
      bucket: 'avatars',
      path: 't/u/avatar/p/x.png',
      declaredMime: 'image/png',
      maxBytes: 1024,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('active_content');
  });

  it('rejects oversized objects without trusting client size alone', async () => {
    const png = new Uint8Array(64);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    const download = vi.fn().mockResolvedValue({ data: blobFrom(png), error: null });
    const supabase = {
      storage: { from: vi.fn(() => ({ download })) },
    } as unknown as SupabaseClient;

    const result = await verifyStoredRasterImage({
      supabase,
      bucket: 'avatars',
      path: 't/u/avatar/p/x.png',
      declaredMime: 'image/png',
      maxBytes: 16,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('too_large');
  });
});

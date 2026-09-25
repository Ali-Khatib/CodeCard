import { describe, expect, it } from 'vitest';
import { isSafeRemoteImageUrl } from './safe-remote-image';

describe('isSafeRemoteImageUrl', () => {
  it('allows configured public image hosts', () => {
    expect(isSafeRemoteImageUrl('https://images.unsplash.com/photo-1')).toBe(true);
    expect(isSafeRemoteImageUrl('https://abc.supabase.co/storage/v1/object/public/avatars/a.png')).toBe(true);
  });

  it('rejects empty, local, and foreign hosts', () => {
    expect(isSafeRemoteImageUrl(null)).toBe(false);
    expect(isSafeRemoteImageUrl('http://images.unsplash.com/x')).toBe(false);
    expect(isSafeRemoteImageUrl('https://evil.example/avatar.png')).toBe(false);
    expect(isSafeRemoteImageUrl('https://127.0.0.1/secret')).toBe(false);
    expect(isSafeRemoteImageUrl('https://user:pass@images.unsplash.com/x')).toBe(false);
  });
});

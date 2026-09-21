import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseUrl, isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';

describe('isSupabasePublicKeyConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects placeholder audit env', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'placeholder-publishable-key');
    expect(isSupabasePublicKeyConfigured()).toBe(false);
  });

  it('accepts a real project URL and key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://zbumnudyvclkmynpqjsr.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_testkey');
    expect(isSupabasePublicKeyConfigured()).toBe(true);
  });

  it('strips trailing slashes from the project URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://zbumnudyvclkmynpqjsr.supabase.co/');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_testkey');
    expect(getSupabaseUrl()).toBe('https://zbumnudyvclkmynpqjsr.supabase.co');
  });
});

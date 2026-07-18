import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isCurrentAccountSuspended } from './suspension-guard';

describe('isCurrentAccountSuspended', () => {
  it('returns true only for an active subject suspension marker', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as unknown as SupabaseClient;

    await expect(isCurrentAccountSuspended(supabase)).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('is_current_account_suspended');
  });

  it('fails closed when the probe is unavailable', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'unavailable' } }),
    } as unknown as SupabaseClient;

    await expect(isCurrentAccountSuspended(supabase)).resolves.toBe(true);
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACCOUNT_STATUS_UNAVAILABLE_MESSAGE,
  ACCOUNT_SUSPENDED_MESSAGE,
  getCurrentAccountSuspensionStatus,
  getPublishBlockForSuspension,
  isCurrentAccountSuspended,
} from './suspension-guard';

describe('suspension-guard', () => {
  it('returns suspended only for an active subject suspension marker', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as unknown as SupabaseClient;

    await expect(getCurrentAccountSuspensionStatus(supabase)).resolves.toBe('suspended');
    await expect(isCurrentAccountSuspended(supabase)).resolves.toBe(true);
    await expect(getPublishBlockForSuspension(supabase)).resolves.toEqual({
      error: ACCOUNT_SUSPENDED_MESSAGE,
    });
    expect(supabase.rpc).toHaveBeenCalledWith('is_current_account_suspended');
  });

  it('returns clear when the probe says the account is not suspended', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    } as unknown as SupabaseClient;

    await expect(getCurrentAccountSuspensionStatus(supabase)).resolves.toBe('clear');
    await expect(isCurrentAccountSuspended(supabase)).resolves.toBe(false);
    await expect(getPublishBlockForSuspension(supabase)).resolves.toBeNull();
  });

  it('treats an unavailable probe as unknown without claiming suspension', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'unavailable' } }),
    } as unknown as SupabaseClient;

    await expect(getCurrentAccountSuspensionStatus(supabase)).resolves.toBe('unknown');
    await expect(isCurrentAccountSuspended(supabase)).resolves.toBe(false);
    await expect(getPublishBlockForSuspension(supabase)).resolves.toEqual({
      error: ACCOUNT_STATUS_UNAVAILABLE_MESSAGE,
    });
  });
});

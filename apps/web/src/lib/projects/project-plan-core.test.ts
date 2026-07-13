import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANS } from '@codecard/config';
import {
  countOwnedProjects,
  evaluateProjectCreationQuota,
  FREE_PROJECT_LIMIT_MESSAGE,
  getProjectLimitForPlan,
  resolveTenantPlanId,
} from './project-plan-core';

function createMockSupabase(options: {
  subscriptionStatus?: string | null;
  projectCount?: number;
  otherProfileCount?: number;
}) {
  const from = vi.fn((table: string) => {
    if (table === 'subscriptions') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: options.subscriptionStatus ? { status: options.subscriptionStatus } : null,
                error: null,
              }),
            })),
          })),
        })),
      };
    }

    if (table === 'projects') {
      return {
        select: vi.fn((_columns?: string, _opts?: unknown) => ({
          eq: vi.fn((column: string, value: string) => {
            if (column === 'profile_id' && value === 'other-profile') {
              return Promise.resolve({
                count: options.otherProfileCount ?? 0,
                error: null,
              });
            }
            return Promise.resolve({
              count: options.projectCount ?? 0,
              error: null,
            });
          }),
        })),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return { from } as unknown as SupabaseClient;
}

describe('getProjectLimitForPlan', () => {
  it('uses centralized plan limits', () => {
    expect(getProjectLimitForPlan('free')).toBe(PLANS.free.limits.projects);
    expect(getProjectLimitForPlan('pro')).toBeNull();
  });
});

describe('resolveTenantPlanId', () => {
  it('treats active subscriptions as pro', async () => {
    const supabase = createMockSupabase({ subscriptionStatus: 'active' });
    await expect(resolveTenantPlanId(supabase, 'tenant-1')).resolves.toBe('pro');
  });

  it('defaults to free without an active subscription', async () => {
    const supabase = createMockSupabase({ subscriptionStatus: null });
    await expect(resolveTenantPlanId(supabase, 'tenant-1')).resolves.toBe('free');
  });
});

describe('countOwnedProjects', () => {
  it('counts all owned projects for the profile', async () => {
    const supabase = createMockSupabase({ projectCount: 5 });
    await expect(countOwnedProjects(supabase, 'profile-1')).resolves.toBe(5);
  });
});

describe('evaluateProjectCreationQuota', () => {
  it('allows free users below the limit', async () => {
    const supabase = createMockSupabase({ projectCount: 4 });
    const result = await evaluateProjectCreationQuota(supabase, {
      tenantId: 'tenant-1',
      profileId: 'profile-1',
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.usage.count).toBe(4);
      expect(result.usage.limit).toBe(5);
    }
  });

  it('blocks the sixth project on the free plan', async () => {
    const supabase = createMockSupabase({ projectCount: 5 });
    const result = await evaluateProjectCreationQuota(supabase, {
      tenantId: 'tenant-1',
      profileId: 'profile-1',
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.error).toBe(FREE_PROJECT_LIMIT_MESSAGE);
      expect(result.upgradeTo).toBe('/dashboard/billing');
    }
  });

  it('does not count another profile projects', async () => {
    const supabase = createMockSupabase({ projectCount: 0, otherProfileCount: 10 });
    await expect(countOwnedProjects(supabase, 'other-profile')).resolves.toBe(10);
    await expect(countOwnedProjects(supabase, 'profile-1')).resolves.toBe(0);
  });

  it('allows unlimited projects on pro', async () => {
    const supabase = createMockSupabase({ subscriptionStatus: 'active', projectCount: 50 });
    const result = await evaluateProjectCreationQuota(supabase, {
      tenantId: 'tenant-1',
      profileId: 'profile-1',
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.usage.limit).toBeNull();
    }
  });
});

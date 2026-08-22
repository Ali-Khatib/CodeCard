import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANS } from '@codecard/config';
import {
  countOwnedProjects,
  evaluateProjectCreationQuota,
  FREE_PROJECT_LIMIT_MESSAGE,
  getProjectLimitForPlan,
  resolveTenantPlanId,
} from './project-plan-core';

const ORIGINAL = process.env.STRIPE_PRO_PRICE_ID;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STRIPE_PRO_PRICE_ID;
  else process.env.STRIPE_PRO_PRICE_ID = ORIGINAL;
});

function createMockSupabase(options: {
  subscriptionStatus?: string | null;
  stripePriceId?: string | null;
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
                data: options.subscriptionStatus
                  ? {
                      status: options.subscriptionStatus,
                      stripe_price_id: options.stripePriceId ?? null,
                    }
                  : null,
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
  it('treats active allowlisted subscriptions as pro', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    const supabase = createMockSupabase({
      subscriptionStatus: 'active',
      stripePriceId: 'price_pro_allowlisted',
    });
    await expect(resolveTenantPlanId(supabase, 'tenant-1')).resolves.toBe('pro');
  });

  it('denies pro for active subscriptions on an unknown price', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    const supabase = createMockSupabase({
      subscriptionStatus: 'active',
      stripePriceId: 'price_attacker',
    });
    await expect(resolveTenantPlanId(supabase, 'tenant-1')).resolves.toBe('free');
  });

  it('defaults to free without an active subscription', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
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
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    const supabase = createMockSupabase({
      subscriptionStatus: 'active',
      stripePriceId: 'price_pro_allowlisted',
      projectCount: 50,
    });
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

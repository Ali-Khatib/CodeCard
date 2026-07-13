import { PLANS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TenantPlanId = 'free' | 'pro';

export const FREE_PROJECT_LIMIT_MESSAGE = `You've reached the ${PLANS.free.limits.projects}-project limit on the Free plan.`;

export function getProjectLimitForPlan(planId: TenantPlanId): number | null {
  return PLANS[planId].limits.projects;
}

export async function resolveTenantPlanId(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<TenantPlanId> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  return data ? 'pro' : 'free';
}

export async function countOwnedProjects(
  supabase: SupabaseClient,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);

  if (error || count == null) {
    return 0;
  }

  return count;
}

export type ProjectCreationQuotaResult =
  | {
      allowed: true;
      planId: TenantPlanId;
      usage: { count: number; limit: number | null };
    }
  | {
      allowed: false;
      planId: TenantPlanId;
      usage: { count: number; limit: number };
      error: string;
      upgradeTo: string;
    };

export async function evaluateProjectCreationQuota(
  supabase: SupabaseClient,
  input: { tenantId: string; profileId: string },
): Promise<ProjectCreationQuotaResult> {
  const planId = await resolveTenantPlanId(supabase, input.tenantId);
  const limit = getProjectLimitForPlan(planId);
  const count = await countOwnedProjects(supabase, input.profileId);

  if (limit == null) {
    return {
      allowed: true,
      planId,
      usage: { count, limit: null },
    };
  }

  if (count >= limit) {
    return {
      allowed: false,
      planId,
      usage: { count, limit },
      error: FREE_PROJECT_LIMIT_MESSAGE,
      upgradeTo: '/dashboard/billing',
    };
  }

  return {
    allowed: true,
    planId,
    usage: { count, limit },
  };
}

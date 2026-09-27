/**
 * Plan gating for owner analytics.
 *
 * `PLANS.free` advertises "Basic analytics" while `PLANS.pro` advertises
 * "Visitor insights", "Per research paper analytics", and
 * "AI review of your analytics". The gate is applied to the aggregate BEFORE
 * it leaves the server, so a free-plan response never carries Pro-only rows
 * for the client to reveal. The review is derived on the client from fields
 * the owner already received.
 *
 * Source of truth is `resolveTenantPlanId` (the `subscriptions` table), the same
 * resolver the project quota uses. Never accept a plan from client input.
 */
import type { OwnerAnalyticsSummary } from '@/lib/dashboard/analytics-aggregate';
import type { TenantPlanId } from '@/lib/projects/project-plan-core';

/** Analytics sections that require a Pro entitlement. */
export const PRO_ANALYTICS_SECTIONS = [
  'visitorInsights',
  'perResearchPaper',
  'aiReview',
] as const;

export type ProAnalyticsSection = (typeof PRO_ANALYTICS_SECTIONS)[number];

export type AnalyticsEntitlement = {
  planId: TenantPlanId;
  /** Traffic-source breakdown ("How people reach you"). */
  visitorInsights: boolean;
  /** Per-paper research breakdown. Aggregate research totals stay on Free. */
  perResearchPaper: boolean;
  /** Plain-language review of the owner's numbers. */
  aiReview: boolean;
};

export function analyticsEntitlementFor(planId: TenantPlanId): AnalyticsEntitlement {
  const pro = planId === 'pro';
  return { planId, visitorInsights: pro, perResearchPaper: pro, aiReview: pro };
}

/**
 * Strips Pro-only aggregates from a summary when the plan does not grant them.
 * Returns a new object; the input is not mutated.
 */
export function applyAnalyticsEntitlement(
  summary: OwnerAnalyticsSummary,
  entitlement: AnalyticsEntitlement,
): OwnerAnalyticsSummary {
  return {
    ...summary,
    sources: entitlement.visitorInsights ? summary.sources : [],
    topResearch: entitlement.perResearchPaper ? summary.topResearch : [],
  };
}

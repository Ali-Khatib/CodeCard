/**
 * Plan gating for owner analytics.
 *
 * Free includes basic analytics and how people reached the card.
 * Pro adds per-project analytics, per-research analytics, and the AI review.
 * The gate
 * is applied to the aggregate BEFORE
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
  'perProject',
  'perResearchPaper',
  'aiReview',
] as const;

export type ProAnalyticsSection = (typeof PRO_ANALYTICS_SECTIONS)[number];

export type AnalyticsEntitlement = {
  planId: TenantPlanId;
  /** Traffic-source breakdown. Included on Free and Pro. */
  visitorInsights: boolean;
  /** Per-project breakdown. The project-views total stays on Free. */
  perProject: boolean;
  /** Per-paper research breakdown. Aggregate research totals stay on Free. */
  perResearchPaper: boolean;
  /** Plain-language review of the owner's numbers. */
  aiReview: boolean;
};

export function analyticsEntitlementFor(planId: TenantPlanId): AnalyticsEntitlement {
  const pro = planId === 'pro';
  return {
    planId,
    visitorInsights: true,
    perProject: pro,
    perResearchPaper: pro,
    aiReview: pro,
  };
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
    topProjects: entitlement.perProject ? summary.topProjects : [],
    topResearch: entitlement.perResearchPaper ? summary.topResearch : [],
  };
}

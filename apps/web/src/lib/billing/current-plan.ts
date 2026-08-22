import { PLANS } from '@codecard/config';
import { grantsProEntitlement } from '@/lib/billing/pro-price';

export type AccountPlanId = 'free' | 'pro';

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  return (
    status != null &&
    (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
  );
}

/**
 * Account plan for display / settings. Requires allowlisted Stripe price —
 * status alone must not grant Pro.
 */
export function resolveAccountPlanId(
  subscriptionStatus: string | null | undefined,
  stripePriceId?: string | null,
): AccountPlanId {
  return grantsProEntitlement(subscriptionStatus, stripePriceId) ? 'pro' : 'free';
}

export function formatCurrentPlanLabel(plan: AccountPlanId): string {
  if (plan === 'pro') {
    return `Pro · $${PLANS.pro.priceMonthly}/mo`;
  }
  return PLANS.free.name;
}

export function currentPlanHint(plan: AccountPlanId): string {
  return plan === 'pro' ? 'Renews monthly' : 'No charge. Upgrade anytime from Billing.';
}

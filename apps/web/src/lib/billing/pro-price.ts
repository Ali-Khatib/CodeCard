import { isPaidSubscriptionStatus } from '@/lib/billing/current-plan';

/** Server-configured CodeCard Pro Stripe price — never trust client-supplied IDs. */
export function getConfiguredProStripePriceId(): string | null {
  const id = process.env.STRIPE_PRO_PRICE_ID;
  if (!id || !id.startsWith('price_')) return null;
  return id;
}

export function isAllowlistedProStripePriceId(priceId: string | null | undefined): boolean {
  const configured = getConfiguredProStripePriceId();
  if (!configured || !priceId) return false;
  return priceId === configured;
}

/**
 * Pro entitlement requires an active/trialing subscription on the allowlisted price.
 * Active + unknown/wrong price must NOT grant Pro.
 */
export function grantsProEntitlement(
  status: string | null | undefined,
  stripePriceId: string | null | undefined,
): boolean {
  return isPaidSubscriptionStatus(status) && isAllowlistedProStripePriceId(stripePriceId);
}

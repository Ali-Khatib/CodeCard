import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { registerAccountDeletionCapability } from '@/lib/account/delete-capabilities';

/**
 * WS10-T006 — Stripe subscription cancellation during account deletion (server-only).
 *
 * Resolves billing state only from trusted local mappings + Stripe Admin API.
 * Never accepts customer ID, subscription ID, plan, or skip flags from the client.
 */

export const ACCOUNT_DELETION_CANCELLABLE_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
  'incomplete',
] as const;

export const ACCOUNT_DELETION_TERMINAL_STATUSES = ['canceled', 'incomplete_expired'] as const;

export type TrustedStripeCancellationContext = {
  authenticatedUserId: string;
  trustedOwnerUserId: string;
  tenantId: string;
  correlationId: string;
};

export type StripeCancellationResult =
  | {
      ok: true;
      outcome: 'no_customer' | 'no_cancellable_subscription' | 'canceled' | 'already_canceled';
      canceledSubscriptionIds: string[];
    }
  | {
      ok: false;
      reason:
        | 'target_mismatch'
        | 'stripe_unavailable'
        | 'inconsistent_mapping'
        | 'multiple_cancellable'
        | 'stripe_error'
        | 'local_update_failed';
    };

export function isStripeCancellationConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const key = env.STRIPE_SECRET_KEY?.trim() ?? '';
  return key.startsWith('sk_');
}

export function registerStripeCancellationCapability(
  env: NodeJS.ProcessEnv = process.env,
): void {
  registerAccountDeletionCapability({
    id: 'stripe_cancellation',
    label: 'Stripe subscription cancellation',
    isAvailable: () => isStripeCancellationConfigured(env),
  });
}

function isCancellableStatus(status: string): boolean {
  return (ACCOUNT_DELETION_CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

function isTerminalStatus(status: string): boolean {
  return (ACCOUNT_DELETION_TERMINAL_STATUSES as readonly string[]).includes(status);
}

function isStripeMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; statusCode?: number; message?: string; type?: string };
  if (e.code === 'resource_missing') return true;
  if (e.statusCode === 404) return true;
  const message = (e.message ?? '').toLowerCase();
  return message.includes('no such subscription') || message.includes('no such customer');
}

export function sanitizeStripeDeletionError(_error: unknown): string {
  return 'stripe_cancellation_error';
}

export function buildStripeCancelIdempotencyKey(
  correlationId: string,
  subscriptionId: string,
): string {
  return `account-delete-cancel:${correlationId}:${subscriptionId}`;
}

type StripeLike = {
  subscriptions: {
    list: (
      params: Stripe.SubscriptionListParams,
      options?: Stripe.RequestOptions,
    ) => Promise<Stripe.ApiList<Stripe.Subscription>>;
    cancel: (
      id: string,
      params?: Stripe.SubscriptionCancelParams,
      options?: Stripe.RequestOptions,
    ) => Promise<Stripe.Subscription>;
    retrieve: (
      id: string,
      params?: Stripe.SubscriptionRetrieveParams,
      options?: Stripe.RequestOptions,
    ) => Promise<Stripe.Subscription>;
  };
};

/**
 * Cancel cancellable Stripe subscriptions for the trusted account, then remove
 * local billing linkage so delayed webhooks cannot recreate deleted-account rows.
 */
export async function cancelTrustedAccountStripeSubscription(
  serviceSupabase: SupabaseClient,
  stripe: StripeLike,
  ctx: TrustedStripeCancellationContext,
): Promise<StripeCancellationResult> {
  if (ctx.authenticatedUserId !== ctx.trustedOwnerUserId) {
    return { ok: false, reason: 'target_mismatch' };
  }

  if (!isStripeCancellationConfigured()) {
    return { ok: false, reason: 'stripe_unavailable' };
  }

  const { data: customer, error: customerError } = await serviceSupabase
    .from('subscription_customers')
    .select('id, user_id, tenant_id, stripe_customer_id')
    .eq('user_id', ctx.trustedOwnerUserId)
    .maybeSingle();

  if (customerError) {
    return { ok: false, reason: 'local_update_failed' };
  }

  if (!customer) {
    return { ok: true, outcome: 'no_customer', canceledSubscriptionIds: [] };
  }

  if (customer.user_id !== ctx.trustedOwnerUserId || customer.tenant_id !== ctx.tenantId) {
    return { ok: false, reason: 'inconsistent_mapping' };
  }

  const stripeCustomerId = customer.stripe_customer_id as string;

  const { data: localSubs, error: localSubsError } = await serviceSupabase
    .from('subscriptions')
    .select('id, user_id, tenant_id, stripe_subscription_id, status')
    .eq('user_id', ctx.trustedOwnerUserId);

  if (localSubsError) {
    return { ok: false, reason: 'local_update_failed' };
  }

  const localCancellable = (localSubs ?? []).filter((row) =>
    isCancellableStatus(String(row.status)),
  );
  if (localCancellable.length > 1) {
    return { ok: false, reason: 'multiple_cancellable' };
  }

  let remoteSubs: Stripe.Subscription[];
  try {
    const listed = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 100,
    });
    remoteSubs = listed.data;
  } catch (error) {
    if (isStripeMissingError(error)) {
      await clearLocalBillingLinks(serviceSupabase, ctx.trustedOwnerUserId);
      return { ok: true, outcome: 'no_cancellable_subscription', canceledSubscriptionIds: [] };
    }
    void sanitizeStripeDeletionError(error);
    return { ok: false, reason: 'stripe_error' };
  }

  const remoteCancellable = remoteSubs.filter((sub) => isCancellableStatus(sub.status));
  if (remoteCancellable.length > 1) {
    return { ok: false, reason: 'multiple_cancellable' };
  }

  // Local claims cancellable but Stripe has none (or different) — fail closed on hard mismatch
  // when local points at a different subscription id than the sole remote cancellable.
  if (
    localCancellable.length === 1 &&
    remoteCancellable.length === 1 &&
    localCancellable[0].stripe_subscription_id !== remoteCancellable[0].id
  ) {
    return { ok: false, reason: 'inconsistent_mapping' };
  }

  const canceledSubscriptionIds: string[] = [];

  for (const sub of remoteCancellable) {
    try {
      await stripe.subscriptions.cancel(
        sub.id,
        {},
        {
          idempotencyKey: buildStripeCancelIdempotencyKey(ctx.correlationId, sub.id),
        },
      );
      canceledSubscriptionIds.push(sub.id);
    } catch (error) {
      if (isStripeMissingError(error)) {
        continue;
      }
      // Already canceled remotely during a race — treat as resolved for that id.
      const message = String((error as { message?: string })?.message ?? '').toLowerCase();
      if (message.includes('already been canceled') || message.includes('subscription is canceled')) {
        canceledSubscriptionIds.push(sub.id);
        continue;
      }
      void sanitizeStripeDeletionError(error);
      return { ok: false, reason: 'stripe_error' };
    }
  }

  // Also resolve any local cancellable rows whose remote object is already terminal/missing.
  for (const local of localCancellable) {
    const remote = remoteSubs.find((s) => s.id === local.stripe_subscription_id);
    if (!remote) {
      try {
        await stripe.subscriptions.retrieve(String(local.stripe_subscription_id));
      } catch (error) {
        if (!isStripeMissingError(error)) {
          void sanitizeStripeDeletionError(error);
          return { ok: false, reason: 'stripe_error' };
        }
      }
    } else if (!isTerminalStatus(remote.status) && !isCancellableStatus(remote.status)) {
      return { ok: false, reason: 'inconsistent_mapping' };
    }
  }

  const cleared = await clearLocalBillingLinks(serviceSupabase, ctx.trustedOwnerUserId);
  if (!cleared) {
    return { ok: false, reason: 'local_update_failed' };
  }

  if (canceledSubscriptionIds.length > 0) {
    return { ok: true, outcome: 'canceled', canceledSubscriptionIds };
  }

  const hadTerminal =
    remoteSubs.some((s) => isTerminalStatus(s.status)) ||
    (localSubs ?? []).some((s) => isTerminalStatus(String(s.status)));

  return {
    ok: true,
    outcome: hadTerminal ? 'already_canceled' : 'no_cancellable_subscription',
    canceledSubscriptionIds: [],
  };
}

async function clearLocalBillingLinks(
  serviceSupabase: SupabaseClient,
  ownerUserId: string,
): Promise<boolean> {
  const { error: subError } = await serviceSupabase
    .from('subscriptions')
    .delete()
    .eq('user_id', ownerUserId);
  if (subError) return false;

  const { error: customerError } = await serviceSupabase
    .from('subscription_customers')
    .delete()
    .eq('user_id', ownerUserId);
  if (customerError) return false;

  return true;
}

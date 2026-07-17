import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { BODY_LIMITS } from '@codecard/config';
import { apiError } from '@/lib/api-utils';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { requireServerSecret } from '@/lib/security/env';
import { readBodyWithLimit } from '@/lib/security/request';

type BillingEventStatus = 'processing' | 'completed' | 'failed';

type BillingEventRow = {
  id: string;
  stripe_event_id: string;
  status: BillingEventStatus;
  attempt_count: number;
};

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export type StripeWebhookDeps = {
  readBody?: typeof readBodyWithLimit;
  constructEvent?: (body: string, signature: string, secret: string) => Stripe.Event;
  getWebhookSecret?: () => string;
  getServiceClient?: () => Promise<ServiceClient>;
  nowIso?: () => string;
};

function uniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === '23505') return true;
  return /duplicate key|unique constraint/i.test(error.message ?? '');
}

function safePayload(event: Stripe.Event): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(event.data.object)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function markCompleted(
  supabase: ServiceClient,
  stripeEventId: string,
  nowIso: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const { error } = await supabase
    .from('billing_events')
    .update({
      status: 'completed',
      processed_at: nowIso,
      failure_code: null,
    })
    .eq('stripe_event_id', stripeEventId)
    .eq('status', 'processing');

  if (error) return { ok: false, code: 'mark_completed_failed' };
  return { ok: true };
}

async function markFailed(
  supabase: ServiceClient,
  stripeEventId: string,
  failureCode: string,
): Promise<void> {
  await supabase
    .from('billing_events')
    .update({
      status: 'failed',
      failure_code: failureCode,
      processed_at: null,
    })
    .eq('stripe_event_id', stripeEventId)
    .eq('status', 'processing');
}

async function claimEvent(
  supabase: ServiceClient,
  event: Stripe.Event,
): Promise<
  | { outcome: 'claimed' }
  | { outcome: 'duplicate_completed' }
  | { outcome: 'in_flight' }
  | { outcome: 'error'; code: string }
> {
  const { error: insertError } = await supabase.from('billing_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: 'processing',
    payload: safePayload(event),
    processed_at: null,
    attempt_count: 1,
    failure_code: null,
  });

  if (!insertError) return { outcome: 'claimed' };

  if (!uniqueViolation(insertError)) {
    return { outcome: 'error', code: 'event_claim_failed' };
  }

  const { data: existing, error: selectError } = await supabase
    .from('billing_events')
    .select('id, stripe_event_id, status, attempt_count')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (selectError || !existing) {
    return { outcome: 'error', code: 'event_lookup_failed' };
  }

  const row = existing as BillingEventRow;

  if (row.status === 'completed') {
    return { outcome: 'duplicate_completed' };
  }

  if (row.status === 'processing') {
    return { outcome: 'in_flight' };
  }

  // failed → reclaim for Stripe retry
  const nextAttempt = (row.attempt_count ?? 1) + 1;
  const { data: reclaimed, error: reclaimError } = await supabase
    .from('billing_events')
    .update({
      status: 'processing',
      failure_code: null,
      processed_at: null,
      attempt_count: nextAttempt,
      event_type: event.type,
      payload: safePayload(event),
    })
    .eq('stripe_event_id', event.id)
    .eq('status', 'failed')
    .select('id')
    .maybeSingle();

  if (reclaimError) {
    return { outcome: 'error', code: 'event_reclaim_failed' };
  }

  if (!reclaimed) {
    const { data: again } = await supabase
      .from('billing_events')
      .select('status')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (again?.status === 'completed') return { outcome: 'duplicate_completed' };
    return { outcome: 'in_flight' };
  }

  return { outcome: 'claimed' };
}

async function applySubscriptionSideEffects(
  supabase: ServiceClient,
  event: Stripe.Event,
): Promise<{ ok: true; skipped?: string } | { ok: false; code: string }> {
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const { data: customer, error: customerError } = await supabase
      .from('subscription_customers')
      .select('user_id, tenant_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (customerError) return { ok: false, code: 'customer_lookup_failed' };
    if (!customer) return { ok: true, skipped: 'no_customer' };

    // WS10-T006: do not recreate billing linkage for deleted / mid-deletion accounts.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('owner_user_id', customer.user_id)
      .maybeSingle();

    if (profileError) return { ok: false, code: 'profile_lookup_failed' };
    if (!profile) return { ok: true, skipped: 'no_profile' };

    const { error: upsertError } = await supabase.from('subscriptions').upsert(
      {
        tenant_id: customer.tenant_id,
        user_id: customer.user_id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id ?? '',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: 'stripe_subscription_id' },
    );

    if (upsertError) return { ok: false, code: 'subscription_upsert_failed' };
    return { ok: true };
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) return { ok: false, code: 'subscription_cancel_failed' };
    return { ok: true };
  }

  return { ok: true, skipped: 'unsupported_event' };
}

/**
 * Stripe webhook handler: raw body → signature verify → durable claim → side effects → complete.
 * Logs must never include the webhook secret or raw body.
 */
export async function processStripeWebhookRequest(
  request: Request,
  deps: StripeWebhookDeps = {},
): Promise<NextResponse> {
  const readBody = deps.readBody ?? readBodyWithLimit;
  const bodyResult = await readBody(request, BODY_LIMITS.webhook);
  if (!bodyResult.ok) return bodyResult.response;

  const signature = request.headers.get('stripe-signature');
  if (!signature) return apiError('Missing signature', 400);

  const getWebhookSecret = deps.getWebhookSecret ?? (() => requireServerSecret('STRIPE_WEBHOOK_SECRET'));
  const constructEvent =
    deps.constructEvent ??
    ((body, sig, secret) => getStripe().webhooks.constructEvent(body, sig, secret));

  let event: Stripe.Event;
  try {
    event = constructEvent(bodyResult.text, signature, getWebhookSecret());
  } catch {
    return apiError('Invalid signature', 400);
  }

  const getServiceClient = deps.getServiceClient ?? createServiceClient;
  const nowIso = (deps.nowIso ?? (() => new Date().toISOString()))();

  let supabase: ServiceClient;
  try {
    supabase = await getServiceClient();
  } catch {
    return apiError('Webhook processing failed', 500);
  }

  const claim = await claimEvent(supabase, event);
  if (claim.outcome === 'duplicate_completed') {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (claim.outcome === 'in_flight') {
    return apiError('Webhook already processing', 409);
  }
  if (claim.outcome === 'error') {
    return apiError('Webhook processing failed', 500);
  }

  const effects = await applySubscriptionSideEffects(supabase, event);
  if (!effects.ok) {
    await markFailed(supabase, event.id, effects.code);
    return apiError('Webhook processing failed', 500);
  }

  const completed = await markCompleted(supabase, event.id, nowIso);
  if (!completed.ok) {
    await markFailed(supabase, event.id, completed.code);
    return apiError('Webhook processing failed', 500);
  }

  if (effects.skipped === 'no_profile') {
    return NextResponse.json({ received: true, skipped: 'no_profile' });
  }
  if (effects.skipped === 'no_customer') {
    return NextResponse.json({ received: true, skipped: 'no_customer' });
  }
  if (effects.skipped === 'unsupported_event') {
    return NextResponse.json({ received: true, ignored: true });
  }

  return NextResponse.json({ received: true });
}

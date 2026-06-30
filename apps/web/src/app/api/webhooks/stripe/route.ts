import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { requireServerSecret } from '@/lib/security/env';
import { readBodyWithLimit } from '@/lib/security/request';
import { BODY_LIMITS } from '@codecard/config';
import { apiError } from '@/lib/api-utils';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const bodyResult = await readBodyWithLimit(request, BODY_LIMITS.webhook);
  if (!bodyResult.ok) return bodyResult.response;

  const signature = request.headers.get('stripe-signature');
  if (!signature) return apiError('Missing signature', 400);

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      bodyResult.text,
      signature,
      requireServerSecret('STRIPE_WEBHOOK_SECRET'),
    );
  } catch {
    return apiError('Invalid signature', 400);
  }

  const supabase = await createServiceClient();

  const { data: existing } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase.from('billing_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: JSON.parse(JSON.stringify(event.data.object)),
  });

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.created'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const { data: customer } = await supabase
      .from('subscription_customers')
      .select('user_id, tenant_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (customer) {
      await supabase.from('subscriptions').upsert(
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
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);
  }

  return NextResponse.json({ received: true });
}

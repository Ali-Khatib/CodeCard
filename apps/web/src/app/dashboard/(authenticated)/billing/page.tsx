import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { PLANS } from '@codecard/config';
import { grantsProEntitlement } from '@/lib/billing/pro-price';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, stripe_price_id, current_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  const isPro = grantsProEntitlement(subscription?.status, subscription?.stripe_price_id);

  async function createCheckout() {
    'use server';
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let checkoutUrl: string | null = null;
    try {
      const stripe = getStripe();
      const { data: existingCustomer } = await supabase
        .from('subscription_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let stripeCustomerId = existingCustomer?.stripe_customer_id;

      if (!stripeCustomerId) {
        const stripeCustomer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        stripeCustomerId = stripeCustomer.id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('owner_user_id', user.id)
          .single();

        await supabase.from('subscription_customers').insert({
          tenant_id: profile?.tenant_id,
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) return;

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
        success_url: `${appUrl}/dashboard/billing?success=true`,
        cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      });
      checkoutUrl = session.url;
    } catch {
      redirect('/dashboard/billing?error=billing');
    }

    if (!checkoutUrl) {
      redirect('/dashboard/billing?error=billing');
    }
    redirect(checkoutUrl);
  }

  async function openPortal() {
    'use server';
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let portalUrl: string | null = null;
    try {
      const { data: ownedCustomer } = await supabase
        .from('subscription_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!ownedCustomer?.stripe_customer_id) return;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) return;

      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: ownedCustomer.stripe_customer_id,
        return_url: `${appUrl}/dashboard/billing`,
      });
      portalUrl = session.url;
    } catch {
      redirect('/dashboard/billing?error=billing');
    }

    if (!portalUrl) {
      redirect('/dashboard/billing?error=billing');
    }
    redirect(portalUrl);
  }

  return (
    <div className="cc-app-page cc-app-page--1040">
      <header className="cc-app-page-header">
        <div className="cc-app-page-header__copy">
          <p className="cc-app-mono">Billing</p>
          <h1 className="cc-app-title">Subscription</h1>
          <p className="cc-app-subtitle">
            Manage your plan. Pro unlocks deeper analytics and advanced workspace tools.
          </p>
        </div>
      </header>

      <section className="cc-app-card space-y-5">
        <div>
          <p className="cc-app-metric__label">Current plan</p>
          {isPro && subscription ? (
            <>
              <p className="mt-2 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
                Pro
              </p>
              <p className="mt-2 text-[15px] text-[var(--app-muted)]">
                Active · renews{' '}
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'N/A'}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
                Free
              </p>
              <p className="mt-2 text-[15px] text-[var(--app-muted)]">
                Upgrade for ${PLANS.pro.priceMonthly}/mo when you need the full analytics suite.
              </p>
            </>
          )}
        </div>

        {isPro && subscription ? (
          <form action={openPortal}>
            <button type="submit" className="cc-app-btn cc-app-btn--ghost">
              Manage subscription
            </button>
          </form>
        ) : (
          <form action={createCheckout}>
            <button type="submit" className="cc-app-btn cc-app-btn--primary">
              Upgrade · ${PLANS.pro.priceMonthly}/mo
            </button>
          </form>
        )}
      </section>

      <p className="text-[14px] leading-relaxed text-[var(--app-muted)]">
        Cancel anytime via the customer portal. You keep access through the end of your billing period.
      </p>

      <Link
        href="/dashboard/settings"
        className="inline-flex text-[14px] font-medium text-[var(--app-ink)] underline-offset-2 hover:underline"
      >
        ← Back to settings
      </Link>
    </div>
  );
}

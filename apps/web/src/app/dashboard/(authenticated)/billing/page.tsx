import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { PLANS } from '@codecard/config';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@codecard/ui';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const { data: customer } = await supabase
    .from('subscription_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Billing</p>
        <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Subscription</h1>
      </div>

      <Card className="border-border/40 bg-midnight/50">
        <CardHeader>
          <CardTitle className="font-display text-phosphor">Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <p className="text-reactor">Pro (Active)</p>
              <p className="text-sm text-lichen">
                Renews{' '}
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'N/A'}
              </p>
              <form action={openPortal}>
                <Button type="submit" variant="outline">
                  Manage subscription
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-lichen">You&apos;re on the Free plan.</p>
              <form action={createCheckout}>
                <Button type="submit">Upgrade to Pro (${PLANS.pro.priceMonthly}/mo)</Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-graphite">
        Cancel anytime via the customer portal. You will retain access through the end of your billing
        period.
      </p>

      <Link href="/dashboard/settings" className="text-[14px] text-graphite hover:text-phosphor">
        ← Back to settings
      </Link>
    </div>
  );
}

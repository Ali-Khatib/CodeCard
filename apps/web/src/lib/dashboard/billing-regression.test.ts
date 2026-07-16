import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T009 billing regression verification', () => {
  it('keeps checkout and portal server-resolved and auth-gated', () => {
    const page = read('src/app/dashboard/(authenticated)/billing/page.tsx');
    const stripe = read('src/lib/stripe.ts');
    const webhook = read('src/app/api/webhooks/stripe/route.ts');

    expect(page).toContain("redirect('/sign-in')");
    expect(page).toContain("eq('user_id', user.id)");
    expect(page).toContain('createCheckout');
    expect(page).toContain('openPortal');
    expect(page).toContain("'use server'");
    expect(page).toContain('await supabase.auth.getUser()');
    expect(page).toContain('billingPortal.sessions.create');
    expect(page).toContain('checkout.sessions.create');
    expect(page).toContain('STRIPE_PRO_PRICE_ID');
    expect(page).toContain('NEXT_PUBLIC_APP_URL');
    expect(page).not.toContain('sk_live');
    expect(page).not.toContain('sk_test');
    expect(page).not.toContain('whsec_');

    // Portal/checkout must re-resolve the authenticated user's customer — not trust a closed-over id.
    expect(page).toMatch(/openPortal[\s\S]*eq\('user_id', user\.id\)/);
    expect(page).toMatch(/createCheckout[\s\S]*eq\('user_id', user\.id\)/);

    expect(stripe).toContain("requireServerSecret('STRIPE_SECRET_KEY')");
    expect(stripe).not.toContain('NEXT_PUBLIC_STRIPE_SECRET');

    expect(webhook).toContain("requireServerSecret('STRIPE_WEBHOOK_SECRET')");
    expect(webhook).toContain('constructEvent');
    expect(webhook).toContain('stripe-signature');
    expect(webhook).toContain('billing_events');
    expect(webhook).toContain('duplicate');
    expect(webhook).toContain('Invalid signature');
  });

  it('does not expose Stripe secrets in client dashboard surfaces', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const settings = read('src/app/dashboard/(authenticated)/settings/page.tsx');

    expect(shell).not.toContain('STRIPE_SECRET_KEY');
    expect(shell).not.toContain('STRIPE_WEBHOOK_SECRET');
    expect(settings).not.toContain('STRIPE_SECRET_KEY');
    expect(settings).not.toContain('STRIPE_WEBHOOK_SECRET');
  });
});

import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Subscription Terms' };

export default function SubscriptionTermsPage() {
  return (
    <LegalPage title="Subscription & Billing Terms" lastUpdated="June 27, 2025">
      <section>
        <h2>Pricing</h2>
        <p>
          Pro plan pricing is displayed on our pricing page before checkout. Prices are in USD and
          billed monthly unless otherwise stated. Taxes may apply based on your location.
        </p>
      </section>
      <section>
        <h2>Free trial</h2>
        <p>
          If a free trial is offered, the trial length and what happens when it ends will be shown
          at signup. You will not be charged until the trial ends unless you upgrade during the
          trial with explicit confirmation.
        </p>
      </section>
      <section>
        <h2>Renewal & cancellation</h2>
        <p>
          Subscriptions renew automatically each billing period. You may cancel at any time through
          the Stripe Customer Portal (linked from your billing settings). Cancellation takes effect
          at the end of the current paid period. You retain access until then. We do not offer
          prorated refunds for partial months unless required by applicable law.
        </p>
      </section>
      <section>
        <h2>Payment method</h2>
        <p>
          Payments are processed by Stripe. We do not store full card numbers on our servers. Failed
          payments may result in service downgrade after a grace period.
        </p>
      </section>
      <section>
        <h2>Mobile app</h2>
        <p>
          Subscriptions are purchased on the web only. The mobile app does not offer in-app purchases
          for digital subscriptions in v1.
        </p>
      </section>
      <section>
        <h2>Changes to pricing</h2>
        <p>
          We may change subscription prices with at least 30 days notice to existing subscribers.
          Continued use after the effective date constitutes acceptance of the new price.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Billing questions: billing@codecard.app
        </p>
      </section>
    </LegalPage>
  );
}

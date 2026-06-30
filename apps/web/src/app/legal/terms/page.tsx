import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="June 27, 2025">
      <section>
        <h2>Agreement</h2>
        <p>
          By using CodeCard, you agree to these terms. If you do not agree, do not use the
          service.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          You are responsible for your account credentials and all activity under your account.
          You must provide accurate information and keep it updated.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          You retain ownership of content you upload. You grant CodeCard a license to host, display,
          and distribute your public profile content as necessary to operate the service.
        </p>
      </section>
      <section>
        <h2>Subscriptions</h2>
        <p>
          Paid plans are billed monthly through Stripe. Pricing and features are shown at checkout.
          You may cancel anytime through the customer portal. Access continues through the end of
          the paid period.
        </p>
      </section>
      <section>
        <h2>Termination</h2>
        <p>
          We may suspend or terminate accounts that violate our Acceptable Use Policy. You may
          delete your account at any time by contacting support.
        </p>
      </section>
      <section>
        <h2>Disclaimer</h2>
        <p>
          CodeCard is provided &quot;as is&quot; without warranties. We are not liable for
          indirect or consequential damages to the extent permitted by law.
        </p>
      </section>
    </LegalPage>
  );
}

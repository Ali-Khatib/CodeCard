import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/contact',
  title: 'Contact',
  description: 'Contact CodeCard for product, privacy, and copyright questions.',
});

export default function ContactPage() {
  return (
    <LegalPage title="Contact" lastUpdated="August 25, 2026">
      <section>
        <h2>Support and general inquiries</h2>
        <p>
          <a href="mailto:hello@codecard.app">hello@codecard.app</a>
        </p>
        <p>
          For account problems, bugs, or questions about how something works. Include the email
          address on your account so we can find it. We aim to reply within two business days.
        </p>
      </section>
      <section>
        <h2>Privacy requests</h2>
        <p>
          <a href="mailto:privacy@codecard.app">privacy@codecard.app</a>
        </p>
        <p>
          For data access, correction, or deletion requests. You can also export or delete your
          account yourself from Settings without contacting us. We respond within 30 days.
        </p>
      </section>
      <section>
        <h2>Billing</h2>
        <p>
          <a href="mailto:billing@codecard.app">billing@codecard.app</a>
        </p>
        <p>For subscription, invoice, and refund questions.</p>
      </section>
      <section>
        <h2>DMCA / copyright</h2>
        <p>
          <a href="mailto:dmca@codecard.app">dmca@codecard.app</a>
        </p>
        <p>
          Our <Link href="/legal/dmca">DMCA policy</Link> lists everything a valid notice must
          include.
        </p>
      </section>
      <section>
        <h2>Mailing address</h2>
        <p>
          For postal correspondence, email{' '}
          <a href="mailto:hello@codecard.app">hello@codecard.app</a> and we will provide a current
          mailing address.
        </p>
      </section>
    </LegalPage>
  );
}

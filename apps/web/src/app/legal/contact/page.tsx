import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import {
  BILLING_INBOX,
  COPYRIGHT_INBOX,
  LEGAL_LAST_UPDATED,
  PRIVACY_INBOX,
  SUPPORT_INBOX,
} from '@/lib/legal/constants';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/contact',
  title: 'Contact',
  description: 'Contact CodeCard for product, privacy, and copyright questions.',
});

export default function ContactPage() {
  return (
    <LegalPage title="Contact" lastUpdated={LEGAL_LAST_UPDATED}>
      <section>
        <h2>Support and general inquiries</h2>
        <p>
          <a href={`mailto:${SUPPORT_INBOX}`}>{SUPPORT_INBOX}</a>
        </p>
        <p>
          For account problems, bugs, or questions about how something works. Include the email
          address on your account so we can find it. We aim to reply within two business days.
        </p>
      </section>
      <section>
        <h2>Privacy requests</h2>
        <p>
          <a href={`mailto:${PRIVACY_INBOX}`}>{PRIVACY_INBOX}</a>
        </p>
        <p>
          For data access, correction, or deletion requests. You can also export or delete your
          account yourself from Settings without contacting us. We respond within 30 days.
        </p>
      </section>
      <section>
        <h2>Billing</h2>
        <p>
          <a href={`mailto:${BILLING_INBOX}`}>{BILLING_INBOX}</a>
        </p>
        <p>For subscription, invoice, and refund questions.</p>
      </section>
      <section>
        <h2>DMCA / copyright</h2>
        <p>
          <a href={`mailto:${COPYRIGHT_INBOX}`}>{COPYRIGHT_INBOX}</a>
        </p>
        <p>
          Our <Link href="/legal/dmca">copyright policy</Link> lists what a notice should
          include. Reports are reviewed; content is not deleted automatically.
        </p>
      </section>
      <section>
        <h2>Security reports</h2>
        <p>
          <a href={`mailto:${SUPPORT_INBOX}`}>{SUPPORT_INBOX}</a>
        </p>
        <p>
          For vulnerability reports, use the subject line “Security report”. Guidance is on the{' '}
          <Link href="/legal/security">security page</Link>. There is no separate published
          security mailbox yet.
        </p>
      </section>
      <section>
        <h2>Mailing address</h2>
        <p>
          For postal correspondence, email{' '}
          <a href={`mailto:${SUPPORT_INBOX}`}>{SUPPORT_INBOX}</a> and we will provide a current
          mailing address.
        </p>
      </section>
    </LegalPage>
  );
}

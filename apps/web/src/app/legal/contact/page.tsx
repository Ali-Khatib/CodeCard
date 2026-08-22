import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/contact',
  title: 'Contact',
  description: 'Contact CodeCard for product, privacy, and copyright questions.',
});

export default function ContactPage() {
  return (
    <LegalPage title="Contact" lastUpdated="June 27, 2025">
      <section>
        <h2>General inquiries</h2>
        <p>hello@codecard.app</p>
      </section>
      <section>
        <h2>Privacy requests</h2>
        <p>privacy@codecard.app</p>
      </section>
      <section>
        <h2>DMCA / copyright</h2>
        <p>dmca@codecard.app</p>
      </section>
      <section>
        <h2>Mailing address</h2>
        <p>
          For postal correspondence, email hello@codecard.app and we will provide a current mailing
          address.
        </p>
      </section>
    </LegalPage>
  );
}

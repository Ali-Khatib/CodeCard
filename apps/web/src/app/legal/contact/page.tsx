import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Contact' };

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
          CodeCard, Inc.
          <br />
          [Physical address placeholder. Update before launch]
        </p>
      </section>
    </LegalPage>
  );
}

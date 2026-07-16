import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 16, 2026">
      <section>
        <h2>What we collect</h2>
        <p>
          When you create a CodeCard account, we collect your email address, display name, and
          profile information you choose to provide. When visitors view your public profile, we
          collect basic first-party analytics such as event type, approximate referrer or traffic
          source category, opaque session identifiers used for duplicate suppression, and optional
          non-identifying metadata (for example time spent). We do not use device fingerprinting.
          We do not intentionally store full visitor User-Agent strings in analytics records.
          Hosting and rate-limiting infrastructure may process network metadata such as IP addresses
          transiently to operate the service; those values are not product analytics columns.
        </p>
      </section>
      <section>
        <h2>Why we collect it</h2>
        <p>
          We use this data to operate your profile, authenticate you, process subscriptions,
          provide analytics to profile owners, and improve the product. We do not sell your personal
          data.
        </p>
      </section>
      <section>
        <h2>Where data is stored</h2>
        <p>
          Data is stored in Supabase (PostgreSQL) and Supabase Storage, hosted in the United
          States. Payment data is processed by Stripe. We do not store full card numbers.
        </p>
      </section>
      <section>
        <h2>Third-party processors</h2>
        <ul>
          <li>Supabase: database, auth, file storage</li>
          <li>Stripe: payment processing</li>
          <li>Vercel: web hosting and performance monitoring</li>
          <li>Sentry: error monitoring</li>
          <li>Upstash: rate limiting</li>
        </ul>
      </section>
      <section>
        <h2>Retention</h2>
        <p>
          We retain your account data while your account is active. You may request deletion by
          contacting us. Raw analytics events are retained for up to 90 days from the server
          timestamp when they were recorded, then deleted during the next cleanup cycle. Owner
          analytics dashboards currently summarize those raw events, so older history is not kept
          as a separate lifetime aggregate store. Billing, audit, moderation, and security records
          follow separate retention rules. Account deletion workflows may remove owner-linked
          analytics earlier than the 90-day maximum once that deletion process is available.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You may access, correct, or delete your personal data. Contact us at
          privacy@codecard.app. We will respond within 30 days.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>
          We use industry-standard measures including encryption in transit, row-level security on
          database tables, and access controls. No system is perfectly secure.
        </p>
      </section>
    </LegalPage>
  );
}

import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="June 27, 2025">
      <section>
        <h2>What we collect</h2>
        <p>
          When you create a CodeCard account, we collect your email address, display name, and
          profile information you choose to provide. When visitors view your public profile, we
          collect basic analytics such as view counts, referrer, and session identifiers, not
          personally identifiable information about visitors unless they create an account.
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
          contacting us. Analytics events are retained for 12 months.
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

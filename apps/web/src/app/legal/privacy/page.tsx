import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 17, 2026">
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
        <h2>Data export</h2>
        <p>
          Authenticated account owners can download an in-app copy of their approved account data
          through Settings. The export is a structured JSON file. It includes your profile and
          links, projects and research metadata, an analytics summary, and other owner-scoped
          records we support for export.
        </p>
        <p>
          The export does not include other people&apos;s private data, payment card numbers,
          Stripe customer identifiers, internal security logs, raw analytics event streams, or
          secret credentials. Media and file objects are not packaged as a ZIP or binary archive;
          when files are referenced, the export includes metadata and public URLs or external
          links already stored on your account, not a bulk download of hosted file bytes.
        </p>
      </section>
      <section>
        <h2>Account deletion</h2>
        <p>
          Authenticated account owners can request account deletion through the in-app account
          controls in Settings. Deletion requires that you are signed in, confirm with the exact
          word DELETE, and complete recent reauthentication (password verification or a recent
          interactive sign-in, depending on how you sign in).
        </p>
        <p>
          When deletion runs successfully, we cancel an active or cancellable Stripe subscription
          linked to your account (or confirm that none exists), remove your profile content and
          related storage according to our deletion process, and remove or anonymize owner-linked
          analytics so retained events are no longer tied to your account. A minimal privacy-safe
          deletion record may be kept for operational integrity. Billing, moderation, security, or
          similar records may be retained or anonymized when needed to operate the service or meet
          legal obligations.
        </p>
        <p>
          Some cleanup steps, such as removing stored files, may finish asynchronously after the
          request succeeds. Deletion may be temporarily unavailable when required safety checks or
          configuration are missing; in that case the account is not changed. After a successful
          deletion, access to the account is permanently removed.
        </p>
      </section>
      <section>
        <h2>Retention</h2>
        <p>
          We retain your account data while your account is active. Raw analytics events are
          retained for up to 90 days from the server timestamp when they were recorded, then
          deleted during the next cleanup cycle. Owner analytics dashboards currently summarize
          those raw events, so older history is not kept as a separate lifetime aggregate store.
        </p>
        <p>
          Deletion and anonymization are different. Deletion removes content you created. Where
          full deletion is not appropriate, we may strip identifying links and keep limited
          non-identifying or operational records. Billing, audit, moderation, and security records
          follow separate retention rules. Account deletion may remove or anonymize owner-linked
          analytics earlier than the 90-day maximum. We do not claim that every historical database
          row disappears instantly from every backup or operational system.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You may access, correct, or delete your personal data using the in-app controls described
          above, or by contacting us at privacy@codecard.app. We will respond within 30 days.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>
          We use industry-standard measures including encryption in transit, row-level security on
          database tables, and access controls. No system is perfectly secure.
        </p>
      </section>
      <section>
        <h2>About this policy</h2>
        <p>
          This page describes current product behavior for CodeCard. Technical/product copy
          alignment completed — attorney review pending.
        </p>
      </section>
    </LegalPage>
  );
}

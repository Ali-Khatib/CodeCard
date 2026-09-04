import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import {
  LEGAL_LAST_UPDATED,
  MINIMUM_ACCOUNT_AGE_YEARS,
} from '@/lib/legal/constants';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/privacy',
  title: 'Privacy Policy',
  description:
    'How CodeCard collects, uses, stores, and protects account, profile, upload, and analytics data.',
});

const TOC = [
  { href: '#what-we-collect', label: 'What we collect' },
  { href: '#why-we-collect-it', label: 'Why we collect it' },
  { href: '#public-profiles', label: 'Public profile information' },
  { href: '#github', label: 'Signing in with GitHub' },
  { href: '#cookies', label: 'Cookies and local storage' },
  { href: '#analytics', label: 'Analytics and error monitoring' },
  { href: '#payments', label: 'Payments' },
  { href: '#processors', label: 'Third-party processors' },
  { href: '#ai', label: 'AI features' },
  { href: '#export', label: 'Data export' },
  { href: '#deletion', label: 'Account deletion' },
  { href: '#retention', label: 'Retention' },
  { href: '#children', label: 'Children' },
  { href: '#rights', label: 'Your rights' },
  { href: '#security', label: 'Security' },
  { href: '#transfers', label: 'International transfers' },
  { href: '#updates', label: 'Policy updates' },
  { href: '#about', label: 'About this policy' },
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED} toc={TOC}>
      <section>
        <h2 id="what-we-collect">What we collect</h2>
        <p>
          When you create a CodeCard account, we collect your email address, display name, and
          profile information you choose to provide. That can include a headline, bio, location,
          skills, profile photo, public links, projects, research entries, and files you upload to
          those records.
        </p>
        <p>
          When visitors view your public profile, we collect basic first-party analytics such as
          event type, approximate referrer or traffic source category, opaque session identifiers
          used for duplicate suppression, and optional non-identifying metadata (for example time
          spent). We do not use device fingerprinting. We do not intentionally store full visitor
          User-Agent strings in analytics records. Hosting and rate-limiting infrastructure may
          process network metadata such as IP addresses transiently to operate the service; those
          values are not product analytics columns.
        </p>
        <p>
          We do not collect biometric identifiers such as Face ID or face templates. We do not
          collect payment card numbers. We do not send promotional or marketing email campaigns
          today, so we do not store a separate marketing-consent record.
        </p>
      </section>
      <section>
        <h2 id="why-we-collect-it">Why we collect it</h2>
        <p>
          We use this data to operate your profile, authenticate you, process subscriptions,
          provide analytics to profile owners, and improve the product. We do not sell your personal
          data. We do not collect information merely because it might be useful later.
        </p>
      </section>
      <section>
        <h2 id="public-profiles">Public profile information</h2>
        <p>
          If you publish a CodeCard, selected profile fields are intentionally public: display name,
          photo, bio, location, links you add, and published projects or research. Email addresses,
          authentication metadata, billing identifiers, OAuth tokens, private notes, collections,
          and owner analytics are not part of the public profile response.
        </p>
        <p>
          Search engines may index public profiles. You can keep a profile unpublished from
          Settings. Unpublishing does not retroactively remove copies that others already saved.
        </p>
      </section>
      <section>
        <h2 id="github">Signing in with GitHub</h2>
        <p>
          You can create an account or sign in with GitHub instead of a password. When you do,
          GitHub asks you to authorize CodeCard and then returns basic account information such as
          your email address and account name to our authentication provider, Supabase. We use it
          only to identify your account and create your profile.
        </p>
        <p>
          We request no repository, organization, or code access, and we do not read your
          repositories. The GitHub scopes CodeCard requests are limited to reading your public
          GitHub profile and email address. We do not store your GitHub access token for later use,
          and we do not act on GitHub on your behalf. You can disconnect GitHub from Settings when
          another sign-in method exists, or revoke CodeCard&apos;s access at any time from your
          GitHub account settings; revoking it removes the sign-in method, not your CodeCard
          account, which you can delete separately using the controls described below. Google is
          not offered as an MVP sign-in option even though the auth stack could support it later.
        </p>
      </section>
      <section>
        <h2 id="cookies">Cookies and local storage</h2>
        <p>
          We use cookies that are necessary to run the service. After you sign in, our
          authentication provider sets a session cookie so you stay signed in between page loads
          and can reach your dashboard; signing out clears it. During sign-in we also use a
          short-lived cookie to complete the login exchange securely.
        </p>
        <p>
          Your browser&apos;s local storage holds display preferences such as your selected theme
          and light or dark appearance, so the page renders correctly before scripts finish
          loading. Session storage holds short-lived UI state on this device only, such as whether
          a visitor conversion prompt was already shown in the tab, a copied-link flag, and
          scroll restoration. These preferences stay on your device.
        </p>
        <p>
          We do not use advertising cookies, cross-site tracking cookies, or third-party
          advertising networks. See the <Link href="/legal/cookies">Cookies page</Link> for a
          classification of what CodeCard actually uses.
        </p>
      </section>
      <section>
        <h2 id="analytics">Analytics and error monitoring</h2>
        <p>
          Profile owners can see first-party analytics about public profile activity. Those events
          are stored in CodeCard&apos;s database and are not advertising pixels. Events use
          allowlisted identifiers such as profile or project IDs rather than dumping entire objects.
        </p>
        <p>
          Vercel Web Analytics and Speed Insights load after the page is idle. They are first-party
          performance and usage measurements for operating the site (for example Core Web Vitals),
          not advertising trackers. Sentry receives error reports so we can fix crashes. We configure
          those tools to avoid sending passwords, access tokens, or full form submissions.
        </p>
      </section>
      <section>
        <h2 id="payments">Payments</h2>
        <p>
          Paid plans are processed by Stripe. CodeCard stores a local subscription status and a
          Stripe customer mapping so we can show your plan and open the customer portal. We do not
          store full card numbers.
        </p>
      </section>
      <section>
        <h2 id="where">Where data is stored</h2>
        <p>
          Data is stored in Supabase (PostgreSQL) and Supabase Storage, hosted in the United
          States. Payment data is processed by Stripe. We do not store full card numbers.
        </p>
      </section>
      <section>
        <h2 id="processors">Third-party processors</h2>
        <p>
          CodeCard uses the following processors to operate the product. We list only services the
          application actually initializes:
        </p>
        <ul>
          <li>Supabase: database, auth, file storage</li>
          <li>GitHub: optional sign-in provider, only if you choose it</li>
          <li>Stripe: payment processing</li>
          <li>Vercel: web hosting and performance monitoring</li>
          <li>Sentry: error monitoring</li>
          <li>Upstash: rate limiting</li>
        </ul>
        <p>
          Google is not offered as an MVP sign-in button. QR codes for sharing and lanyard
          badges are generated locally in the browser; CodeCard does not send profile URLs to a
          third-party QR API.
        </p>
        <p>
          Email used for account verification, password reset, and similar transactional messages
          is sent through our authentication provider. CodeCard does not currently operate a
          separate marketing-email list.
        </p>
      </section>
      <section>
        <h2 id="ai">AI features</h2>
        <p>
          CodeCard does not currently send your profile content, uploads, or private account data
          to a generative AI provider. If that changes, this policy will be updated to describe
          what is sent, why, and whether the provider may retain it. We do not claim that any
          AI-generated text would be accurate, complete, or legally sufficient.
        </p>
      </section>
      <section>
        <h2 id="export">Data export</h2>
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
        <h2 id="deletion">Account deletion</h2>
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
        <h2 id="retention">Retention</h2>
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
        <h2 id="children">Children</h2>
        <p>
          CodeCard is a professional profile product for developers and researchers. It is not
          directed at children under {MINIMUM_ACCOUNT_AGE_YEARS}. We do not knowingly collect
          personal information from children under {MINIMUM_ACCOUNT_AGE_YEARS}. If you believe we
          have collected information from a child under that age, contact us at{' '}
          <a href="mailto:privacy@codecard.app">privacy@codecard.app</a> and we will delete it. This
          paragraph describes product intent; it is not a COPPA, GDPR-K, or similar certification.
        </p>
      </section>
      <section>
        <h2 id="rights">Your rights</h2>
        <p>
          You may access, correct, or delete your personal data using the in-app controls described
          above, or by contacting us at{' '}
          <a href="mailto:privacy@codecard.app">privacy@codecard.app</a>. We will respond within 30
          days. Depending on where you live, you may have additional rights under applicable law.
          We do not claim that CodeCard is certified under any particular privacy statute.
        </p>
      </section>
      <section>
        <h2 id="security">Security</h2>
        <p>
          We use industry-standard measures including encryption in transit, row-level security on
          database tables, and access controls. No system is perfectly secure. See the{' '}
          <Link href="/legal/security">security contact page</Link> to report a vulnerability.
        </p>
      </section>
      <section>
        <h2 id="transfers">International transfers</h2>
        <p>
          CodeCard is operated from infrastructure that may process data in the United States and
          other countries where our processors run. If you access CodeCard from another country,
          your information may be transferred to those locations. We do not claim that a specific
          transfer mechanism (such as Standard Contractual Clauses) is in place until counsel
          confirms it.
        </p>
      </section>
      <section>
        <h2 id="updates">Policy updates</h2>
        <p>
          We may update this page when product behavior changes. The “Last updated” date at the top
          is the current version. Material changes should be reflected here before they are treated
          as current practice.
        </p>
      </section>
      <section>
        <h2 id="about">About this policy</h2>
        <p>
          This page describes current product behavior for CodeCard. Technical/product copy
          alignment completed — attorney review pending. Operator legal entity, registered office,
          and any required supervisory-authority details are placeholders until they exist:{' '}
          <strong>[COMPANY LEGAL NAME]</strong>, <strong>[BUSINESS ADDRESS IF REQUIRED]</strong>.
        </p>
      </section>
    </LegalPage>
  );
}

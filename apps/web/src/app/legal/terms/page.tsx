import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { LEGAL_LAST_UPDATED, MINIMUM_ACCOUNT_AGE_YEARS } from '@/lib/legal/constants';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/terms',
  title: 'Terms of Service',
  description:
    'Terms governing CodeCard accounts, public profiles, uploaded content, and acceptable use of the service.',
});

const TOC = [
  { href: '#agreement', label: 'Agreement' },
  { href: '#account', label: 'Your account' },
  { href: '#age', label: 'Eligibility and age' },
  { href: '#content', label: 'Your content' },
  { href: '#acceptable-use', label: 'Acceptable use' },
  { href: '#copyright', label: 'Copyright complaints' },
  { href: '#github', label: 'GitHub and other services' },
  { href: '#ai', label: 'AI features' },
  { href: '#export-deletion', label: 'Account data export and deletion' },
  { href: '#subscriptions', label: 'Subscriptions' },
  { href: '#availability', label: 'Service availability' },
  { href: '#termination', label: 'Termination' },
  { href: '#disclaimer', label: 'Disclaimer' },
  { href: '#liability', label: 'Limitation of liability' },
  { href: '#governing-law', label: 'Governing law' },
  { href: '#about', label: 'About these terms' },
];

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED} toc={TOC}>
      <section>
        <h2 id="agreement">Agreement</h2>
        <p>
          By using CodeCard, you agree to these terms. If you do not agree, do not use the
          service. These terms work together with the{' '}
          <Link href="/legal/privacy">Privacy Policy</Link>,{' '}
          <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>, and{' '}
          <Link href="/legal/subscription">Subscription &amp; Billing Terms</Link>.
        </p>
      </section>
      <section>
        <h2 id="account">Your account</h2>
        <p>
          You are responsible for your account credentials and all activity under your account.
          You must provide accurate information and keep it updated. Do not share your password or
          session. Notify us if you believe someone else is using your account.
        </p>
      </section>
      <section>
        <h2 id="age">Eligibility and age</h2>
        <p>
          You must be at least {MINIMUM_ACCOUNT_AGE_YEARS} years old to create a CodeCard account.
          CodeCard is not directed at children under {MINIMUM_ACCOUNT_AGE_YEARS}. If you use
          CodeCard on behalf of an organization, you represent that you have authority to bind that
          organization.
        </p>
      </section>
      <section>
        <h2 id="content">Your content</h2>
        <p>
          You retain ownership of content you upload. You grant CodeCard a license to host, display,
          and distribute your public profile content as necessary to operate the service. That
          license is limited to operating, securing, backing up, and displaying CodeCard. It is not
          a transfer of ownership.
        </p>
        <p>
          You are responsible for the content you publish, including projects, research, images,
          documents, and links. Do not upload material you do not have the right to share.
        </p>
      </section>
      <section>
        <h2 id="acceptable-use">Acceptable use</h2>
        <p>
          You must follow the <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>.
          Prohibited activities include illegal content, malware, harassment, scraping abuse,
          attempts to access another person&apos;s private data, and uploading executable or
          deceptive files.
        </p>
      </section>
      <section>
        <h2 id="copyright">Copyright complaints</h2>
        <p>
          If you believe content on CodeCard infringes your copyright, use the process described in
          the <Link href="/legal/dmca">copyright policy</Link>. Reports are reviewed. Content is
          not deleted automatically based solely on an unverified complaint.
        </p>
      </section>
      <section>
        <h2 id="github">GitHub and other services</h2>
        <p>
          Optional GitHub sign-in is provided through our authentication provider. CodeCard
          requests only the GitHub access needed to identify your account. GitHub remains a
          third-party service with its own terms. Disconnecting GitHub or deleting your CodeCard
          account does not delete your GitHub account.
        </p>
      </section>
      <section>
        <h2 id="ai">AI features</h2>
        <p>
          CodeCard does not currently generate profile content with a third-party AI provider. If
          AI-assisted features are added later, any suggestions will be provided for convenience
          only, may contain errors, and should be reviewed by you before publishing. We do not
          claim that AI output is accurate, safe, or legally sufficient.
        </p>
      </section>
      <section>
        <h2 id="export-deletion">Account data export and deletion</h2>
        <p>
          You may download an in-app export of your approved account data while signed in. The
          export is provided as structured JSON through Settings and reflects the data categories
          CodeCard supports for export.
        </p>
        <p>
          You may request deletion of your own account through the in-app account controls in
          Settings. Deletion requires identity confirmation, including exact confirmation text and
          recent reauthentication, plus other safety checks. If you have an active or cancellable
          subscription, CodeCard cancels it as part of a successful deletion request (or confirms
          that no cancellable subscription exists). You are responsible for saving any copies of
          content you need before deletion. After a successful deletion, access to the account is
          permanently removed. Limited legal, billing, security, or compliance records may be
          retained or anonymized as described in the Privacy Policy.
        </p>
        <p>
          Deletion may be temporarily unavailable when required safety checks or configuration are
          missing. In that case your account is not deleted.
        </p>
      </section>
      <section>
        <h2 id="subscriptions">Subscriptions</h2>
        <p>
          Paid plans are billed monthly through Stripe. Pricing and features are shown at checkout.
          You may cancel a subscription anytime through the customer portal. Access continues
          through the end of the paid period unless account deletion cancels the subscription as
          described above. Additional billing terms are in the{' '}
          <Link href="/legal/subscription">Subscription &amp; Billing Terms</Link>.
        </p>
      </section>
      <section>
        <h2 id="availability">Service availability</h2>
        <p>
          We work to keep CodeCard available, but we do not guarantee uninterrupted operation,
          error-free software, or preservation of every draft. Maintenance, outages, and force
          majeure events can occur.
        </p>
      </section>
      <section>
        <h2 id="termination">Termination</h2>
        <p>
          We may suspend or terminate accounts that violate our Acceptable Use Policy. You may
          request deletion of your account at any time through the in-app account controls, subject
          to the confirmation and safety checks described above.
        </p>
      </section>
      <section>
        <h2 id="disclaimer">Disclaimer</h2>
        <p>
          CodeCard is provided &quot;as is&quot; without warranties. We are not liable for
          indirect or consequential damages to the extent permitted by law.
        </p>
      </section>
      <section>
        <h2 id="liability">Limitation of liability</h2>
        <p>
          To the extent permitted by law, CodeCard&apos;s total liability for claims relating to
          the service is limited to the amount you paid us for the service in the twelve months
          before the claim, or one hundred U.S. dollars if you have not paid. Some jurisdictions
          do not allow certain limitations; in those places, the limitation applies only to the
          extent allowed.
        </p>
      </section>
      <section>
        <h2 id="governing-law">Governing law</h2>
        <p>
          Governing law and venue are not specified here because the operating entity has not been
          confirmed for these terms. Placeholder: <strong>[GOVERNING LAW / VENUE]</strong>. This
          section requires attorney review before it can name a jurisdiction.
        </p>
      </section>
      <section>
        <h2 id="about">About these terms</h2>
        <p>
          These terms describe current product behavior for CodeCard. Technical/product copy
          alignment completed — attorney review pending. Operator identity placeholder:{' '}
          <strong>[COMPANY LEGAL NAME]</strong>. Contact:{' '}
          <Link href="/legal/contact">legal contact page</Link>.
        </p>
      </section>
    </LegalPage>
  );
}

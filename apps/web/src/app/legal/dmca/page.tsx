import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { COPYRIGHT_INBOX, LEGAL_LAST_UPDATED } from '@/lib/legal/constants';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/dmca',
  title: 'Copyright Policy',
  description: 'How to report potentially infringing content hosted on CodeCard.',
});

const TOC = [
  { href: '#how-to-report', label: 'How to report' },
  { href: '#notice', label: 'What to include' },
  { href: '#process', label: 'Review process' },
  { href: '#counter', label: 'Counter-notice' },
  { href: '#repeat', label: 'Repeat infringement' },
  { href: '#agent', label: 'Designated-agent placeholders' },
];

export default function DmcaPage() {
  return (
    <LegalPage title="Copyright Policy" lastUpdated={LEGAL_LAST_UPDATED} toc={TOC}>
      <section>
        <h2 id="how-to-report">How to report</h2>
        <p>
          CodeCard hosts user-published profiles, projects, research, images, and links. If you
          believe content on CodeCard infringes your copyright, send a complaint to{' '}
          <a href={`mailto:${COPYRIGHT_INBOX}`}>{COPYRIGHT_INBOX}</a> or use the in-product report
          control on a public profile. You can also start from the{' '}
          <Link href="/legal/contact">contact page</Link>.
        </p>
        <p>
          We do not automatically delete content based solely on an arbitrary user report. Reports
          are reviewed.
        </p>
      </section>
      <section>
        <h2 id="notice">What to include</h2>
        <p>A useful copyright notice should include:</p>
        <ul>
          <li>Identification of the copyrighted work</li>
          <li>Identification of the allegedly infringing material and its location on CodeCard</li>
          <li>Your contact information</li>
          <li>A statement of good faith belief that use is unauthorized</li>
          <li>A statement under penalty of perjury that the information is accurate</li>
          <li>Your physical or electronic signature</li>
        </ul>
      </section>
      <section>
        <h2 id="process">Review process</h2>
        <p>The intended workflow is:</p>
        <ul>
          <li>Report received</li>
          <li>Review</li>
          <li>Request additional information if needed</li>
          <li>Action, which may include leaving the content up, restricting it, or removing it</li>
          <li>Notify the relevant party when we have enough information to do so</li>
        </ul>
        <p>
          Timing and outcome depend on the completeness of the notice and the facts. This page
          describes an operational process, not a guarantee of any particular legal result.
        </p>
      </section>
      <section>
        <h2 id="counter">Counter-notice</h2>
        <p>
          If content was removed and you believe that was a mistake, send a counter-notice to the
          same inbox with enough detail for us to identify the material and your contact
          information. If a designated agent is later registered, counter-notices should also meet
          the statutory requirements that apply at that time, including 17 U.S.C. § 512(g) where
          applicable.
        </p>
      </section>
      <section>
        <h2 id="repeat">Repeat infringement</h2>
        <p>
          We intend to terminate accounts of users who are determined to be repeat copyright
          infringers in appropriate circumstances. That is an operational policy, not a claim that
          a particular statutory safe harbor has been established.
        </p>
      </section>
      <section>
        <h2 id="agent">Designated-agent placeholders</h2>
        <p>
          CodeCard has not published a registered DMCA designated agent on this page. Do not treat
          the inbox above as proof that an agent has been filed with the U.S. Copyright Office.
          Replace the placeholders below only when a real registration exists:
        </p>
        <p className="mt-4 rounded-lg border border-[rgba(35,35,36,0.12)] bg-[rgba(35,35,36,0.04)] p-4">
          [COMPANY LEGAL NAME]
          <br />
          [DESIGNATED AGENT NAME IF REGISTERED]
          <br />
          [PHYSICAL ADDRESS]
          <br />
          <a href={`mailto:${COPYRIGHT_INBOX}`}>{COPYRIGHT_INBOX}</a>
        </p>
      </section>
    </LegalPage>
  );
}

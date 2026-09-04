import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { LEGAL_LAST_UPDATED } from '@/lib/legal/constants';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/security',
  title: 'Security',
  description: 'How to report a security issue in CodeCard.',
});

const TOC = [
  { href: '#report', label: 'Report a vulnerability' },
  { href: '#scope', label: 'What to include' },
  { href: '#please-dont', label: 'Please do not' },
  { href: '#bounty', label: 'Bug bounty' },
];

export default function SecurityPage() {
  return (
    <LegalPage title="Security" lastUpdated={LEGAL_LAST_UPDATED} toc={TOC}>
      <section>
        <h2 id="report">Report a vulnerability</h2>
        <p>
          If you believe you found a security issue in CodeCard, email{' '}
          <a href="mailto:hello@codecard.app">hello@codecard.app</a> with the subject line
          “Security report”. There is not a separate dedicated security inbox published yet; using
          the existing support address avoids inventing an unmonitored mailbox.
        </p>
        <p>
          We will try to acknowledge reports and keep you informed as we investigate. We do not
          promise a specific SLA on this page.
        </p>
      </section>
      <section>
        <h2 id="scope">What to include</h2>
        <ul>
          <li>A clear description of the issue and the affected URL or feature</li>
          <li>Steps to reproduce, limited to your own account or a test account you control</li>
          <li>Impact you observed (for example, whether another user’s private data was visible)</li>
          <li>The date and approximate time of the test</li>
        </ul>
      </section>
      <section>
        <h2 id="please-dont">Please do not</h2>
        <ul>
          <li>Access or modify other people’s data</li>
          <li>Run denial-of-service or destructive tests against production</li>
          <li>Publicly disclose the issue before we have had a reasonable chance to fix it</li>
        </ul>
      </section>
      <section>
        <h2 id="bounty">Bug bounty</h2>
        <p>
          CodeCard does not currently offer a paid bug-bounty program. Responsible disclosure is
          still welcome. Related pages:{' '}
          <Link href="/legal/privacy">Privacy Policy</Link> and{' '}
          <Link href="/legal/contact">Contact</Link>.
        </p>
      </section>
    </LegalPage>
  );
}

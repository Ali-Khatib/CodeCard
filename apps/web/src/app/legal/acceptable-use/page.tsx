import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Acceptable Use Policy' };

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable Use Policy" lastUpdated="June 27, 2025">
      <section>
        <h2>Prohibited content</h2>
        <p>You may not use CodeCard to host or distribute:</p>
        <ul>
          <li>Illegal content or content that facilitates illegal activity</li>
          <li>Malware, phishing pages, or deceptive content</li>
          <li>Content that infringes intellectual property rights</li>
          <li>Harassment, hate speech, or threats</li>
          <li>Spam or misleading professional claims</li>
        </ul>
      </section>
      <section>
        <h2>Prohibited behavior</h2>
        <ul>
          <li>Attempting to access other users&apos; private data</li>
          <li>Scraping or automated abuse of public profiles</li>
          <li>Circumventing rate limits or security controls</li>
          <li>Uploading executable files or malicious media</li>
        </ul>
      </section>
      <section>
        <h2>Enforcement</h2>
        <p>
          We may remove content, suspend accounts, or report activity to authorities as appropriate.
          Report violations via our moderation tools or contact page.
        </p>
      </section>
    </LegalPage>
  );
}

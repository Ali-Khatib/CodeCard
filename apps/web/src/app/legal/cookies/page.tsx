import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { LEGAL_LAST_UPDATED } from '@/lib/legal/constants';

export const metadata = buildIndexablePageMetadata({
  path: '/legal/cookies',
  title: 'Cookies',
  description:
    'What cookies, local storage, and first-party measurement CodeCard actually uses.',
});

const TOC = [
  { href: '#summary', label: 'Summary' },
  { href: '#essential', label: 'Essential' },
  { href: '#functional', label: 'Functional' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#marketing', label: 'Marketing' },
  { href: '#choices', label: 'Your choices' },
];

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" lastUpdated={LEGAL_LAST_UPDATED} toc={TOC}>
      <section>
        <h2 id="summary">Summary</h2>
        <p>
          This page describes what CodeCard actually uses. It is not a claim that a cookie banner
          makes the site legally sufficient in every jurisdiction. CodeCard does not load
          advertising pixels from Meta, Google Ads, TikTok, or similar networks.
        </p>
        <p>
          Because optional advertising cookies are not used, CodeCard does not show a marketing
          cookie popup. Strictly necessary cookies still run so you can sign in.
        </p>
      </section>
      <section>
        <h2 id="essential">Essential</h2>
        <ul>
          <li>
            Authentication session cookies set by our auth provider after you sign in, and a
            short-lived cookie used to complete the login exchange securely.
          </li>
          <li>Security controls such as CSRF protections on cookie-authenticated requests.</li>
        </ul>
        <p>These cookies are required to operate accounts. Signing out clears the session cookie.</p>
      </section>
      <section>
        <h2 id="functional">Functional</h2>
        <ul>
          <li>
            Theme and appearance preferences stored in your browser&apos;s local storage so the
            page can render in light or dark mode.
          </li>
          <li>
            Session storage for short-lived UI state in the current tab (for example visitor
            conversion prompt, copied-link flags, and scroll restoration). This is not sent to
            CodeCard as a tracking identifier.
          </li>
        </ul>
        <p>These stay on your device. They are not advertising identifiers.</p>
      </section>
      <section>
        <h2 id="analytics">Analytics</h2>
        <ul>
          <li>
            First-party profile analytics (event type, allowlisted resource IDs, opaque session
            id) so profile owners can see how public pages are used.
          </li>
          <li>
            Vercel Web Analytics and Speed Insights, loaded after idle, for first-party
            performance and usage measurement.
          </li>
        </ul>
        <p>
          These are not advertising trackers. Whether a regulator treats first-party analytics as
          requiring prior consent is a legal question, not something this page certifies. See the{' '}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </p>
      </section>
      <section>
        <h2 id="marketing">Marketing</h2>
        <p>
          CodeCard does not currently set marketing or advertising cookies and does not send
          promotional email campaigns. If that changes, this page and the Privacy Policy will be
          updated, and consent will be collected separately from agreeing to these terms.
        </p>
      </section>
      <section>
        <h2 id="choices">Your choices</h2>
        <p>
          You can sign out to clear the session cookie, use browser controls to clear site data, and
          delete your account from Settings. There is no separate “reject analytics cookies”
          control because CodeCard does not run a third-party advertising cookie stack.
        </p>
      </section>
    </LegalPage>
  );
}

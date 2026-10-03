'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import '@/styles/site-footer.css';
import '@/styles/editorial-landing.css';

const FOOTER_COL_PRODUCT = [
  { label: 'Home', href: MARKETING_HOME_HREF },
  { label: 'Live demo', href: LIVE_DEMO_HREF },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Research', href: '/research' },
] as const;

const FOOTER_COL_LEGAL = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Cookies', href: '/legal/cookies' },
  { label: 'Acceptable Use', href: '/legal/acceptable-use' },
  { label: 'Copyright', href: '/legal/dmca' },
  { label: 'Security', href: '/legal/security' },
] as const;

const FOOTER_COL_ACCOUNT = [
  { label: 'Billing', href: '/legal/subscription' },
  { label: 'Contact', href: '/legal/contact' },
  { label: 'Sign in', href: '/sign-in' },
] as const;

const FOOTER_COLUMNS = [
  { heading: 'Product', links: FOOTER_COL_PRODUCT },
  { heading: 'Legal', links: FOOTER_COL_LEGAL },
  { heading: 'Account', links: FOOTER_COL_ACCOUNT },
] as const;

/**
 * Marketing footer: cream statement, wave seam, labeled link columns.
 */
export function HumeFooterCluster() {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  // Black→cream handoff only after the editorial landing finale — not pricing/research.
  const fromFinale = pathname === MARKETING_HOME_HREF || pathname === '/landing';

  return (
    <div className="cc-site-footer" data-testid="site-footer-cluster">
      {fromFinale ? <div className="cc-site-footer__from-finale" aria-hidden /> : null}
      <section
        className="cc-site-footer__statement"
        aria-labelledby="footer-statement-heading"
      >
        <div className="cc-site-footer__statement-grid">
          <div className="cc-site-footer__statement-copy">
            <p className="cc-site-footer__eyebrow">CodeCard</p>
            <h2
              id="footer-statement-heading"
              className="cc-site-footer__display"
            >
              <span>Share your work.</span>
              <span>Keep the connection.</span>
            </h2>
          </div>
        </div>

        {/* Cream tab + wave seam — hangs into the dark bar as one continuous surface */}
        <div className="cc-site-footer__to-top">
          <button
            type="button"
            className="cc-site-footer__top-tab"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Top of page"
          >
            <span>Top of page</span>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                d="M12 19V5M5 12l7-7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="cc-site-footer__seam" aria-hidden>
          <svg
            className="cc-site-footer__wave"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            focusable="false"
          >
            {/* Single smooth S-curve — reads cleanly when stretched on phone */}
            <path
              d="M0,0 H1440 V48 C1200,48 1080,96 720,72 C360,48 240,96 0,64 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      <footer className="cc-site-footer__bar">
        <div className="cc-site-footer__bar-inner">
          <nav className="cc-site-footer__cols" aria-label="Footer">
            <div className="cc-site-footer__col cc-site-footer__col--brand">
              <p className="cc-site-footer__brand">CodeCard</p>
              <p className="cc-site-footer__tagline">
                A professional profile for real-world introductions.
              </p>
              <div className="cc-site-footer__actions">
                <Link href="/sign-up" className="cc-site-footer__btn cc-instant-press">
                  Create your CodeCard
                </Link>
                <LiveDemoLink className="cc-site-footer__btn-ghost cc-instant-press">
                  View live demo
                </LiveDemoLink>
              </div>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading} className="cc-site-footer__col">
                <p className="cc-site-footer__col-heading">{column.heading}</p>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href === LIVE_DEMO_HREF ? (
                        <LiveDemoLink className="cc-site-footer__link">
                          {link.label}
                        </LiveDemoLink>
                      ) : (
                        <Link
                          href={link.href}
                          className="cc-site-footer__link"
                          onClick={
                            link.href === '/faq'
                              ? (event) => {
                                  if (window.location.pathname !== '/faq') return;
                                  event.preventDefault();
                                  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                                }
                              : undefined
                          }
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="cc-site-footer__meta">
            <p>© {year} CodeCard</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

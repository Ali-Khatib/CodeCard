'use client';

import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import '@/styles/site-footer.css';
import '@/styles/editorial-landing.css';

const FOOTER_NAV = [
  { label: 'Home', href: MARKETING_HOME_HREF },
  { label: 'Live demo', href: LIVE_DEMO_HREF },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Research', href: '/research' },
] as const;

const FOOTER_LEGAL = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Sign in', href: '/sign-in' },
] as const;

/**
 * New Form–inspired footer: oversized type, wave seam, live hover motion.
 * No portrait media — statement type only above the dark bar.
 */
export function HumeFooterCluster() {
  const year = new Date().getFullYear();

  return (
    <div className="cc-site-footer" data-testid="site-footer-cluster">
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
              <span>Your work.</span>
              <span>One identity.</span>
            </h2>
          </div>
        </div>

        <div className="cc-site-footer__seam">
          <svg
            className="cc-site-footer__wave"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* Cream scallop on top of full-bleed dark */}
            <path
              d="M0,0 L1440,0 L1440,56 C1200,140 960,96 720,48 C480,0 240,120 0,40 Z"
              fill="currentColor"
            />
          </svg>
          <button
            type="button"
            className="cc-site-footer__top-tab"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Top of page"
          >
            <span>Top of page</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
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
      </section>

      <footer className="cc-site-footer__bar">
        <div className="cc-site-footer__bar-inner">
          <div className="cc-site-footer__contact">
            <Link href="/sign-up" className="cc-site-footer__email">
              Get in touch
              <span className="cc-site-footer__email-line" aria-hidden />
            </Link>
            <div className="cc-site-footer__actions">
              <Link
                href="/sign-up"
                className="cc-site-footer__btn cc-instant-press"
              >
                Create Your CodeCard
              </Link>
              <LiveDemoLink className="cc-site-footer__btn-ghost cc-instant-press">
                Open Live Demo
              </LiveDemoLink>
            </div>
            <div className="cc-site-footer__cols">
              <ul>
                {FOOTER_NAV.map((link) => (
                  <li key={link.label}>
                    {link.href === LIVE_DEMO_HREF ? (
                      <LiveDemoLink className="cc-site-footer__link">
                        {link.label}
                      </LiveDemoLink>
                    ) : (
                      <Link href={link.href} className="cc-site-footer__link">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <ul>
                {FOOTER_LEGAL.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="cc-site-footer__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="cc-site-footer__ghost" aria-hidden>
            <span>Get</span>
            <span>Started</span>
          </p>

          <div className="cc-site-footer__meta">
            <p>© {year} CodeCard</p>
            <p className="cc-site-footer__meta-note">
              Projects, papers, Circle, and analysis in one profile.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

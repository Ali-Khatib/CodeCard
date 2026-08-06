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
 * New Form–inspired closing footer: oversized type, dark bar, sparse links.
 */
export function HumeFooterCluster() {
  const year = new Date().getFullYear();

  return (
    <div className="cc-site-footer" data-testid="site-footer-cluster">
      <section className="cc-site-footer__statement" aria-labelledby="footer-statement-heading">
        <div className="cc-site-footer__statement-inner">
          <p className="cc-site-footer__eyebrow">CodeCard</p>
          <h2 id="footer-statement-heading" className="cc-site-footer__display">
            <span>Your work.</span>
            <span>One identity.</span>
          </h2>
          <p className="cc-site-footer__lede">
            Projects, research papers, Circle, connections, and full analysis in
            one living technical profile.
          </p>
          <div className="cc-site-footer__actions">
            <Link href="/sign-up" className="cc-ed__btn-primary cc-instant-press">
              Create Your CodeCard
            </Link>
            <LiveDemoLink className="cc-ed__btn-ghost cc-instant-press">
              Open Live Demo
            </LiveDemoLink>
          </div>
        </div>
      </section>

      <footer className="cc-site-footer__bar">
        <div className="cc-site-footer__bar-inner">
          <div className="cc-site-footer__contact">
            <Link href="/sign-up" className="cc-site-footer__email">
              Get in touch
            </Link>
            <div className="cc-site-footer__cols">
              <ul>
                {FOOTER_NAV.map((link) => (
                  <li key={link.label}>
                    {link.href === LIVE_DEMO_HREF ? (
                      <LiveDemoLink>{link.label}</LiveDemoLink>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
              <ul>
                {FOOTER_LEGAL.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="cc-site-footer__ghost" aria-hidden>
            Get Started
          </p>

          <div className="cc-site-footer__meta">
            <p>© {year} CodeCard</p>
            <button
              type="button"
              className="cc-site-footer__top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Top of page
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

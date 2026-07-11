'use client';

import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import { CODECARD_TAGLINE } from '@/lib/marketing/positioning';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: MARKETING_HOME_HREF },
      { label: 'Live demo', href: LIVE_DEMO_HREF },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Research', href: `${MARKETING_HOME_HREF}#research` },
      { label: 'How it works', href: `${MARKETING_HOME_HREF}#how-it-works` },
      { label: 'References', href: '/research/references' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Sign in', href: '/sign-in' },
      { label: 'Start free', href: '/sign-up' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
    ],
  },
] as const;

export function HumeFooterCluster() {
  return (
    <div className="border-t border-[var(--border)] bg-bone">
      {/* Contact CTA */}
      <section className="cc-container py-16 md:py-20">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] text-ink">
            Get started with CodeCard today
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-smoke">{CODECARD_TAGLINE}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className="cc-btn-pill-primary cc-instant-press px-8 py-3">
              Start free →
            </Link>
            <LiveDemoLink className="cc-btn-pill-ghost cc-instant-press px-8 py-3">
              Live demo
            </LiveDemoLink>
          </div>
        </div>
      </section>

      {/* Newsletter stub */}
      <section className="border-t border-[var(--border)] bg-paper">
        <div className="cc-container flex flex-col items-center gap-6 py-14 md:flex-row md:justify-between md:py-16">
          <div className="max-w-md text-center md:text-left">
            <p className="font-eyebrow text-[11px] uppercase tracking-[0.08em] text-smoke">
              Stay in the loop
            </p>
            <p className="mt-2 font-sans text-[20px] font-medium tracking-[-0.02em] text-ink">
              Product updates & showcase tips
            </p>
          </div>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Newsletter signup"
          >
            <label className="sr-only" htmlFor="footer-email">
              Email
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="you@email.com"
              className="h-11 flex-1 rounded-full border border-[var(--line-soft)] bg-bone px-5 text-[15px] text-ink placeholder:text-smoke focus:outline-none focus:ring-2 focus:ring-iris/30"
            />
            <button type="submit" className="cc-btn-pill-primary cc-instant-press shrink-0 px-6">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer columns */}
      <footer className="border-t border-[var(--border)]">
        <div className="cc-container grid gap-10 py-14 md:grid-cols-[1.2fr_repeat(3,1fr)] md:py-16">
          <div>
            <p className="font-sans text-[18px] font-semibold tracking-[-0.02em] text-ink">
              CodeCard
            </p>
            <p className="mt-3 max-w-[260px] text-[15px] leading-relaxed text-smoke">
              {CODECARD_TAGLINE}
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-eyebrow text-[11px] uppercase tracking-[0.08em] text-smoke">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-ink transition-opacity hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] py-6">
          <p className="cc-container text-center text-[13px] text-smoke">
            © {new Date().getFullYear()} CodeCard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

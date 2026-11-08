'use client';

import Link from 'next/link';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';

const COLS = [
  {
    head: 'Product',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/research', label: 'Research' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    head: 'Company',
    links: [{ href: '/faq', label: 'FAQ' }],
  },
  {
    head: 'Account',
    links: [
      { href: '/sign-in', label: 'Sign in' },
      { href: '/sign-up', label: 'Create your CodeCard' },
    ],
  },
  {
    head: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Privacy Policy' },
      { href: '/legal/terms', label: 'Terms of Service' },
    ],
  },
] as const;

/** The closing chapter, not a sitemap bolted to the bottom. */
export function LsFooter() {
  return (
    <footer className="ls-foot">
      <div className="ls-wrap">
        <p className="ls-foot__statement">
          Give your work somewhere to be found
          <span className="ls-foot__dot" aria-hidden />
        </p>

        <div className="ls-foot__grid">
          <div className="ls-foot__brand">
            <span className="ls-foot__mark cc-ed-mark-logo" aria-hidden>
              <CodeCardExpandingMark />
            </span>
            <p className="ls-foot__line">
              One place for your professional identity, your work and the people you meet.
            </p>
          </div>

          {COLS.map((col) => (
            <nav key={col.head} aria-label={col.head} className="ls-foot__col">
              <p className="ls-foot__head">{col.head}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="ls-foot__rule">© {new Date().getFullYear()} CodeCard</p>
      </div>
    </footer>
  );
}

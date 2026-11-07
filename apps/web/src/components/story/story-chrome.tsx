'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';

const PAGES = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
] as const;

export function StoryNav() {
  const pathname = usePathname();

  return (
    <header className="pl-nav" data-tone="light">
      <div className="pl-nav__strip" aria-hidden />
      <div className="pl-nav__in">
        <Link href="/" className="pl-nav__mark cc-ed-mark-logo" aria-label="CodeCard home">
          <CodeCardExpandingMark />
        </Link>

        <nav className="pl-seg" aria-label="Pages">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="pl-seg__btn"
              aria-current={pathname === p.href ? 'page' : undefined}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="pl-nav__right">
          <Link href="/sign-in" className="pl-nav__link">
            Sign in
          </Link>
          <Link href="/sign-up" className="pl-nav__cta">
            Create your CodeCard
          </Link>
        </div>
      </div>
    </header>
  );
}

const COLS = [
  {
    head: 'Product',
    links: [
      { href: '/', label: 'Home' },
      { href: '/how-it-works', label: 'How it works' },
    ],
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

export function StoryFooter() {
  return (
    <footer className="pl-foot">
      <div className="pl-wrap pl-foot__in">
        <div className="pl-foot__brand">
          <span className="pl-foot__mark cc-ed-mark-logo" aria-hidden>
            <CodeCardExpandingMark />
          </span>
          <p>© {new Date().getFullYear()} CodeCard</p>
        </div>
        <div className="pl-foot__cols">
          {COLS.map((col) => (
            <nav key={col.head} aria-label={col.head}>
              <p className="pl-foot__head">{col.head}</p>
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
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';

const EXPLORE = [
  {
    href: '/how-it-works',
    label: 'How it works',
    note: 'See how CodeCard brings your professional identity and connections together.',
  },
  {
    href: '/demo/card',
    label: 'Your profile',
    note: 'Show your work, projects and research.',
  },
  {
    href: '/demo/connections',
    label: 'Connections',
    note: 'Remember the people you meet.',
  },
] as const;

const PAGES = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
] as const;

export function StoryNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const active = pathname === '/how-it-works' ? 1 : 0;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="pl-nav" data-tone="light">
      <div className="pl-nav__in">
        <div className="pl-nav__left">
          <Link href="/" className="pl-nav__mark" aria-label="CodeCard home">
            <CodeCardExpandingMark />
          </Link>
          <div className="pl-nav__menu" ref={menu}>
            <button
              type="button"
              className="pl-nav__link"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((v) => !v)}
            >
              Explore
              <svg viewBox="0 0 12 8" aria-hidden className={open ? 'is-open' : undefined}>
                <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <div className="pl-drop" data-open={open ? 'true' : 'false'} inert={!open}>
              <ul>
                {EXPLORE.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <span>{item.label}</span>
                      <i>{item.note}</i>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <nav className="pl-seg" aria-label="Pages">
          <span className="pl-seg__thumb" data-at={active} aria-hidden />
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
          <span className="pl-foot__mark" aria-hidden>
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

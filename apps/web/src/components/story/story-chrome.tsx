'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';

export type ProductSide = 'card' | 'workspace';

const EXPLORE = [
  { href: '/how-it-works', label: 'How it works', note: 'Meet, share, discover, keep' },
  { href: '/guide', label: 'Guide', note: 'Set up a card that reads well' },
  { href: '/profiles', label: 'Profiles', note: 'Cards people have published' },
  { href: '/research', label: 'Research', note: 'Papers hosted on CodeCard' },
  { href: '/pricing', label: 'Pricing', note: 'Free, and $8 a month for Pro' },
  { href: '/faq', label: 'FAQ', note: 'Sharing, privacy and plans' },
] as const;

/** Top bar: mark, an Explore menu, the two sides of the product, then account. */
export function StoryNav({
  side,
  onSide,
}: {
  side: ProductSide;
  onSide: (next: ProductSide) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
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

  const jump = (next: ProductSide) => {
    onSide(next);
    document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="pl-nav" data-tone="light">
      <div className="pl-nav__in">
        <div className="pl-nav__left" ref={wrap}>
          <Link href="/" className="pl-nav__mark" aria-label="CodeCard home">
            <CodeCardExpandingMark />
          </Link>
          <div className="pl-nav__menu">
            <button
              type="button"
              className="pl-nav__link pl-nav__trigger"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((v) => !v)}
            >
              Explore
              <svg viewBox="0 0 12 8" aria-hidden className={open ? 'is-open' : undefined}>
                <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <div className="pl-nav__drop" data-open={open ? 'true' : 'false'} inert={!open}>
              <ul>
                {EXPLORE.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      <span>{item.label}</span>
                      <i>{item.note}</i>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pl-seg" role="tablist" aria-label="Two sides of CodeCard">
          <span className="pl-seg__thumb" data-side={side} aria-hidden />
          <button
            type="button"
            role="tab"
            aria-selected={side === 'card'}
            className="pl-seg__btn"
            onClick={() => jump('card')}
          >
            Your card
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={side === 'workspace'}
            className="pl-seg__btn"
            onClick={() => jump('workspace')}
          >
            Your workspace
          </button>
        </div>

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
      { href: LIVE_DEMO_HREF, label: 'Live demo' },
      { href: LIVE_DEMO_PROFILE_HREF, label: 'See a live card' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    head: 'Explore',
    links: [
      { href: '/profiles', label: 'Profiles' },
      { href: '/research', label: 'Research' },
      { href: '/guide', label: 'Guide' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    head: 'Account',
    links: [
      { href: '/sign-up', label: 'Create your CodeCard' },
      { href: '/sign-in', label: 'Sign in' },
      { href: '/legal/contact', label: 'Contact' },
      { href: '/legal/security', label: 'Security' },
    ],
  },
  {
    head: 'Legal',
    links: [
      { href: '/legal/terms', label: 'Terms' },
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/cookies', label: 'Cookies' },
      { href: '/legal/subscription', label: 'Subscription terms' },
    ],
  },
] as const;

export function StoryFooter() {
  return (
    <footer className="pl-foot">
      <div className="pl-wrap">
        <p className="pl-foot__say">Show your work. Keep the connection.</p>
        <div className="pl-foot__grid">
          <div className="pl-foot__about">
            <p>
              CodeCard is a professional identity built for introductions that happen in person: your work opens from
              a phone or a QR scan, and the person you met stays with you afterwards.
            </p>
            <p className="pl-foot__copy">© {new Date().getFullYear()} CodeCard. All rights reserved.</p>
          </div>
          {COLS.map((col) => (
            <nav key={col.head} className="pl-foot__col" aria-label={col.head}>
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

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { FINE_POINTER } from './hooks';

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Guide', href: '/guide' },
      { label: 'Live demo', href: LIVE_DEMO_HREF, plain: true },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Research', href: '/research' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'Acceptable use', href: '/legal/acceptable-use' },
      { label: 'Copyright', href: '/legal/dmca' },
      { label: 'Security', href: '/legal/security' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Billing', href: '/legal/subscription' },
      { label: 'Contact', href: '/legal/contact' },
      { label: 'Sign in', href: '/sign-in' },
    ],
  },
] as const;

export function Cc2Footer() {
  const ref = useRef<HTMLElement>(null);

  // A pool of signal light follows the pointer through the wordmark.
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(FINE_POINTER).matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener('pointermove', move);
    return () => {
      el.removeEventListener('pointermove', move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <footer ref={ref} className="cc2-footer cc2-tone cc2-tone--ink" data-testid="site-footer-cluster">
      <div className="cc2-wrap cc2-footer__top">
        <p className="cc2-footer__tag">Share what you build.</p>
        <nav className="cc2-footer__cols" aria-label="Footer">
          {COLUMNS.map((c) => (
            <div key={c.heading}>
              <h2>{c.heading}</h2>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    {'plain' in l ? <a href={l.href}>{l.label}</a> : <Link href={l.href}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="cc2-footer__word" aria-hidden>
        CodeCard
      </p>
      <div className="cc2-wrap cc2-footer__base">
        <p>© {new Date().getFullYear()} CodeCard</p>
        <button
          type="button"
          className="cc2-footer__top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Back to top
        </button>
      </div>
    </footer>
  );
}

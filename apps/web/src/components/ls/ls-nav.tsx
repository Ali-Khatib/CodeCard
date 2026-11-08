'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';

/* Only destinations that exist. The Platform / Your work / Connections /
   About / Contact pages join this list as they are built. */
const LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/research', label: 'Research' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
] as const;

/**
 * The bar, and the brand's journey into it.
 *
 * Over the opening photograph the bar is only type on the image and the
 * brand reads in full as CodeCard. As the hero's progress runs, the same
 * mark closes from the wordmark to the standalone symbol — one continuous
 * movement of the real logo rather than a swap between two assets — while
 * the bar gathers into a floating translucent pill.
 *
 * Both of those are driven from --ls-progress in CSS, so the bar never runs
 * a scroll trigger of its own and can never disagree with the hero. Pages
 * without a transforming hero pin the variable at 1 and get the settled bar.
 */
export function LsNav({ pinned = false }: { pinned?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!pinned) return;
    /* Inner pages have no hero to drive the variable, so they start settled. */
    document.documentElement.style.setProperty('--ls-progress', '1');
    return () => {
      document.documentElement.style.removeProperty('--ls-progress');
    };
  }, [pinned]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header className="ls-nav">
        <div className="ls-nav__pill" aria-hidden />
        <div className="ls-nav__in">
          <div className="ls-nav__left">
            <button
              type="button"
              className="ls-nav__menu"
              aria-expanded={open}
              aria-controls="ls-menu"
              onClick={() => setOpen(true)}
            >
              <span className="ls-nav__bars" aria-hidden>
                <i />
                <i />
              </span>
              <span className="sr-only">Open menu</span>
            </button>
            <Link href="/how-it-works" className="ls-nav__link">
              How it works
            </Link>
            <Link href="/research" className="ls-nav__link">
              Research
            </Link>
          </div>

          <Link href="/" className="ls-nav__brand cc-ed-mark-logo" aria-label="CodeCard home">
            <CodeCardExpandingMark />
          </Link>

          <div className="ls-nav__right">
            <Link href="/sign-in" className="ls-nav__link">
              Sign in
            </Link>
            <Link href="/sign-up" className="ls-nav__cta">
              Create your CodeCard
            </Link>
          </div>
        </div>
      </header>

      <div
        id="ls-menu"
        ref={panel}
        className="ls-menu"
        data-open={open ? 'true' : 'false'}
        inert={!open}
      >
        <div className="ls-menu__in">
          <button type="button" className="ls-menu__close" onClick={() => setOpen(false)}>
            Close
          </button>
          <nav aria-label="Site">
            <ul className="ls-menu__list">
              {LINKS.map((l, i) => (
                <li key={l.href} style={{ '--i': i } as React.CSSProperties}>
                  <Link href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ls-menu__foot">
            <Link href="/sign-in" className="ls-menu__ghost">
              Sign in
            </Link>
            <Link href="/sign-up" className="ls-menu__cta">
              Create your CodeCard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

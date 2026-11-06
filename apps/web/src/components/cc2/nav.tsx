'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { Cc2Mark } from './mark';

const LINKS = [
  { href: '/guide', label: 'Guide' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: LIVE_DEMO_HREF, label: 'Live demo', plain: true },
] as const;

const LOCK_CLASS = 'cc2-lock';

export function Cc2Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstMobile = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let was = false;
    const onScroll = () => {
      const now = window.scrollY > 24;
      if (now !== was) {
        was = now;
        setScrolled(now);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sliding highlight behind the desktop links.
  const moveTo = useCallback((el: HTMLElement | null) => {
    const list = listRef.current;
    if (!list) return;
    if (!el) {
      list.style.setProperty('--on', '0');
      return;
    }
    list.style.setProperty('--x', `${el.offsetLeft}px`);
    list.style.setProperty('--w', `${el.offsetWidth}px`);
    list.style.setProperty('--on', '1');
  }, []);

  const settle = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const current = list.querySelector<HTMLElement>('[aria-current="page"]');
    moveTo(current?.parentElement ?? null);
  }, [moveTo]);

  useEffect(() => {
    settle();
    setOpen(false);
  }, [pathname, settle]);

  const onEnter = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType === 'mouse') moveTo(e.currentTarget);
  };

  // Mobile menu: lock the page, close on Escape, return focus to the button.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add(LOCK_CLASS);
    firstMobile.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove(LOCK_CLASS);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="cc2-nav" data-scrolled={scrolled ? 'true' : 'false'} data-open={open ? 'true' : 'false'}>
      <div className="cc2-nav__pill">
        <Link href="/" className="cc2-nav__brand" aria-label="CodeCard home">
          <Cc2Mark className="cc2-nav__mark" />
          <span>CodeCard</span>
        </Link>

        <nav className="cc2-nav__links" aria-label="Primary">
          <ul ref={listRef} onPointerLeave={settle}>
            <li className="cc2-nav__hl" aria-hidden />
            {LINKS.map((l) => (
              <li key={l.label} onPointerEnter={onEnter}>
                {'plain' in l ? (
                  <a href={l.href} onFocus={(e) => moveTo(e.currentTarget.parentElement)} onBlur={settle}>
                    {l.label}
                  </a>
                ) : (
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href) ? 'page' : undefined}
                    onFocus={(e) => moveTo(e.currentTarget.parentElement)}
                    onBlur={settle}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/sign-up" className="cc2-nav__cta">
          Start free
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="cc2-nav__toggle"
          aria-expanded={open}
          aria-controls="cc2-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden />
          <span aria-hidden />
        </button>
      </div>

      <div id="cc2-menu" className="cc2-menu" hidden={!open}>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.label} style={{ ['--i' as string]: i }}>
              {'plain' in l ? (
                <a ref={i === 0 ? firstMobile : undefined} href={l.href}>
                  {l.label}
                </a>
              ) : (
                <Link ref={i === 0 ? firstMobile : undefined} href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              )}
            </li>
          ))}
          <li style={{ ['--i' as string]: LINKS.length }}>
            <Link href="/sign-up" className="cc2-menu__cta" onClick={() => setOpen(false)}>
              Start free
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

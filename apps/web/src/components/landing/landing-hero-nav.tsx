'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { prefetchHref } from '@/hooks/use-view-transition-navigate';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

export type NavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

interface LandingHeroNavProps {
  items: NavItem[];
}

export function LandingHeroNav({ items }: LandingHeroNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTrackRef = useRef<HTMLDivElement>(null);
  const hoverLineRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  const isActive = useCallback(
    (href: string, label: string) => {
      if (href === '/') {
        return (
          pathname === '/' ||
          pathname === '/how-it-works' ||
          pathname === '/research' ||
          pathname.startsWith('/research/')
        );
      }
      if (href === '/profiles') {
        return pathname === '/profiles';
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const activeIndex = useMemo(
    () => items.findIndex((item) => isActive(item.href, item.label)),
    [items, isActive],
  );

  const moveHoverLine = useCallback(
    (index: number | null) => {
      const line = hoverLineRef.current;
      const track = menuTrackRef.current;
      if (!line || !track) return;
      if (index === null || index < 0 || index === activeIndex) {
        line.style.opacity = '0';
        return;
      }
      const el = itemRefs.current[index];
      if (!el) return;
      const trackRect = track.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      line.style.opacity = '1';
      line.style.left = `${rect.left - trackRect.left}px`;
      line.style.width = `${rect.width}px`;
    },
    [activeIndex],
  );

  useEffect(() => {
    moveHoverLine(hovered);
  }, [hovered, moveHoverLine]);

  useEffect(() => {
    const onResize = () => moveHoverLine(hovered);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [hovered, moveHoverLine]);

  return (
    <nav className={`cc-nav-veil w-full ${mobileOpen ? 'cc-nav-veil--mobile-open' : ''}`} aria-label="Primary">
      <div className="cc-nav-veil__inner">
        <Link
          href="/"
          className="font-sans text-[17px] font-medium tracking-[-0.02em] text-ink cc-instant-press"
          aria-label="CodeCard home"
          onMouseEnter={() => router.prefetch('/')}
          onFocus={() => router.prefetch('/')}
        >
          CodeCard
        </Link>

        <div ref={menuTrackRef} className="relative hidden flex-1 md:flex">
          <div ref={hoverLineRef} className="cc-nav-hover-underline" aria-hidden />
          <ul className="cc-hume-fade-group flex items-center gap-1">
            {items.map((item, i) => {
              const active = isActive(item.href, item.label);
              return (
                <li key={`${item.label}-${i}`}>
                  <Link
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.ariaLabel ?? item.label}
                    onMouseEnter={() => {
                      setHovered(i);
                      prefetchHref(item.href, router);
                    }}
                    onFocus={() => prefetchHref(item.href, router)}
                    onMouseLeave={() => setHovered(null)}
                    className={`cc-nav-ghost-link cc-hume-fade-item cc-instant-press ${active ? 'cc-nav-ghost-link--active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <LiveDemoLink className="cc-btn-pill-demo cc-instant-press">
            Live demo
          </LiveDemoLink>
          <Link
            href="/sign-in"
            className="cc-nav-ghost-link cc-instant-press"
            onMouseEnter={() => router.prefetch('/sign-in')}
            onFocus={() => router.prefetch('/sign-in')}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="cc-btn-pill-primary cc-instant-press"
            onMouseEnter={() => router.prefetch('/sign-up')}
            onFocus={() => router.prefetch('/sign-up')}
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] text-ink md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Open menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
            <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="cc-nav-mobile-menu md:hidden">
          <ul className="flex flex-col gap-1">
            {items.map((item, i) => {
              const active = isActive(item.href, item.label);
              return (
                <li key={`m-${item.label}-${i}`}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`block px-3 py-2.5 text-[15px] ${
                      active ? 'font-medium text-iris' : 'text-ash'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-charcoal pt-3">
              <LiveDemoLink
                className="cc-btn-pill-demo mb-3 block w-full py-2.5 text-center"
                onClick={() => setMobileOpen(false)}
              >
                Live demo
              </LiveDemoLink>
            </li>
            <li className="flex gap-2">
              <Link
                href="/sign-in"
                className="cc-btn-pill-ghost flex-1 py-2 text-center"
                onMouseEnter={() => router.prefetch('/sign-in')}
                onFocus={() => router.prefetch('/sign-in')}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="cc-btn-pill-primary flex-1 py-2 text-center"
                onMouseEnter={() => router.prefetch('/sign-up')}
                onFocus={() => router.prefetch('/sign-up')}
              >
                Start free
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

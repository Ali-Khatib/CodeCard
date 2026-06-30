'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LAYOUT } from '@/lib/design/tokens';
import { prefetchHref } from '@/hooks/use-view-transition-navigate';

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
      if (label === 'Profiles') {
        return pathname === '/profiles' || pathname === '/demo' || pathname.startsWith('/demo/');
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
    <nav
      className="cc-nav-veil w-full"
      style={{ maxWidth: `${LAYOUT.navWidth}px` }}
      aria-label="Primary"
    >
      <div className="cc-nav-veil__inner">
        <Link
          href="/"
          className="font-display text-[17px] font-medium text-vellum cc-instant-press"
          aria-label="CodeCard home"
          onMouseEnter={() => router.prefetch('/')}
          onFocus={() => router.prefetch('/')}
        >
          CodeCard
        </Link>

        <div ref={menuTrackRef} className="relative hidden flex-1 md:flex">
          <div ref={hoverLineRef} className="cc-nav-hover-underline" aria-hidden />
          <ul className="flex items-center gap-1">
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
                    className={`cc-nav-ghost-link cc-instant-press ${active ? 'cc-nav-ghost-link--active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
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
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-charcoal text-vellum md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
            <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-charcoal px-4 py-3 md:hidden">
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
            <li className="mt-2 flex gap-2 border-t border-charcoal pt-3">
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

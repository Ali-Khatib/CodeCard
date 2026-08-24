'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { prefetchHref } from '@/hooks/use-view-transition-navigate';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { AnimatedNavFramer } from '@/components/ui/animated-nav-framer';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

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
  const [compact, setCompact] = useState(false);
  const [compactPeek, setCompactPeek] = useState(false);

  const isExpanded = !compact || compactPeek || mobileOpen;

  const isActive = useCallback(
    (href: string, _label: string) => {
      if (href === MARKETING_HOME_HREF) {
        return (
          pathname === MARKETING_HOME_HREF ||
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

  useEffect(() => {
    const root = document.documentElement;
    const syncCompact = () => {
      const next = root.dataset.navCompact === 'true';
      setCompact(next);
      if (!next) {
        setCompactPeek(false);
        setMobileOpen(false);
      }
    };
    syncCompact();
    const observer = new MutationObserver(syncCompact);
    observer.observe(root, { attributes: true, attributeFilter: ['data-nav-compact'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!compactPeek) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const nav = document.querySelector('.cc-nav-veil');
      if (nav && target && !nav.contains(target)) {
        setCompactPeek(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [compactPeek]);

  return (
    <AnimatedNavFramer
      isExpanded={isExpanded}
      onCollapsedClick={() => {
        setCompactPeek(true);
        if (window.matchMedia('(max-width: 767px)').matches) {
          setMobileOpen(true);
        }
      }}
      className={mobileOpen ? 'cc-nav-veil--mobile-open' : undefined}
      collapsedLabel="Expand navigation"
      panel={
        mobileOpen ? (
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
                    onClick={(event) => {
                      event.stopPropagation();
                      setMobileOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-charcoal pt-3">
              <LiveDemoLink
                className="cc-nav-pill-item mb-3 block w-full py-2.5 text-center"
                onClick={() => setMobileOpen(false)}
              >
                Live demo
              </LiveDemoLink>
            </li>
            <li className="flex gap-2">
              <Link
                href="/sign-in"
                className="cc-nav-pill-item flex-1 py-2 text-center"
                onClick={(event) => event.stopPropagation()}
                onMouseEnter={() => router.prefetch('/sign-in')}
                onFocus={() => router.prefetch('/sign-in')}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="cc-nav-pill-item flex-1 py-2 text-center"
                onClick={(event) => event.stopPropagation()}
                onMouseEnter={() => router.prefetch('/sign-up')}
                onFocus={() => router.prefetch('/sign-up')}
              >
                Start free
              </Link>
            </li>
          </ul>
        </div>
        ) : null
      }
    >
      <div className="hidden md:flex cc-nav-desktop-links">
        <ul className="cc-hume-fade-group flex items-center gap-1">
          {items.map((item, i) => {
            const active = isActive(item.href, item.label);
            return (
              <li key={`${item.label}-${i}`}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.ariaLabel ?? item.label}
                  onClick={(event) => event.stopPropagation()}
                  onMouseEnter={() => prefetchHref(item.href, router)}
                  onFocus={() => prefetchHref(item.href, router)}
                  className={`cc-nav-pill-item cc-nav-ghost-link cc-hume-fade-item cc-instant-press ${active ? 'cc-nav-ghost-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="ml-auto hidden items-center gap-2 md:flex cc-nav-desktop-actions">
        <LiveDemoLink className="cc-nav-pill-item cc-instant-press">
          Live demo
        </LiveDemoLink>
        <Link
          href="/sign-in"
          className="cc-nav-pill-item cc-instant-press"
          onClick={(event) => event.stopPropagation()}
          onMouseEnter={() => router.prefetch('/sign-in')}
          onFocus={() => router.prefetch('/sign-in')}
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="cc-nav-pill-item cc-instant-press"
          onClick={(event) => event.stopPropagation()}
          onMouseEnter={() => router.prefetch('/sign-up')}
          onFocus={() => router.prefetch('/sign-up')}
        >
          Start free
        </Link>
      </div>

      <button
        type="button"
        className="cc-nav-mobile-trigger ml-auto flex items-center justify-center rounded-full border border-[var(--line-soft)] text-ink md:hidden"
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        onClick={(event) => {
          event.stopPropagation();
          setMobileOpen((open) => !open);
          setCompactPeek(true);
        }}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
          <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </AnimatedNavFramer>
  );
}

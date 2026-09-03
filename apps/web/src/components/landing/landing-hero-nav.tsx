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
  const [compact, setCompact] = useState(false);
  const [compactPeek, setCompactPeek] = useState(false);

  const isExpanded = !compact || compactPeek;

  const isActive = useCallback(
    (href: string) => {
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
      if (!next) setCompactPeek(false);
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
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [compactPeek]);

  return (
    <AnimatedNavFramer
      isExpanded={isExpanded}
      onCollapsedClick={() => setCompactPeek(true)}
      collapsedLabel="Expand navigation"
    >
      <div className="cc-nav-desktop-links">
        <ul className="cc-hume-fade-group flex items-center gap-1 sm:gap-2">
          {items.map((item, i) => {
            const active = isActive(item.href);
            return (
              <li key={`${item.label}-${i}`}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.ariaLabel ?? item.label}
                  onClick={(event) => event.stopPropagation()}
                  onMouseEnter={() => prefetchHref(item.href, router)}
                  onFocus={() => prefetchHref(item.href, router)}
                  className={`cc-nav-pill-item cc-nav-pill-item--eq cc-hume-fade-item cc-instant-press${active ? ' cc-nav-pill-item--active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <LiveDemoLink className="cc-nav-pill-item cc-nav-pill-item--eq cc-hume-fade-item cc-instant-press">
              Live demo
            </LiveDemoLink>
          </li>
          <li>
            <Link
              href="/sign-up"
              className="cc-nav-pill-item cc-nav-pill-item--eq cc-hume-fade-item cc-instant-press"
              onClick={(event) => event.stopPropagation()}
              onMouseEnter={() => router.prefetch('/sign-up')}
              onFocus={() => router.prefetch('/sign-up')}
            >
              Start free
            </Link>
          </li>
        </ul>
      </div>
    </AnimatedNavFramer>
  );
}

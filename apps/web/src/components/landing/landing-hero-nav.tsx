'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { prefetchHref } from '@/hooks/use-view-transition-navigate';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { AnimatedNavFramer } from '@/components/ui/animated-nav-framer';

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

  const isActive = useCallback(
    (href: string) => {
      if (href === '/profiles') {
        return pathname === '/profiles';
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  return (
    <AnimatedNavFramer isExpanded={true}>
      <div className="cc-nav-desktop-links">
        <ul className="cc-hume-fade-group flex items-center gap-2.5 sm:gap-3">
          {items.map((item, i) => {
            const active = isActive(item.href);
            return (
              <li key={`${item.label}-${i}`}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.ariaLabel ?? item.label}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.href === '/faq' && pathname === '/faq') {
                      event.preventDefault();
                      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                    }
                  }}
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

'use client';

import { useEffect, useState } from 'react';
import { LAYOUT } from '@/lib/design/tokens';
import { CodeCardMarkLogo } from './codecard-mark-logo';
import { LandingHeroNav, type NavItem } from './landing-hero-nav';

export const MARKETING_NAV_ITEMS: NavItem[] = [
  { label: 'Pricing', href: '/pricing' },
];

export function LandingShellNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`cc-marketing-nav-shell sticky top-0 inset-x-0 z-[100] flex w-full justify-center px-3 sm:px-5${
        scrolled ? ' cc-marketing-nav-shell--scrolled' : ''
      }`}
      style={{ top: LAYOUT.pillNavTop }}
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <CodeCardMarkLogo />
      <LandingHeroNav items={MARKETING_NAV_ITEMS} />
    </div>
  );
}

'use client';

import { LAYOUT } from '@/lib/design/tokens';
import { LandingHeroNav, type NavItem } from './landing-hero-nav';

export const MARKETING_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', ariaLabel: 'Overview, research and how it works' },
  { label: 'Profiles', href: '/profiles', ariaLabel: 'Live profiles' },
  { label: 'Pricing', href: '/pricing' },
];

export function LandingShellNav() {
  return (
    <div
      className="fixed inset-x-0 z-[100] flex justify-center"
      style={{ top: LAYOUT.pillNavTop }}
    >
      <LandingHeroNav items={MARKETING_NAV_ITEMS} />
    </div>
  );
}

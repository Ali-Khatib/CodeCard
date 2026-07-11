'use client';

import { LAYOUT } from '@/lib/design/tokens';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import { LandingHeroNav, type NavItem } from './landing-hero-nav';

export const MARKETING_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: MARKETING_HOME_HREF, ariaLabel: 'Overview, research and how it works' },
  { label: 'Pricing', href: '/pricing' },
];

export function LandingShellNav() {
  return (
    <div
      className="cc-marketing-nav-shell fixed inset-x-0 z-[100] flex justify-center px-3 pt-3 sm:px-5"
      style={{ top: LAYOUT.pillNavTop }}
    >
      <LandingHeroNav items={MARKETING_NAV_ITEMS} />
    </div>
  );
}

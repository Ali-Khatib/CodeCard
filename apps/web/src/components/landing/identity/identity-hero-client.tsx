'use client';

import { HeroAmbientLight } from '@/components/interactions/hero-ambient-light';

/** Optional pointer light for identity hero — isolated from LCP server markup. */
export function IdentityHeroClient() {
  return <HeroAmbientLight />;
}

'use client';

import { HeroRotatingWord } from '@/components/ui/animated-hero';

const HERO_WORDS = ['PHONE.', 'POCKET.'] as const;

/** Client-only rotating second line — keeps `editorial-hero.tsx` a server component for LCP. */
export function EditorialHeroAnimatedHeadline() {
  return (
    <span className="cc-ed__sub cc-ed-hero__rotating-line">
      <span className="cc-ed-hero__rotating-prefix">YOUR</span>
      <HeroRotatingWord
        words={HERO_WORDS}
        reducedMotionLabel="PHONE."
      />
    </span>
  );
}

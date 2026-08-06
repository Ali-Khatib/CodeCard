'use client';

import { useEffect, useState } from 'react';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/** Subtle scroll affordance — fades as the visitor begins scrolling. No LCP impact. */
export function HeroScrollCue() {
  const { prefersReducedMotion } = useMotionPreferences();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 28);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className="cc-hero-scroll-cue" data-testid="hero-scroll-cue" aria-hidden>
        <span>Scroll</span>
      </div>
    );
  }

  return (
    <div
      className="cc-hero-scroll-cue"
      data-testid="hero-scroll-cue"
      data-scrolled={scrolled || undefined}
      aria-hidden
    >
      <span>Scroll</span>
      <span className="cc-hero-scroll-cue__line" />
    </div>
  );
}

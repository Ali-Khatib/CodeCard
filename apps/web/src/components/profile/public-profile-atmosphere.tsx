'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** Soft animated atmosphere behind the public CodeCard (CSS-only, no Lenis/WebGL). */
export function PublicProfileAtmosphere() {
  const reduced = useReducedMotion();

  return (
    <div className="cc-public-atmosphere" aria-hidden>
      <div className="cc-public-atmosphere__base" />
      {!reduced ? (
        <>
          <div className="cc-public-atmosphere__orb cc-public-atmosphere__orb--a" />
          <div className="cc-public-atmosphere__orb cc-public-atmosphere__orb--b" />
          <div className="cc-public-atmosphere__orb cc-public-atmosphere__orb--c" />
          <div className="cc-public-atmosphere__grain" />
        </>
      ) : null}
      <div className="cc-public-atmosphere__veil" />
    </div>
  );
}

'use client';

/**
 * CSS-only ambient lighting — follows --pointer-x/y set by useGlobalPointer.
 * Fixed layer, no canvas, GPU-friendly radial gradients only.
 */
export function ReactiveAtmosphere() {
  return (
    <div className="cc-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="cc-atmosphere__orb cc-atmosphere__orb--lime" />
      <div className="cc-atmosphere__orb cc-atmosphere__orb--violet" />
      <div className="cc-atmosphere__orb cc-atmosphere__orb--flame" />
      <div className="cc-atmosphere__mesh" />
    </div>
  );
}

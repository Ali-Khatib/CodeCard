'use client';

/**
 * Light marketing backdrop — subtle pastel wash only (no dark cosmic layers).
 */
export function CosmicAtmosphere() {
  return (
    <div className="cc-cosmic-canvas cc-cosmic-canvas--light pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="cc-cosmic-canvas__base" />
      <div className="cc-cosmic-canvas__hero-glow" />
    </div>
  );
}

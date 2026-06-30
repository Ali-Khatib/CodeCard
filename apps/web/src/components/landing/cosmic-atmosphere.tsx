'use client';

/**
 * Frame.io cosmic canvas — layered gradients shift with scroll + pointer.
 */
export function CosmicAtmosphere() {
  return (
    <div className="cc-cosmic-canvas pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="cc-cosmic-canvas__base" />
      <div className="cc-cosmic-canvas__hero-glow" />
      <div className="cc-cosmic-canvas__mid-glow" />
      <div className="cc-cosmic-canvas__pointer" />
      <div className="cc-cosmic-canvas__grain" />
    </div>
  );
}

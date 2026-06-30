'use client';

/**
 * Vivid+Co × Modal blend — slate veil wash + pointer-reactive purple glow + scroll parallax.
 */
export function EditorialAtmosphere() {
  return (
    <div className="cc-editorial-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="cc-editorial-atmosphere__slate" />
      <div className="cc-editorial-atmosphere__pointer" />
      <div className="cc-editorial-atmosphere__prism-glow" />
    </div>
  );
}

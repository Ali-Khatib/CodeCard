'use client';

/**
 * Modal-style backdrop — true black canvas with subtle purple particles + phosphor scanlines.
 * Replaces the previous VioletSpiral + StarField constellation.
 */
export function PurpleParticleField() {
  return (
    <div className="cc-particle-field pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="cc-particle-field__particles" />
      <div className="cc-particle-field__scanlines" />
    </div>
  );
}

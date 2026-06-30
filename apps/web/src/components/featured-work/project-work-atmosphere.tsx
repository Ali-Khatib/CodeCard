'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ProjectWorkAtmosphereProps {
  /** 'section' sits behind scroll content; 'page' covers full viewport on detail routes */
  variant?: 'section' | 'page';
}

/**
 * Flat black canvas with subtle purple particle drift — Modal phosphor aesthetic.
 */
export function ProjectWorkAtmosphere({ variant = 'section' }: ProjectWorkAtmosphereProps) {
  const reducedMotion = useReducedMotion();
  const positionClass = variant === 'page' ? 'fixed inset-0 z-0' : 'absolute inset-0 -z-10';

  if (reducedMotion) {
    return (
      <div className={`cc-project-atmosphere pointer-events-none ${positionClass}`} aria-hidden />
    );
  }

  return (
    <div className={`cc-project-atmosphere pointer-events-none ${positionClass}`} aria-hidden>
      <div className="cc-project-atmosphere__particles" />
    </div>
  );
}

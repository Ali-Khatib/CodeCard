'use client';

import { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * CodeCard hero field. Ink + orange + chlorophyll, not the old gray/orange wash
 * and not Integrated Bio's palette. Fast organic mesh; footer uses the same
 * stops as a still CSS field.
 */
export const HERO_FIELD = {
  ink: '#080a09',
  moss: '#1c4636',
  chlorophyll: '#86b54a',
  orange: '#e95a0b',
  copper: '#c45a22',
  bone: '#efe7d4',
} as const;

export const HERO_FIELD_FILL = [
  HERO_FIELD.ink,
  HERO_FIELD.moss,
  HERO_FIELD.orange,
  HERO_FIELD.chlorophyll,
  HERO_FIELD.copper,
  HERO_FIELD.ink,
] as const;

export const HERO_FIELD_WIRE = [
  HERO_FIELD.ink,
  HERO_FIELD.bone,
  HERO_FIELD.chlorophyll,
  HERO_FIELD.orange,
] as const;

type HeroVisualFieldProps = {
  className?: string;
  paused?: boolean;
};

export function HeroVisualField({ className, paused = false }: HeroVisualFieldProps) {
  const reduceMotion = useReducedMotion();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const still = paused || Boolean(reduceMotion);
  const fillSpeed = still ? 0 : compact ? 0.78 : 1.18;
  const wireSpeed = still ? 0 : compact ? 0.52 : 0.88;

  return (
    <div className={cn('cc-shader-hero pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={[...HERO_FIELD_FILL]}
        speed={fillSpeed}
        distortion={0.58}
        swirl={0.34}
        grainMixer={0.05}
        grainOverlay={0.04}
      />
      {!still && !compact ? (
        <MeshGradient
          className="absolute inset-0 h-full w-full opacity-45"
          colors={[...HERO_FIELD_WIRE]}
          speed={wireSpeed}
          distortion={0.42}
          swirl={0.22}
          grainMixer={0}
          grainOverlay={0}
        />
      ) : null}
    </div>
  );
}

export default HeroVisualField;

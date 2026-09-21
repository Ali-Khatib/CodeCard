'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  HeroVisualField,
  HERO_FIELD,
} from '@/components/ui/hero';

export const SHADER_HERO_COLORS = {
  ink: HERO_FIELD.ink,
  stone: HERO_FIELD.moss,
  ash: HERO_FIELD.chlorophyll,
  iris: HERO_FIELD.orange,
  ember: HERO_FIELD.copper,
  paper: HERO_FIELD.bone,
} as const;

type ShaderHeroBackdropProps = {
  className?: string;
  paused?: boolean;
};

/** Full-bleed field behind the pinned landing cinema. */
export function ShaderHeroBackdrop({
  className,
  paused = false,
}: ShaderHeroBackdropProps) {
  return <HeroVisualField className={className} paused={paused} />;
}

type ShaderHeroProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

export function ShaderHero({
  className,
  title = 'Share your work. Keep the connection.',
  subtitle = 'A professional profile built for real-world introductions.',
}: ShaderHeroProps) {
  return (
    <div className={cn('relative min-h-svh w-full overflow-hidden bg-black', className)}>
      <ShaderHeroBackdrop />
      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 text-center">
        <p className="mb-6 text-sm font-medium tracking-[0.18em] text-white/80 uppercase">
          CodeCard
        </p>
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/75 md:text-xl">{subtitle}</p>
        <Button
          size="lg"
          className="mt-10 rounded-full border border-white/40 bg-transparent px-6 py-6 text-lg text-white hover:bg-white/10"
        >
          Start free
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export const Component = ShaderHero;
export default ShaderHero;

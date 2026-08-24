'use client';

import { MeshGradient } from '@paper-design/shaders-react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** CodeCard black + orange + stone gray field. */
export const SHADER_HERO_COLORS = {
  ink: '#0c0c0e',
  stone: '#3c3b39',
  ash: '#5c5856',
  iris: '#e95a0b',
  ember: '#2a1810',
  paper: '#f3e6d8',
} as const;

const FILL = [
  SHADER_HERO_COLORS.ink,
  SHADER_HERO_COLORS.stone,
  SHADER_HERO_COLORS.ember,
  SHADER_HERO_COLORS.iris,
  SHADER_HERO_COLORS.ash,
  SHADER_HERO_COLORS.ink,
] as const;

type ShaderHeroBackdropProps = {
  className?: string;
  paused?: boolean;
};

/** Full-bleed MeshGradient field used behind the pinned landing hero. */
export function ShaderHeroBackdrop({
  className,
  paused = false,
}: ShaderHeroBackdropProps) {
  return (
    <div className={cn('cc-shader-hero pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={[...FILL]}
        speed={paused ? 0 : 0.12}
        distortion={0.4}
        swirl={0.16}
        grainMixer={0.06}
        grainOverlay={0.05}
      />
    </div>
  );
}

type ShaderHeroProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

/**
 * Stock kit shell, retinted to CodeCard orange / white / black.
 * The marketing landing uses `ShaderHeroBackdrop` instead of this copy.
 */
export function ShaderHero({
  className,
  title = 'Your work. One identity.',
  subtitle = 'A black, white, and orange field for the card — not five tabs.',
}: ShaderHeroProps) {
  return (
    <div className={cn('relative min-h-svh w-full overflow-hidden bg-black', className)}>
      <ShaderHeroBackdrop />
      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 text-center">
        <p className="mb-6 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-lg">
          CodeCard
        </p>
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-300 md:text-xl">{subtitle}</p>
        <Button
          size="lg"
          className="mt-10 rounded-2xl bg-[#e95a0b] px-6 py-6 text-lg text-white hover:bg-[#ff6d22]"
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

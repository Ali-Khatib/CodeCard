'use client';

import { HeroAmbientLight } from '@/components/interactions/hero-ambient-light';
import { HeroPreviewDepth } from '@/components/landing/hero-preview-depth';

/** Client island for hero pointer enhancements — safe from Server Component parent. */
export function ProductHeroInteractions() {
  return (
    <>
      <HeroAmbientLight />
      <HeroPreviewDepth />
    </>
  );
}

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/**
 * Cursor-following ambient light for the hero — CSS custom properties only.
 * No canvas/WebGL. Idle until pointer moves; disabled under reduced motion.
 */
export function HeroAmbientLight({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const raf = useRef(0);

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!canEnhanceMotion) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      const el = ref.current;
      if (!el) return;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--hero-light-x', `${x}%`);
        el.style.setProperty('--hero-light-y', `${y}%`);
        el.dataset.active = 'true';
      });
    },
    [canEnhanceMotion],
  );

  useEffect(() => {
    if (!canEnhanceMotion) return;
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    parent.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      parent.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [canEnhanceMotion, onMove]);

  if (!canEnhanceMotion) return null;

  return (
    <div
      ref={ref}
      className={`cc-hero-ambient-light pointer-events-none absolute inset-0 z-0 ${className}`.trim()}
      aria-hidden
      data-testid="hero-ambient-light"
    />
  );
}

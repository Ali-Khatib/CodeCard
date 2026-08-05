'use client';

import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Restrained pointer depth on the hero product preview (`.cc-hume-hero__peek`).
 * Listens on the hero section — never intercepts CTA clicks.
 */
export function HeroPreviewDepth() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const section = document.querySelector<HTMLElement>('[data-testid="hero-section"]');
    const preview = section?.querySelector<HTMLElement>(
      '[data-hero-peek], .cc-hume-hero__peek',
    );
    if (!section || !preview) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        preview.style.transform = `perspective(900px) rotateY(${px * 4}deg) rotateX(${-py * 3}deg)`;
      });
    };
    const onLeave = () => {
      preview.style.transform = '';
    };

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
      preview.style.transform = '';
    };
  }, [reduced]);

  return null;
}

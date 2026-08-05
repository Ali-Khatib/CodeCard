'use client';

import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { MOTION_LIMITS } from '@/components/motion/motion-tokens';

/**
 * Restrained pointer depth on the hero product preview (`.cc-hume-hero__peek`).
 * Listens on the hero section — never intercepts CTA clicks.
 * Preserves the CSS centering translate while applying soft perspective.
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

    const baseTranslate =
      window.matchMedia('(max-width: 640px)').matches
        ? 'translate(-50%, 32%)'
        : 'translate(-50%, 38%)';
    const maxTilt = Math.min(MOTION_LIMITS.cardTiltMaxDeg, 2.5);

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        preview.dataset.depthActive = 'true';
        preview.style.setProperty('--peek-light-x', `${(px + 0.5) * 100}%`);
        preview.style.setProperty('--peek-light-y', `${(py + 0.5) * 100}%`);
        preview.style.transform = `${baseTranslate} perspective(1100px) rotateY(${px * maxTilt}deg) rotateX(${-py * (maxTilt * 0.75)}deg)`;
      });
    };
    const onLeave = () => {
      preview.dataset.depthActive = 'false';
      preview.style.transform = '';
      preview.style.removeProperty('--peek-light-x');
      preview.style.removeProperty('--peek-light-y');
    };

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
      onLeave();
    };
  }, [reduced]);

  return null;
}

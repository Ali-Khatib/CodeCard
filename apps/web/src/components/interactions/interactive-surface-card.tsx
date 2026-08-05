'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { MOTION_LIMITS } from '@/components/motion/motion-tokens';

type InteractiveSurfaceCardProps = {
  children: ReactNode;
  className?: string;
  /** Enable image parallax on `[data-card-media]` child. */
  parallax?: boolean;
  /** Soft lift on hover (CSS). */
  lift?: boolean;
  as?: 'article' | 'div';
};

/**
 * Pointer spotlight + restrained lift/parallax.
 * Spotlight updates CSS variables via rAF — no React re-renders on pointermove.
 */
export function InteractiveSurfaceCard({
  children,
  className = '',
  parallax = true,
  lift = true,
  as: Tag = 'article',
}: InteractiveSurfaceCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (reduced) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.setProperty('--spot-x', `${px * 100}%`);
        el.style.setProperty('--spot-y', `${py * 100}%`);
        el.dataset.spotActive = 'true';
        if (parallax) {
          const media = el.querySelector<HTMLElement>('[data-card-media]');
          if (media) {
            const dx = (px - 0.5) * MOTION_LIMITS.parallaxMaxPx * 0.45;
            const dy = (py - 0.5) * MOTION_LIMITS.parallaxMaxPx * 0.45;
            media.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.03)`;
          }
        }
      });
    },
    [parallax, reduced],
  );

  const onLeave = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      e.currentTarget.dataset.spotActive = 'false';
      e.currentTarget.style.removeProperty('--spot-x');
      e.currentTarget.style.removeProperty('--spot-y');
      if (parallax) {
        const media = e.currentTarget.querySelector<HTMLElement>('[data-card-media]');
        if (media) media.style.transform = '';
      }
    },
    [parallax],
  );

  return (
    <Tag
      ref={ref as never}
      className={`cc-interactive-card ${lift ? 'cc-interactive-card--lift' : ''} ${className}`.trim()}
      style={{ '--spot-x': '50%', '--spot-y': '40%' } as CSSProperties}
      data-motion-pattern="card-spotlight"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Tag>
  );
}

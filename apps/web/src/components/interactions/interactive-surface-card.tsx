'use client';

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
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
 * Pointer spotlight + restrained lift/parallax for marketing and demo cards.
 * Spotlight is CSS-variable driven; parallax is translate-only on media.
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
  const [style, setStyle] = useState<CSSProperties>({});

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reduced) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const next: CSSProperties = {
        '--spot-x': `${px * 100}%`,
        '--spot-y': `${py * 100}%`,
      } as CSSProperties;

      if (parallax) {
        const media = el.querySelector<HTMLElement>('[data-card-media]');
        if (media) {
          const dx = (px - 0.5) * MOTION_LIMITS.parallaxMaxPx * 0.55;
          const dy = (py - 0.5) * MOTION_LIMITS.parallaxMaxPx * 0.55;
          media.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.04)`;
        }
      }
      setStyle(next);
      el.dataset.spotActive = 'true';
    },
    [parallax, reduced],
  );

  const onLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.dataset.spotActive = 'false';
      setStyle({});
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
      style={style}
      data-motion-pattern="card-spotlight"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Tag>
  );
}

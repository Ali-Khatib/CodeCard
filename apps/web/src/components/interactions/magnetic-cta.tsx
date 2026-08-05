'use client';

import {
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_LIMITS, MOTION_SPRING } from '@/components/motion/motion-tokens';

type MagneticCtaProps = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Max pull in px (pointer-fine only). */
  strength?: number;
  'data-testid'?: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'children' | 'className'>;

/**
 * Primary CTA with Motion-owned magnetic pull on fine pointers.
 * Keyboard / touch: no offset — native link behavior.
 */
export function MagneticCta({
  href,
  children,
  className = '',
  strength = 14,
  ...rest
}: MagneticCtaProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduced) return;
      if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
      setOffset({ x, y });
    },
    [reduced, strength],
  );

  const onLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return (
    <motion.div
      className="inline-flex"
      animate={reduced ? undefined : { x: offset.x, y: offset.y }}
      transition={MOTION_SPRING.snappy}
      style={{ willChange: reduced ? undefined : 'transform' }}
    >
      <Link
        ref={ref}
        href={href}
        className={`cc-magnetic-cta cc-btn-glow cc-instant-press ${className}`.trim()}
        data-motion-pattern="button-magnetic"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        {...rest}
      >
        <span className="cc-magnetic-cta__label inline-flex items-center gap-1.5">
          {children}
        </span>
      </Link>
    </motion.div>
  );
}

/** Apply pointer-reactive border glow via CSS variables (fine pointer only). */
export function usePointerGlow(disabled?: boolean) {
  const onMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--glow-x', `${x}%`);
      el.style.setProperty('--glow-y', `${y}%`);
      el.dataset.glowActive = 'true';
    },
    [disabled],
  );

  const onLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.dataset.glowActive = 'false';
  }, []);

  return { onMove, onLeave, maxTilt: MOTION_LIMITS.cardTiltMaxDeg };
}

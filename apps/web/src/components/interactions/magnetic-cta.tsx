'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'motion/react';
import { MOTION_LIMITS } from '@/components/motion/motion-tokens';

type MagneticCtaProps = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Max pull in px (pointer-fine only). */
  strength?: number;
  'data-testid'?: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'children' | 'className'>;

/**
 * Primary CTA with magnetic pull on fine pointers.
 * Offset updates through rAF + CSS vars; keyboard / touch keep native link behavior.
 */
export function MagneticCta({
  href,
  children,
  className = '',
  strength = 12,
  ...rest
}: MagneticCtaProps) {
  const reduced = useReducedMotion();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const flush = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const { x, y } = targetRef.current;
    shell.style.setProperty('--mag-x', `${x}px`);
    shell.style.setProperty('--mag-y', `${y}px`);
  }, []);

  const onMove = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (reduced) return;
      if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
      const el = linkRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      targetRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * strength,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * strength,
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(flush);
    },
    [flush, reduced, strength],
  );

  const onLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(flush);
  }, [flush]);

  return (
    <div
      ref={shellRef}
      className="cc-magnetic-shell inline-flex"
      style={
        reduced
          ? undefined
          : ({
              '--mag-x': '0px',
              '--mag-y': '0px',
              transform: 'translate3d(var(--mag-x), var(--mag-y), 0)',
              transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
            } as CSSProperties)
      }
      data-motion-pattern="button-magnetic"
    >
      <Link
        ref={linkRef}
        href={href}
        className={`cc-magnetic-cta cc-btn-glow cc-instant-press ${className}`.trim()}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        {...rest}
      >
        <span className="cc-magnetic-cta__label inline-flex items-center gap-1.5">
          {children}
        </span>
      </Link>
    </div>
  );
}

/** Apply pointer-reactive border glow via CSS variables (fine pointer only). */
export function usePointerGlow(disabled?: boolean) {
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (disabled) return;
      if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.setProperty('--glow-x', `${x}%`);
        el.style.setProperty('--glow-y', `${y}%`);
        el.dataset.glowActive = 'true';
      });
    },
    [disabled],
  );

  const onLeave = useCallback((e: MouseEvent<HTMLElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    e.currentTarget.dataset.glowActive = 'false';
  }, []);

  return { onMove, onLeave, maxTilt: MOTION_LIMITS.cardTiltMaxDeg };
}
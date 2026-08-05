'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { usePointerGlow } from '@/components/interactions/magnetic-cta';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type GlowPressProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'span';
};

/** Pointer-reactive border glow shell for signature buttons (CSS vars). */
export function GlowPressShell({ children, className = '', as: Tag = 'div' }: GlowPressProps) {
  const reduced = useReducedMotion();
  const { onMove, onLeave } = usePointerGlow(Boolean(reduced));

  return (
    <Tag
      className={`cc-btn-glow-shell inline-flex ${className}`.trim()}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Tag>
  );
}

/** Animated arrow nudge for CTA labels ending in → */
export function CtaArrow({ children = '→' }: { children?: ReactNode }) {
  return (
    <span className="cc-cta-arrow" aria-hidden>
      {children}
    </span>
  );
}

/**
 * Copy success flash — toggles a short CSS class; no Motion required.
 */
export function useCopySuccessFlash(durationMs = 1600) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      el.classList.remove('cc-copy-success');
      // reflow to restart animation
      void el.offsetWidth;
      el.classList.add('cc-copy-success');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => el.classList.remove('cc-copy-success'), durationMs);
    },
    [durationMs],
  );
}

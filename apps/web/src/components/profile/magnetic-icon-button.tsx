'use client';

import { useRef, useCallback, type ReactNode, type MouseEvent, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface MagneticIconButtonProps {
  href: string;
  ariaLabel: string;
  children: ReactNode;
  accent?: string;
  size?: 'md' | 'lg';
}

/**
 * Social icon with fine-pointer magnetism via CSS vars (no re-renders on move).
 */
export function MagneticIconButton({
  href,
  ariaLabel,
  children,
  accent,
  size = 'md',
}: MagneticIconButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rafRef = useRef(0);
  const reduced = useReducedMotion();

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (reduced) return;
      if (!window.matchMedia('(pointer: fine)').matches || !ref.current) return;
      const el = ref.current;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.setProperty('--mag-x', `${x}px`);
        el.style.setProperty('--mag-y', `${y}px`);
      });
    },
    [reduced],
  );

  const onLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mag-x', '0px');
    el.style.setProperty('--mag-y', '0px');
  }, []);

  const dim = size === 'lg' ? 'h-11 w-11' : 'h-10 w-10';

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={ariaLabel}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={reduced ? undefined : { scale: 0.92 }}
      className={`group relative flex ${dim} items-center justify-center rounded-full border border-border bg-surface text-text-secondary backdrop-blur-sm transition-colors hover:text-text-primary cc-social-link-react cc-magnetic-shell`}
      style={
        reduced
          ? undefined
          : ({
              '--mag-x': '0px',
              '--mag-y': '0px',
              transform: 'translate3d(var(--mag-x), var(--mag-y), 0)',
              transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
            } as CSSProperties)
      }
    >
      <span className="text-lg">{children}</span>
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          boxShadow: accent ? `0 0 20px ${accent}33` : '0 0 16px rgba(255,255,255,0.06)',
        }}
      />
      <span className="cc-external-link-indicator sr-only">Opens in a new tab</span>
    </motion.a>
  );
}

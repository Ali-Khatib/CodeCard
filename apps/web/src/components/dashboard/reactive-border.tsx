'use client';

import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

type ReactiveBorderProps = {
  children: ReactNode;
  className?: string;
  glowRgb?: string;
  as?: 'div' | 'article' | 'section';
  style?: CSSProperties;
  /** Subtle lift on hover — disable on click-heavy cards to avoid flash */
  liftOnHover?: boolean;
  /** Scale-down on tap — disable when nested buttons handle press feedback */
  pressOnTap?: boolean;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
};

const MOTION_TAGS = {
  div: motion.div,
  article: motion.article,
  section: motion.section,
} as const;

const HOVER_SPRING = { type: 'spring', stiffness: 400, damping: 28 } as const;

export function ReactiveBorder({
  children,
  className,
  glowRgb = '192, 148, 228',
  as: Tag = 'div',
  style,
  liftOnHover = true,
  pressOnTap = true,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  'aria-label': ariaLabel,
}: ReactiveBorderProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const MotionTag = MOTION_TAGS[Tag];

  const onMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--rx', `${x}%`);
    el.style.setProperty('--ry', `${y}%`);
  }, []);

  const onLeave = useCallback(() => {
    ref.current?.style.setProperty('--rx', '50%');
    ref.current?.style.setProperty('--ry', '50%');
  }, []);

  return (
    <MotionTag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn('cc-reactive-border', className)}
      style={{ '--glow-rgb': glowRgb, ...style } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      whileHover={reduced || !liftOnHover ? undefined : { y: -4, scale: 1.01 }}
      whileTap={reduced || !pressOnTap ? undefined : { scale: 0.985 }}
      transition={HOVER_SPRING}
    >
      {children}
    </MotionTag>
  );
}

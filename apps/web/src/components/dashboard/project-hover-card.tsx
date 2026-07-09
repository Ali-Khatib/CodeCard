'use client';

import { useCallback, useRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

type ProjectHoverCardProps = ComponentPropsWithoutRef<'article'> & {
  className?: string;
};

export function ProjectHoverCard({ children, className, onPointerMove, onPointerLeave, style, ...props }: ProjectHoverCardProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    },
    [reduced],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
  }, []);

  return (
    <article
      {...props}
      ref={ref}
      className={cn('cc-project-hover-card', className)}
      onPointerMove={(event) => {
        onMove(event);
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        onLeave();
        onPointerLeave?.(event);
      }}
      style={{ '--mx': '50%', '--my': '50%', ...style } as CSSProperties}
    >
      <span className="cc-project-hover-card__spotlight" aria-hidden />
      <span className="cc-project-hover-card__sheen" aria-hidden />
      {children}
    </article>
  );
}

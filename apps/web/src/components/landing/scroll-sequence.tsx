'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type ScrollSequenceProps<T> = {
  items: readonly T[];
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode;
  /** Viewport heights of scroll runway per item */
  stepVh?: number;
  className?: string;
  stageClassName?: string;
  onActiveChange?: (index: number) => void;
};

export function ScrollSequence<T>({
  items,
  renderItem,
  stepVh = 55,
  className = '',
  stageClassName = '',
  onActiveChange,
}: ScrollSequenceProps<T>) {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const runwayRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(items.length - 1, Math.max(0, index));
      if (activeRef.current === next) return;
      activeRef.current = next;
      setActive(next);
      onActiveChange?.(next);
    },
    [items.length, onActiveChange],
  );

  useEffect(() => {
    if (reducedMotion) return;

    let raf = 0;
    const measure = () => {
      const runway = runwayRef.current;
      if (!runway) return;
      const rect = runway.getBoundingClientRect();
      const stepPx = window.innerHeight * (stepVh / 100);
      const scrolled = Math.max(0, -rect.top);
      goTo(Math.floor(scrolled / stepPx));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [goTo, reducedMotion, stepVh]);

  if (reducedMotion) {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div key={i} className="py-8">
            {renderItem(item, i, true)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={runwayRef}
      className={`cc-scroll-sequence ${className}`.trim()}
      style={{ minHeight: `${items.length * stepVh}vh` }}
    >
      <div className={`cc-scroll-sequence__stage sticky top-[22vh] ${stageClassName}`.trim()}>
        {items.map((item, i) => {
          const isActive = i === active;
          const distance = Math.abs(i - active);
          return (
            <div
              key={i}
              className="cc-scroll-sequence__item"
              data-active={isActive}
              data-distance={distance}
              aria-hidden={!isActive}
            >
              {renderItem(item, i, isActive)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

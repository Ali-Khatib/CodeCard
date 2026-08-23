'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function CountUp({
  value,
  durationMs = 1200,
}: {
  value: number;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    const format = (n: number) => Math.max(0, Math.round(n)).toLocaleString('en-US');

    if (reduced) {
      el.textContent = format(safe);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      const eased = 1 - (1 - t) ** 3;
      el.textContent = format(eased * safe);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reduced]);

  return <span ref={ref}>0</span>;
}

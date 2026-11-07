'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, type ReactNode } from 'react';
import type { GuideShotId } from '@/lib/marketing/guide-content';
import type { EditorialProductState } from '@/components/landing/editorial/editorial-product-frame';

const EditorialProductFrame = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-product-frame').then(
      (m) => m.EditorialProductFrame,
    ),
  { ssr: false, loading: () => <div className="pl-stage__hold" /> },
);

const DESIGN_WIDTH = 1180;

/**
 * Real product surfaces, shown at their real size.
 *
 * The app renders at a desktop width; below that the whole surface is scaled
 * down rather than reflowed, so a visitor sees the product as it actually is
 * instead of a cropped slice or a squeezed layout. The wrapper takes the
 * scaled height so nothing overlaps what follows.
 */
export function ProductStage({
  state,
  shot,
  children,
}: {
  state?: EditorialProductState;
  shot?: GuideShotId;
  children?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = box.current;
    const el = inner.current;
    if (!b || !el) return;

    /* The surface is scaled to the box's width and cropped at its bottom
       edge, the way a screenshot of an app is cropped at the fold. Letting
       it run to its full page height would add two thousand pixels of
       scroll per section. The box owns the height; this only sets scale. */
    const fit = () => {
      const k = Math.min(1, b.clientWidth / DESIGN_WIDTH);
      el.style.transform = k === 1 ? 'none' : `scale(${k})`;
      el.style.width = k === 1 ? '100%' : `${DESIGN_WIDTH}px`;
    };

    fit();
    const t = window.setTimeout(fit, 450);
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [state, shot]);

  return (
    <div ref={box} className="pl-stage">
      <div ref={inner} className="pl-stage__in">
        {children ?? <EditorialProductFrame state={state} shot={shot} fit="content" />}
      </div>
    </div>
  );
}

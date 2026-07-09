'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ALTERNATING_RESEARCH } from '@/lib/research/alternating-insights';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { SourceInfoIcon } from './source-drawer';

const STEP_VH = 42;
const FINAL_HOLD_VH = 24;
const ITEMS = ALTERNATING_RESEARCH;
const COMPACT_QUERY = '(max-width: 1099px)';

function ResearchPair({
  item,
  index,
  active,
}: {
  item: (typeof ITEMS)[number];
  index: number;
  active: boolean;
}) {
  return (
    <motion.article
      className="cc-research-crossfade__item"
      aria-hidden={!active}
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 18,
        filter: active ? 'blur(0px)' : 'blur(8px)',
      }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cc-research-crossfade__source">
        <div className="cc-research-crossfade__rule" aria-hidden />
        <p className="cc-research-crossfade__eyebrow">Study finding</p>
        <blockquote>&ldquo;{item.paperQuote}&rdquo;</blockquote>
        <p className="cc-research-crossfade__cite">{item.citation}</p>
      </div>

      <div className="cc-research-crossfade__explain">
        <div className="flex items-center justify-between gap-3">
          <span className="cc-research-crossfade__pill">{item.category}</span>
          <SourceInfoIcon sourceId={item.sourceId} className="h-7 w-7 text-[15px]" />
        </div>
        <p className="cc-research-crossfade__count">{String(index + 1).padStart(2, '0')}</p>
        <h3>{item.humanHeadline}</h3>
        <p>{item.humanBody}</p>
      </div>
    </motion.article>
  );
}

export function ResearchAlternatingRows() {
  const reducedMotion = useReducedMotion();
  const [compactLayout, setCompactLayout] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const useStaticLayout = reducedMotion || compactLayout;

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    setCompactLayout(mq.matches);
    const handler = () => setCompactLayout(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const goTo = useCallback((index: number) => {
    const next = Math.min(ITEMS.length - 1, Math.max(0, index));
    if (activeRef.current === next) return;
    activeRef.current = next;
    setActive(next);
  }, []);

  useEffect(() => {
    if (useStaticLayout) return;

    let raf = 0;
    const measure = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const stepPx = window.innerHeight * (STEP_VH / 100);
      const scrolled = Math.max(0, -rect.top);
      goTo(Math.min(ITEMS.length - 1, Math.floor(scrolled / stepPx)));
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
  }, [goTo, useStaticLayout]);

  if (useStaticLayout) {
    return (
      <div className="cc-research-alt-stack">
        {ITEMS.map((item, index) => (
          <ResearchPair key={item.id} item={item} index={index} active />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="cc-research-crossfade"
      style={{ minHeight: `${ITEMS.length * STEP_VH + FINAL_HOLD_VH}vh` }}
    >
      <div className="cc-research-crossfade__stage">
        {ITEMS.map((item, index) => (
          <ResearchPair key={item.id} item={item} index={index} active={index === active} />
        ))}
      </div>
    </div>
  );
}

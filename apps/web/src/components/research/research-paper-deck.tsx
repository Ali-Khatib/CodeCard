'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion as useMotionReducedMotion } from 'motion/react';
import { ALTERNATING_RESEARCH } from '@/lib/research/alternating-insights';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { SourceInfoIcon } from './source-drawer';

const ACCENT_CLASS: Record<(typeof ALTERNATING_RESEARCH)[number]['accent'], string> = {
  lavender: 'cc-research-card--lavender',
  peach: 'cc-research-card--peach',
  mint: 'cc-research-card--mint',
};

const WHEEL_COOLDOWN_MS = 520;
const DRAG_THRESHOLD = 56;
const ITEMS = ALTERNATING_RESEARCH;

function ResearchDeckCard({
  item,
  distance,
  isActive,
  onDragEnd,
}: {
  item: (typeof ALTERNATING_RESEARCH)[number];
  distance: number;
  isActive: boolean;
  onDragEnd: (offsetY: number) => void;
}) {
  const absDist = Math.abs(distance);
  const y = distance * 76;
  const scale = isActive ? 1 : Math.max(0.78, 0.9 - absDist * 0.05);
  const rotateX = distance * -8;
  const opacity = isActive ? 1 : Math.max(0.12, 0.38 - absDist * 0.1);
  const zIndex = 30 - absDist;

  return (
    <motion.article
      className={`cc-research-paper-deck__card cc-research-card ${ACCENT_CLASS[item.accent]} ${
        isActive ? 'cc-research-paper-deck__card--active' : ''
      }`}
      data-distance={absDist}
      style={{
        zIndex,
        transformOrigin: 'center top',
      }}
      animate={{
        y,
        scale,
        rotateX,
        opacity,
      }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      drag={isActive ? 'y' : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={(_, info) => onDragEnd(info.offset.y)}
      aria-hidden={!isActive}
    >
      <div className="cc-research-card__widget" aria-hidden>
        <div className="cc-research-card__widget-inner">
          <span className="cc-research-card__widget-label">Study finding</span>
          <blockquote className="cc-research-card__widget-quote">
            &ldquo;{item.paperQuote}&rdquo;
          </blockquote>
          <footer className="cc-research-card__widget-cite">{item.citation}</footer>
        </div>
      </div>

      <div className="cc-research-card__content">
        <div className="flex items-center justify-between gap-3">
          <span className="cc-research-card__pill">{item.category}</span>
          <SourceInfoIcon sourceId={item.sourceId} className="h-7 w-7 text-[15px]" />
        </div>
        <h3 className="cc-research-card__title">{item.humanHeadline}</h3>
        <p className="cc-research-card__body">{item.humanBody}</p>
      </div>
    </motion.article>
  );
}

export function ResearchPaperDeck() {
  const reducedMotion = useReducedMotion();
  const motionReduced = useMotionReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const wheelLockRef = useRef(false);
  const engagedRef = useRef(false);
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);

  const goTo = useCallback((index: number) => {
    const next = Math.min(ITEMS.length - 1, Math.max(0, index));
    if (activeRef.current === next) return;
    activeRef.current = next;
    setActive(next);
  }, []);

  const advance = useCallback(
    (delta: number) => {
      goTo(activeRef.current + delta);
    },
    [goTo],
  );

  const handleDragEnd = useCallback(
    (offsetY: number) => {
      if (offsetY < -DRAG_THRESHOLD) advance(1);
      else if (offsetY > DRAG_THRESHOLD) advance(-1);
    },
    [advance],
  );

  useEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isEngaged = entry.isIntersecting && entry.intersectionRatio >= 0.55;
        engagedRef.current = isEngaged;
        setEngaged(isEngaged);
      },
      { threshold: [0.35, 0.55, 0.75] },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const onWheel = (e: WheelEvent) => {
      if (!engagedRef.current) return;

      const atStart = activeRef.current === 0;
      const atEnd = activeRef.current === ITEMS.length - 1;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;

      if ((atStart && scrollingUp) || (atEnd && scrollingDown)) return;

      e.preventDefault();

      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      advance(scrollingDown ? 1 : -1);
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, WHEEL_COOLDOWN_MS);
    };

    const onKey = (e: KeyboardEvent) => {
      if (!engagedRef.current) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        advance(1);
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        advance(-1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [advance, reducedMotion]);

  if (reducedMotion || motionReduced) {
    return (
      <section ref={sectionRef} className="cc-research-paper-deck cc-research-paper-deck--static">
        <div className="cc-research-paper-deck__static-stack">
          {ITEMS.map((item) => (
            <article
              key={item.id}
              className={`cc-research-card ${ACCENT_CLASS[item.accent]}`}
            >
              <div className="cc-research-card__widget" aria-hidden>
                <div className="cc-research-card__widget-inner">
                  <span className="cc-research-card__widget-label">Study finding</span>
                  <blockquote className="cc-research-card__widget-quote">
                    &ldquo;{item.paperQuote}&rdquo;
                  </blockquote>
                  <footer className="cc-research-card__widget-cite">{item.citation}</footer>
                </div>
              </div>
              <div className="cc-research-card__content">
                <div className="flex items-center justify-between gap-3">
                  <span className="cc-research-card__pill">{item.category}</span>
                  <SourceInfoIcon sourceId={item.sourceId} className="h-7 w-7 text-[15px]" />
                </div>
                <h3 className="cc-research-card__title">{item.humanHeadline}</h3>
                <p className="cc-research-card__body">{item.humanBody}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`cc-research-paper-deck ${engaged ? 'cc-research-paper-deck--engaged' : ''}`}
      aria-label="Research findings deck"
    >
      <div className="cc-research-paper-deck__stage">
        <div className="cc-research-paper-deck__counter font-eyebrow" aria-live="polite">
          <span className="cc-research-paper-deck__counter-active">
            {String(active + 1).padStart(2, '0')}
          </span>
          <span className="cc-research-paper-deck__counter-sep">/</span>
          <span className="cc-research-paper-deck__counter-total">
            {String(ITEMS.length).padStart(2, '0')}
          </span>
        </div>

        <nav className="cc-research-paper-deck__dots" aria-label="Research card navigation">
          {ITEMS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`cc-research-paper-deck__dot ${i === active ? 'cc-research-paper-deck__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to ${item.category} finding`}
              aria-current={i === active ? 'true' : undefined}
            />
          ))}
        </nav>

        <div className="cc-research-paper-deck__stack">
          {ITEMS.map((item, i) => (
            <ResearchDeckCard
              key={item.id}
              item={item}
              distance={i - active}
              isActive={i === active}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        <p className="cc-research-paper-deck__hint font-eyebrow" aria-hidden>
          Scroll · drag · ↑↓
        </p>
      </div>
    </section>
  );
}

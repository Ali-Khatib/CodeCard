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

const ITEMS = ALTERNATING_RESEARCH;
const SCROLL_RUNWAY_VH = 72;

function ResearchDeckCard({ item }: { item: (typeof ALTERNATING_RESEARCH)[number] }) {
  return (
    <motion.article
      key={item.id}
      className={`cc-research-paper-deck__card cc-research-card cc-research-paper-deck__card--active ${ACCENT_CLASS[item.accent]}`}
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
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
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    const next = Math.min(ITEMS.length - 1, Math.max(0, index));
    if (activeRef.current === next) return;
    activeRef.current = next;
    setActive(next);
  }, []);

  const scrollToCard = useCallback((index: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const next = Math.min(ITEMS.length - 1, Math.max(0, index));
    const maxScroll = Math.max(section.offsetHeight - window.innerHeight, 1);
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + maxScroll * (next / Math.max(ITEMS.length - 1, 1)),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let raf = 0;
    const measure = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const maxScroll = Math.max(section.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), maxScroll);
      const progress = scrolled / maxScroll;
      goTo(Math.round(progress * (ITEMS.length - 1)));
    };

    const onKey = (e: KeyboardEvent) => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
      if (!inView) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        scrollToCard(activeRef.current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        scrollToCard(activeRef.current - 1);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
    };
  }, [goTo, reducedMotion, scrollToCard]);

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
      className="cc-research-paper-deck"
      style={{ minHeight: `${100 + (ITEMS.length - 1) * SCROLL_RUNWAY_VH}vh` }}
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
              onClick={() => scrollToCard(i)}
              aria-label={`Go to ${item.category} finding`}
              aria-current={i === active ? 'true' : undefined}
            />
          ))}
        </nav>

        <div className="cc-research-paper-deck__stack">
          <ResearchDeckCard item={ITEMS[active]} />
        </div>

        <p className="cc-research-paper-deck__hint font-eyebrow" aria-hidden>
          Scroll to change findings
        </p>
      </div>
    </section>
  );
}

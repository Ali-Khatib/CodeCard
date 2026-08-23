'use client';

import { useRef } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useState } from 'react';
import { ShaderHeroBackdrop } from '@/components/ui/shader-hero';

const BEATS = [
  {
    id: 'problem',
    lead: 'YOUR BEST WORK SHOULDN’T',
    sub: 'LIVE IN FIVE PLACES.',
    title: 'YOUR BEST WORK SHOULDN’T LIVE IN FIVE PLACES.',
    lede:
      'Projects, research, Circle, and connections belong in one shareable identity — not five tabs someone never opens.',
  },
  {
    id: 'shift',
    lead: 'DON’T SEND A LINK AND HOPE.',
    sub: 'SHOW THE WORK ON THE SPOT.',
    title: 'DON’T SEND A LINK AND HOPE. SHOW THE WORK ON THE SPOT.',
    lede:
      'The quickest way to showcase exactly what you do, so people see it clearly right away — not after they guess what a link means.',
  },
  {
    id: 'identity',
    lead: 'CARRY THE CARD.',
    sub: 'NOT FIVE TABS.',
    title: 'CARRY THE CARD. NOT FIVE TABS.',
    lede:
      'Hand someone your CodeCard. They see the work, the papers, and the people in one profile — without hunting across tabs.',
  },
] as const;

const TOTAL = BEATS.length;

function wordsOf(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function RevealWord({
  word,
  index,
  count,
  progress,
  rangeStart,
  rangeEnd,
  reduced,
}: {
  word: string;
  index: number;
  count: number;
  progress: MotionValue<number>;
  rangeStart: number;
  rangeEnd: number;
  reduced: boolean;
}) {
  const span = Math.max(rangeEnd - rangeStart, 0.001);
  const start = rangeStart + (index / Math.max(count, 1)) * span * 0.82;
  const end = Math.min(start + span * 0.14, rangeEnd);
  const opacity = useTransform(progress, [start, end], [0.28, 1]);

  return (
    <motion.span
      className="cc-ed-statement-scene__word"
      style={reduced ? { opacity: 1 } : { opacity }}
      data-statement-word
    >
      {word}{' '}
    </motion.span>
  );
}

function ChapterCopy({
  beat,
  progress,
  rangeStart,
  rangeEnd,
  reduced,
  active,
}: {
  beat: (typeof BEATS)[number];
  progress: MotionValue<number>;
  rangeStart: number;
  rangeEnd: number;
  reduced: boolean;
  active: boolean;
}) {
  const lead = wordsOf(beat.lead);
  const sub = wordsOf(beat.sub);
  const all = [...lead, ...sub];
  const mid = rangeStart + (rangeEnd - rangeStart) * 0.55;
  const ledeOpacity = useTransform(progress, [mid, rangeEnd - 0.04], [0.2, 1]);
  const ledeY = useTransform(progress, [mid, rangeEnd - 0.04], [12, 0]);

  return (
    <article
      className="cc-ed-statement-scene__beat"
      data-statement-beat={beat.id}
      data-active={active ? 'true' : 'false'}
      aria-hidden={!active}
    >
      <h2 className="cc-ed-statement-scene__headline" aria-label={beat.title}>
        <span className="cc-ed-statement-scene__lead">
          {lead.map((word, i) => (
            <RevealWord
              key={`l-${word}-${i}`}
              word={word}
              index={i}
              count={all.length}
              progress={progress}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              reduced={reduced}
            />
          ))}
        </span>
        <span className="cc-ed-statement-scene__sub">
          {sub.map((word, i) => (
            <RevealWord
              key={`s-${word}-${i}`}
              word={word}
              index={lead.length + i}
              count={all.length}
              progress={progress}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              reduced={reduced}
            />
          ))}
        </span>
      </h2>
      <motion.p
        className="cc-ed-statement-scene__lede"
        style={reduced ? undefined : { opacity: ledeOpacity, y: ledeY }}
      >
        {beat.lede}
      </motion.p>
    </article>
  );
}

/**
 * Post-hero storytelling: sticky stage + scroll-linked word reveal.
 * Separate from Research — Motion owns this section.
 */
export function EditorialStatementScene() {
  const trackRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  const [chapter, setChapter] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(TOTAL - 1, Math.floor(v * TOTAL));
    setChapter((prev) => (prev === next ? prev : next));
  });

  const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1]);

  return (
    <section
      ref={trackRef}
      id="statement"
      className="cc-ed-statement-scene"
      data-chapter-section="statement"
      data-testid="editorial-statement"
      data-motion-pattern="reveal-editorial"
      data-motion-owner="motion"
      aria-labelledby="editorial-statement-heading"
    >
      <div className="cc-ed-statement-scene__sticky">
        <div className="cc-ed-statement-scene__frame">
          <motion.div
            className="cc-ed-statement-scene__bg"
            aria-hidden
            style={reduced ? undefined : { scale: bgScale }}
          >
            <ShaderHeroBackdrop />
            <div className="cc-ed-statement-scene__veil" />
          </motion.div>

          <div className="cc-ed-statement-scene__chrome">
            <p className="cc-ed-statement-scene__tag">
              <span className="cc-ed-statement-scene__tag-mark" aria-hidden />
              What this is
            </p>
            <p className="cc-ed-statement-scene__pager" aria-live="polite">
              <span data-statement-index>
                {String(chapter + 1).padStart(2, '0')}
              </span>
              <span className="cc-ed-statement-scene__pager-total"> / 03</span>
            </p>
          </div>

          <div className="cc-ed-statement-scene__stage">
            {BEATS.map((beat, i) => {
              const rangeStart = i / TOTAL;
              const rangeEnd = (i + 1) / TOTAL;
              const isFirst = i === 0;
              return (
                <div
                  key={beat.id}
                  className="cc-ed-statement-scene__slot"
                  style={{
                    opacity: reduced || chapter === i ? 1 : 0,
                    pointerEvents: chapter === i ? 'auto' : 'none',
                  }}
                >
                  <ChapterCopy
                    beat={beat}
                    progress={scrollYProgress}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    reduced={reduced}
                    active={chapter === i}
                  />
                  {isFirst ? (
                    <span id="editorial-statement-heading" className="sr-only">
                      {beat.title}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

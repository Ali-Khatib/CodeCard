'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';

/** Unique on landing — scientists working on computers in a laboratory. */
const RESEARCH_IMAGE =
  'https://images.unsplash.com/photo-1766297247924-6638d54e7c89?auto=format&fit=crop&w=1600&q=75';

const MARKER = 'Attention window';
const HEADLINE_LINE_1 = 'YOUR BEST WORK';
const HEADLINE_LINE_2 = 'NEVER GETS THE GLANCE.';
const HEADLINE_FULL = 'Your best work never gets the glance.';
const RESEARCH_BODY =
  'Eye-tracking research shows first looks often last only a few seconds. Name, school, and title get seen. Real projects get skipped.';
const SOLUTION_BODY =
  'CodeCard puts your projects up front. The good stuff shows before the glance is over.';

function RedactedWord({
  word,
  progress,
  rangeStart,
  rangeEnd,
  reduced,
}: {
  word: string;
  progress: MotionValue<number>;
  rangeStart: number;
  rangeEnd: number;
  reduced: boolean;
}) {
  const maskScale = useTransform(progress, [rangeStart, rangeEnd], [1, 0]);

  return (
    <span className="cc-ed-research-redact__word">
      <span className="cc-ed-research-redact__text">{word}</span>
      {reduced ? null : (
        <motion.span
          className="cc-ed-research-redact__mask"
          style={{ scaleX: maskScale }}
          aria-hidden
        />
      )}
      {' '}
    </span>
  );
}

function RedactedLine({
  text,
  progress,
  rangeStart,
  rangeEnd,
  reduced,
  accent,
}: {
  text: string;
  progress: MotionValue<number>;
  rangeStart: number;
  rangeEnd: number;
  reduced: boolean;
  accent?: boolean;
}) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const span = Math.max(rangeEnd - rangeStart, 0.001);

  return (
    <span
      className={
        accent
          ? 'cc-ed-research-story__headline-line cc-ed-research-story__headline-line--accent'
          : 'cc-ed-research-story__headline-line'
      }
    >
      {words.map((word, i) => {
        const start = rangeStart + (i / words.length) * span * 0.88;
        const end = Math.min(start + span / words.length, rangeEnd);
        return (
          <RedactedWord
            key={`${word}-${i}`}
            word={word}
            progress={progress}
            rangeStart={start}
            rangeEnd={end}
            reduced={reduced}
          />
        );
      })}
    </span>
  );
}

/**
 * Single editorial research composition — scroll-driven headline redaction.
 */
export function EditorialResearchStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() === true;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'center 0.25'],
  });

  const imageOpacity = useTransform(scrollYProgress, [0, 0.18], [0, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 0.18], [1.03, 1]);
  const imageClip = useTransform(
    scrollYProgress,
    [0, 0.22],
    ['inset(8% 8% 8% 8% round 18px)', 'inset(0% 0% 0% 0% round 18px)'],
  );
  const bodyOpacity = useTransform(scrollYProgress, [0.55, 0.9], [0.72, 1]);

  return (
    <article
      ref={sectionRef}
      className="cc-ed-research-story"
      data-testid="editorial-research-story"
      aria-label={MARKER}
    >
      <div className="cc-ed-research-story__grid">
        <motion.div
          className="cc-ed-research-story__media"
          style={
            reduced
              ? undefined
              : {
                  opacity: imageOpacity,
                  scale: imageScale,
                  clipPath: imageClip,
                }
          }
        >
          <Image
            src={RESEARCH_IMAGE}
            alt="Two scientists working on computers in a laboratory"
            fill
            sizes="(max-width: 900px) 92vw, 46vw"
            className="cc-ed-research-story__img"
          />
        </motion.div>

        <div className="cc-ed-research-story__copy">
          <p className="cc-ed-research-story__marker">{MARKER}</p>

          <h3
            className="cc-ed-research-story__headline cc-ed-research-redact"
            aria-label={HEADLINE_FULL}
            data-research-reveal
          >
            <RedactedLine
              text={HEADLINE_LINE_1}
              progress={scrollYProgress}
              rangeStart={0.08}
              rangeEnd={0.48}
              reduced={reduced}
            />
            <RedactedLine
              text={HEADLINE_LINE_2}
              progress={scrollYProgress}
              rangeStart={0.32}
              rangeEnd={0.88}
              reduced={reduced}
              accent
            />
          </h3>

          <motion.div
            className="cc-ed-research-story__columns"
            style={reduced ? undefined : { opacity: bodyOpacity }}
          >
            <p className="cc-ed-research-story__body">{RESEARCH_BODY}</p>
            <p className="cc-ed-research-story__body">
              {SOLUTION_BODY.split(/(CodeCard)/g).map((part, i) =>
                part === 'CodeCard' ? (
                  <span key={i} className="cc-ed-research-story__brand">
                    CodeCard
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </p>
          </motion.div>

          <div className="cc-ed-research-story__cta cc-ed-research-story__cta-group">
            <Link
              href="/research"
              className="cc-ed-research-story__cta-main cc-instant-press"
            >
              Learn more about the research
            </Link>
            <Link
              href="/research"
              className="cc-ed-research-story__cta-arrow cc-instant-press"
              aria-label="Open research papers"
            >
              →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

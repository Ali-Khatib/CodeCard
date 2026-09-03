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

export type EditorialResearchBeat = {
  id: string;
  index: string;
  marker: string;
  problemTitle: string;
  problemLead: string;
  problemSub: string;
  researchBody: string;
  solutionBody: string;
  imageSrc: string;
  imageAlt: string;
};

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
  const maskScale = useTransform(progress, [rangeStart, rangeEnd], [1, 0], {
    clamp: true,
  });

  return (
    <span className="cc-ed-research-redact__word">
      <span className="cc-ed-research-redact__text">{word}</span>
      {reduced ? null : (
        <motion.span
          className="cc-ed-research-redact__mask"
          style={{ scaleX: maskScale }}
          aria-hidden
        />
      )}{' '}
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
        const start = rangeStart + (i / words.length) * span * 0.85;
        const end = Math.min(start + span / words.length + 0.02, rangeEnd);
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

function ResearchChapter({
  beat,
  flip,
}: {
  beat: EditorialResearchBeat;
  flip?: boolean;
}) {
  const chapterRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({
    target: chapterRef,
    offset: ['start 0.85', 'center 0.35'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.45], [1.06, 1], {
    clamp: true,
  });
  const bodyOpacity = useTransform(scrollYProgress, [0, 0.28], [0.7, 1], {
    clamp: true,
  });
  const bodyY = useTransform(scrollYProgress, [0, 0.28], [14, 0], {
    clamp: true,
  });

  return (
    <section
      ref={chapterRef}
      className={
        flip
          ? 'cc-ed-research-story__beat cc-ed-research-story__beat--flip'
          : 'cc-ed-research-story__beat'
      }
      data-testid={`editorial-proof-box-${beat.id}`}
      aria-label={`${beat.index} ${beat.marker}`}
    >
      <div className="cc-ed-research-story__frame">
        <div className="cc-ed-research-story__grid">
          <motion.div
            className="cc-ed-research-story__media"
            style={reduced ? undefined : { scale: imageScale }}
          >
            <Image
              src={beat.imageSrc}
              alt={beat.imageAlt}
              fill
              priority={beat.id === 'attention'}
              sizes="(max-width: 900px) 92vw, 44vw"
              className="cc-ed-research-story__img"
            />
          </motion.div>

          <div className="cc-ed-research-story__copy">
            <p className="cc-ed-research-story__marker">
              <span className="cc-ed-research-story__index">{beat.index}</span>
              {beat.marker}
            </p>

            <h3
              className="cc-ed-research-story__headline cc-ed-research-redact"
              aria-label={beat.problemTitle}
              data-research-reveal
            >
              <RedactedLine
                text={beat.problemLead}
                progress={scrollYProgress}
                rangeStart={0}
                rangeEnd={0.32}
                reduced={reduced}
              />
              <RedactedLine
                text={beat.problemSub}
                progress={scrollYProgress}
                rangeStart={0.12}
                rangeEnd={0.48}
                reduced={reduced}
                accent
              />
            </h3>

            <motion.div
              className="cc-ed-research-story__columns"
              style={
                reduced ? undefined : { opacity: bodyOpacity, y: bodyY }
              }
            >
              <p className="cc-ed-research-story__body" data-research-reveal>
                {beat.researchBody}
              </p>
              <p className="cc-ed-research-story__body" data-research-reveal>
                {beat.solutionBody.split(/(CodeCard)/g).map((part, i) =>
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
      </div>
    </section>
  );
}

export function EditorialResearchStory({
  beats,
}: {
  beats: EditorialResearchBeat[];
}) {
  return (
    <div className="cc-ed-research-story" data-testid="editorial-research-story">
      {beats.map((beat, i) => (
        <ResearchChapter key={beat.id} beat={beat} flip={i % 2 === 1} />
      ))}
    </div>
  );
}

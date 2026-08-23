'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';

export type EditorialResearchBeat = {
  id: string;
  index: string;
  marker: string;
  /** Full phrase for screen readers */
  problemTitle: string;
  problemLead: string;
  problemSub: string;
  researchBody: string;
  solutionBody: string;
  imageSrc: string;
  imageAlt: string;
};

const CHAPTER_TOTAL = '03';

function ResearchChapter({
  beat,
  total,
}: {
  beat: EditorialResearchBeat;
  total: string;
}) {
  const chapterRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({
    target: chapterRef,
    offset: ['start 85%', 'start 35%'],
  });

  const imageOpacity = useTransform(scrollYProgress, [0, 1], [0.72, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.03, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const copyOpacity = useTransform(scrollYProgress, [0.08, 1], [0.55, 1]);
  const copyY = useTransform(scrollYProgress, [0.08, 1], [16, 0]);

  return (
    <section
      ref={chapterRef}
      className="cc-ed-research-story__beat"
      data-testid={`editorial-proof-box-${beat.id}`}
      aria-label={`${beat.index} ${beat.marker}`}
    >
      <div className="cc-ed-research-story__stage">
        <p className="cc-ed-research-story__pager" aria-live="polite">
          <span className="cc-ed-research-story__pager-now">{beat.index}</span>
          <span className="cc-ed-research-story__pager-total"> / {total}</span>
        </p>

        <div className="cc-ed-research-story__grid">
          <motion.div
            className="cc-ed-research-story__media"
            style={
              reduced
                ? undefined
                : { opacity: imageOpacity, scale: imageScale, y: imageY }
            }
          >
            <Image
              src={beat.imageSrc}
              alt={beat.imageAlt}
              fill
              sizes="(max-width: 900px) 92vw, 46vw"
              className="cc-ed-research-story__img"
            />
          </motion.div>

          <motion.div
            className="cc-ed-research-story__copy"
            style={reduced ? undefined : { opacity: copyOpacity, y: copyY }}
          >
            <p className="cc-ed-research-story__marker">{beat.marker}</p>
            <h3
              className="cc-ed-research-story__headline"
              aria-label={beat.problemTitle}
              data-research-reveal
            >
              <span className="cc-ed-research-story__headline-line">
                {beat.problemLead}
              </span>
              <span className="cc-ed-research-story__headline-line cc-ed-research-story__headline-line--accent">
                {beat.problemSub}
              </span>
            </h3>

            <div className="cc-ed-research-story__columns">
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
            </div>

            <div className="cc-ed-research-story__cta">
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
          </motion.div>
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
      {beats.map((beat) => (
        <ResearchChapter key={beat.id} beat={beat} total={CHAPTER_TOTAL} />
      ))}
    </div>
  );
}

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
  problemTitle: string;
  problemLead: string;
  problemSub: string;
  researchBody: string;
  solutionBody: string;
  imageSrc: string;
  imageAlt: string;
};

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
    offset: ['start 90%', 'start 45%'],
  });

  const imageOpacity = useTransform(scrollYProgress, [0, 1], [0.78, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1]);
  const copyOpacity = useTransform(scrollYProgress, [0.1, 1], [0.6, 1]);
  const copyY = useTransform(scrollYProgress, [0.1, 1], [14, 0]);

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
            style={
              reduced
                ? undefined
                : { opacity: imageOpacity, scale: imageScale }
            }
          >
            <Image
              src={beat.imageSrc}
              alt={beat.imageAlt}
              fill
              sizes="(max-width: 900px) 92vw, 44vw"
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
      {beats.map((beat, i) => (
        <ResearchChapter key={beat.id} beat={beat} flip={i % 2 === 1} />
      ))}
    </div>
  );
}

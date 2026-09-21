'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { cn } from '@/lib/utils';

export type CrashCourseChapter = {
  id: string;
  label: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
};

/** One chapter ≈ one viewport; snap interval stays under two wheel flicks. */
const CHAPTER_VH = 80;

export function chapterIndexFromProgress(progress: number, count: number) {
  if (count <= 1) return 0;
  const t = Math.min(Math.max(progress, 0), 0.999999);
  return Math.min(Math.floor(t * count), count - 1);
}

function ChapterVideo({
  chapter,
  active,
}: {
  chapter: CrashCourseChapter;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (active) {
      const play = () => {
        void node.play().catch(() => undefined);
      };
      if (node.readyState >= 2) play();
      else node.addEventListener('canplay', play, { once: true });
      return () => node.removeEventListener('canplay', play);
    }
    node.pause();
  }, [active]);

  return (
    <motion.div
      className="absolute inset-0 h-full w-full"
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      style={{ zIndex: active ? 2 : 0 }}
      aria-hidden={!active}
    >
      <video
        ref={videoRef}
        src={chapter.videoUrl}
        poster={chapter.posterUrl}
        className="h-full w-full object-cover"
        muted
        loop
        playsInline
        autoPlay={active}
        preload={active ? 'auto' : 'metadata'}
      />
      <div className="cc-ed-crash__veil" />
    </motion.div>
  );
}

function CrashCopy({
  chapters,
  index,
}: {
  chapters: CrashCourseChapter[];
  index: number;
}) {
  const chapter = chapters[index] ?? chapters[0];
  if (!chapter) return null;

  return (
    <div className="cc-ed-crash__copy">
      <p className="cc-ed-crash__index">
        {String(index + 1).padStart(2, '0')} · {chapter.label}
      </p>
      <h3 className="cc-ed-crash__title">{chapter.title}</h3>
      <p className="cc-ed-crash__lead">{chapter.description}</p>
    </div>
  );
}

type ScrollTriggeredVideoHeroProps = {
  chapters: CrashCourseChapter[];
  reduceMotion?: boolean;
  className?: string;
};

/**
 * Crash-course stage: inset rounded video frame, orange progress stroke,
 * one chapter per scroll beat. Snap keeps a single wheel from skipping a beat.
 */
export function ScrollTriggeredVideoHero({
  chapters,
  reduceMotion = false,
  className,
}: ScrollTriggeredVideoHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const trigger = containerRef.current;
      const frame = frameRef.current;
      if (!trigger || !frame || chapters.length < 2) return;

      ensureGsapPlugins();
      const n = chapters.length;

      const st = ScrollTrigger.create({
        id: 'editorial-crash-snap',
        trigger,
        start: 'top top',
        end: 'bottom bottom',
        snap: {
          snapTo: (value) => Math.round(value * (n - 1)) / (n - 1),
          duration: 0.32,
          delay: 0.04,
          ease: 'power1.inOut',
          inertia: false,
        },
        onUpdate: (self) => {
          frame.style.setProperty(
            '--crash-progress',
            `${Math.round(self.progress * 1000) / 10}%`,
          );
          const next = chapterIndexFromProgress(self.progress, n);
          if (next !== indexRef.current) {
            indexRef.current = next;
            setActiveIndex(next);
          }
        },
      });

      return () => st.kill();
    },
    { scope: containerRef, dependencies: [reduceMotion, chapters.length] },
  );

  const chapter = chapters[activeIndex] ?? chapters[0];
  if (!chapter) return null;

  if (reduceMotion) {
    return (
      <section
        className={cn('cc-ed-crash relative w-full px-4 py-8 md:px-8', className)}
        aria-label="Crash course"
        data-testid="editorial-crash-course"
      >
        <p className="cc-ed-crash__kicker">Crash course</p>
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-8">
          {chapters.map((item, index) => (
            <article
              key={item.id}
              className="cc-ed-crash__frame"
              style={{ ['--crash-progress' as string]: '100%' }}
            >
              <div className="cc-ed-crash__media relative">
                <ChapterVideo chapter={item} active />
                <CrashCopy chapters={chapters} index={index} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const runway = `${chapters.length * CHAPTER_VH}vh`;

  return (
    <section
      ref={containerRef}
      className={cn('cc-ed-crash relative w-full', className)}
      style={{ height: runway }}
      aria-label="Crash course"
      data-testid="editorial-crash-course"
    >
      <div className="cc-ed-crash__pin" data-chrome-surface="dark">
        <div className="cc-ed-crash__stage">
          <p className="cc-ed-crash__kicker">Crash course</p>

          <div
            ref={frameRef}
            className="cc-ed-crash__frame"
            style={{ ['--crash-progress' as string]: '0%' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(((activeIndex + 1) / chapters.length) * 100)}
            aria-label="Crash course progress"
          >
            <div className="cc-ed-crash__media">
              {chapters.map((item, index) => (
                <ChapterVideo
                  key={item.id}
                  chapter={item}
                  active={index === activeIndex}
                />
              ))}
              <CrashCopy chapters={chapters} index={activeIndex} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CinematicScrol(props: ScrollTriggeredVideoHeroProps) {
  return <ScrollTriggeredVideoHero {...props} />;
}

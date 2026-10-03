'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { cn } from '@/lib/utils';

export type CrashCourseChapter = {
  id: string;
  label: string;
  title: string;
  description: string;
  videoUrl: string;
};

/** One chapter ≈ one viewport; snap interval stays under two wheel flicks. */
const CHAPTER_VH = 80;

export function chapterIndexFromProgress(progress: number, count: number) {
  if (count <= 1) return 0;
  const t = Math.min(Math.max(progress, 0), 0.999999);
  return Math.min(Math.floor(t * count), count - 1);
}

/** Phones stall or paint black when several 1080p files share one decoder. */
function phoneVideoUrl(url: string) {
  return url.replace('hd_1920_1080_', 'sd_640_360_');
}

function ChapterVideo({
  chapter,
  active,
  warm,
}: {
  chapter: CrashCourseChapter;
  active: boolean;
  warm?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = true;
    node.defaultMuted = true;
    node.playsInline = true;
    node.setAttribute('playsinline', '');
    node.setAttribute('webkit-playsinline', 'true');

    if (!active) {
      node.pause();
      return;
    }

    let cancelled = false;
    let onScreen = false;
    let tries = 0;
    const kick = () => {
      if (cancelled || !onScreen) return;
      node.muted = true;
      const attempt = node.play();
      if (!attempt) return;
      attempt.catch(() => {
        if (cancelled || !onScreen || tries >= 5) return;
        tries += 1;
        window.setTimeout(kick, 320);
      });
    };

    const onReady = () => kick();
    node.addEventListener('loadeddata', onReady);
    node.addEventListener('canplay', onReady);
    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen) kick();
        else node.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    if (node.readyState < 2) node.load();
    const rect = node.getBoundingClientRect();
    onScreen = rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    if (onScreen) kick();

    return () => {
      cancelled = true;
      observer.disconnect();
      node.removeEventListener('loadeddata', onReady);
      node.removeEventListener('canplay', onReady);
    };
  }, [active, chapter.videoUrl]);

  return (
    <div
      className="cc-ed-crash__clip"
      data-active={active ? 'true' : 'false'}
      aria-hidden={!active}
    >
      <video
        ref={videoRef}
        src={chapter.videoUrl}
        className="cc-ed-crash__video"
        muted
        loop
        playsInline
        autoPlay={active}
        preload={active || warm ? 'auto' : 'metadata'}
        disablePictureInPicture
      />
      <div className="cc-ed-crash__veil" />
    </div>
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
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setPhone(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

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
                <ChapterVideo
                  chapter={{
                    ...item,
                    videoUrl: phone ? phoneVideoUrl(item.videoUrl) : item.videoUrl,
                  }}
                  active
                  warm
                />
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
              {chapters.map((item, index) => {
                const active = index === activeIndex;
                const warm = phone ? index === activeIndex + 1 : Math.abs(index - activeIndex) <= 1;
                if (phone && !active && !warm) return null;
                return (
                  <ChapterVideo
                    key={item.id}
                    chapter={{
                      ...item,
                      videoUrl: phone ? phoneVideoUrl(item.videoUrl) : item.videoUrl,
                    }}
                    active={active}
                    warm={warm}
                  />
                );
              })}
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

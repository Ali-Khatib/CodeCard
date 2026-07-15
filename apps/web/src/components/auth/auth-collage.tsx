'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type ShowcaseSlide = {
  id: string;
  tab: string;
  title: string;
  body: string;
  image: string;
};

const SLIDES: ShowcaseSlide[] = [
  {
    id: 'home',
    tab: 'Home',
    title: 'One workspace for your whole identity',
    body: 'The same Home tab as the live demo — completion, activity, and what to publish next.',
    image: '/auth-demo/home.webp',
  },
  {
    id: 'projects',
    tab: 'Projects',
    title: 'Showcase work that looks intentional',
    body: 'Covers, screenshots, links, and ordering so people understand what you built in seconds.',
    image: '/auth-demo/projects.webp',
  },
  {
    id: 'profile',
    tab: 'Profile',
    title: 'A public card people can scan and share',
    body: 'Avatar, bio, links, and QR — your CodeCard, ready when someone asks who you are.',
    image: '/auth-demo/profile.webp',
  },
  {
    id: 'analytics',
    tab: 'Analytics',
    title: 'Know what actually gets attention',
    body: 'Views and traffic from the same Analytics tab you can open in the live demo.',
    image: '/auth-demo/analytics.webp',
  },
  {
    id: 'research',
    tab: 'Research',
    title: 'Publish research next to your projects',
    body: 'Keep papers visible beside product work instead of hiding them in another profile.',
    image: '/auth-demo/research.webp',
  },
  {
    id: 'connections',
    tab: 'Connections',
    title: 'Remember the people behind the meetings',
    body: 'Contacts, notes, and follow-ups in the same workspace that hosts your card.',
    image: '/auth-demo/connections.webp',
  },
];

const SLIDE_MS = 4500;

type AuthDemoBackgroundProps = {
  index: number;
  onIndexChange: (index: number) => void;
};

export function AuthDemoBackground({ index, onIndexChange }: AuthDemoBackgroundProps) {
  const reduced = useReducedMotion();
  const slide = SLIDES[index] ?? SLIDES[0];

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      onIndexChange((index + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [index, onIndexChange, reduced]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={reduced ? { opacity: 0.28 } : { opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.7, ease: 'easeInOut' }}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-top"
            unoptimized
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-[#f3f1ec]/92 via-[#f3f1ec]/78 to-[#f3f1ec]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f3f1ec] via-[#f3f1ec]/35 to-transparent" />
    </div>
  );
}

type AuthFeatureCopyProps = {
  index: number;
  onIndexChange: (index: number) => void;
};

export function AuthFeatureCopy({ index, onIndexChange }: AuthFeatureCopyProps) {
  const reduced = useReducedMotion();
  const slide = SLIDES[index] ?? SLIDES[0];

  return (
    <div
      className="relative z-[2] max-w-[540px]"
      data-testid="auth-collage"
      aria-roledescription="carousel"
      aria-label="CodeCard live demo feature showcase"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f6c69]">
        Inside the live demo
      </p>

      <div className="relative mt-4 min-h-[150px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduced ? 0.01 : 0.35, ease: 'easeOut' }}
          >
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#7a4ea8]">
              {slide.tab}
            </p>
            <h2 className="mt-2 text-[34px] font-bold leading-[1.08] tracking-[-0.04em] text-[#141416] sm:text-[42px]">
              {slide.title}
            </h2>
            <p className="mt-3 max-w-[38ch] text-[16px] font-medium leading-relaxed text-[#3f3d3b]">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="pointer-events-auto mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Live demo tabs"
      >
        {SLIDES.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${item.tab}: ${item.title}`}
              onClick={() => onIndexChange(i)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-[#141416] text-white'
                  : 'bg-white/70 text-[#3f3d3b] hover:bg-white'
              }`}
            >
              {item.tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated Kept for import paths that still expect AuthCollage. */
export function AuthCollage() {
  const [index, setIndex] = useState(0);
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[28px]">
      <AuthDemoBackground index={index} onIndexChange={setIndex} />
      <div className="relative z-[2] flex h-full min-h-[420px] items-end p-6">
        <AuthFeatureCopy index={index} onIndexChange={setIndex} />
      </div>
    </div>
  );
}

export { SLIDES as AUTH_DEMO_SLIDES };

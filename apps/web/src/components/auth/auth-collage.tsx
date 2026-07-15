'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type ShowcaseSlide = {
  id: string;
  tab: string;
  title: string;
  body: string;
  visual: 'home' | 'projects' | 'profile' | 'analytics' | 'research' | 'connections';
};

const SLIDES: ShowcaseSlide[] = [
  {
    id: 'home',
    tab: 'Home',
    title: 'One workspace for your whole identity',
    body: 'See completion, recent activity, and the next step to publish — same Home tab as the live demo.',
    visual: 'home',
  },
  {
    id: 'projects',
    tab: 'Projects',
    title: 'Showcase work that looks intentional',
    body: 'Covers, screenshots, links, and ordering so people understand what you built in seconds.',
    visual: 'projects',
  },
  {
    id: 'profile',
    tab: 'Profile',
    title: 'A public card people can scan and share',
    body: 'Avatar, bio, links, and QR — your CodeCard profile, ready to hand someone in person.',
    visual: 'profile',
  },
  {
    id: 'analytics',
    tab: 'Analytics',
    title: 'Know what actually gets attention',
    body: 'Views, traffic patterns, and project interest so you can see what lands.',
    visual: 'analytics',
  },
  {
    id: 'research',
    tab: 'Research',
    title: 'Publish papers next to your projects',
    body: 'Keep research visible alongside product work instead of buried in another tab.',
    visual: 'research',
  },
  {
    id: 'connections',
    tab: 'Connections',
    title: 'Remember the people behind the meetings',
    body: 'Save contacts, notes, and follow-ups from the same workspace that hosts your card.',
    visual: 'connections',
  },
];

const SLIDE_MS = 4200;

function DemoChrome({ activeTab }: { activeTab: string }) {
  const tabs = ['Home', 'Projects', 'Profile', 'Analytics', 'Research', 'Connections'];
  return (
    <div className="flex h-full overflow-hidden rounded-[18px] border border-white/15 bg-[rgba(20,20,22,0.35)] shadow-[0_24px_60px_rgba(20,20,22,0.18)] backdrop-blur-[2px]">
      <aside className="hidden w-[88px] shrink-0 flex-col gap-1 border-r border-white/10 bg-white/[0.04] p-2 sm:flex">
        <div className="mb-2 px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55">
          CODECARD
        </div>
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`rounded-md px-2 py-1.5 text-[10px] ${
              tab === activeTab
                ? 'bg-white/18 font-semibold text-white'
                : 'text-white/35'
            }`}
          >
            {tab}
          </div>
        ))}
      </aside>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70">
            Live demo · {activeTab}
          </div>
          <div className="h-2 w-16 rounded-full bg-white/10" />
        </div>
        <SlideVisual visual={SLIDES.find((s) => s.tab === activeTab)?.visual ?? 'home'} />
      </div>
    </div>
  );
}

function SlideVisual({ visual }: { visual: ShowcaseSlide['visual'] }) {
  switch (visual) {
    case 'projects':
      return (
        <div className="grid grid-cols-2 gap-2 opacity-55">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-xl border border-white/12 bg-gradient-to-br from-white/18 via-white/5 to-transparent"
            >
              <div className="m-2 h-2 w-1/2 rounded bg-white/25" />
              <div className="mx-2 mt-8 h-1.5 w-2/3 rounded bg-white/15" />
            </div>
          ))}
        </div>
      );
    case 'profile':
      return (
        <div className="flex items-center gap-3 opacity-55">
          <div className="h-16 w-16 rounded-full border border-white/20 bg-white/15" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-white/30" />
            <div className="h-2 w-full rounded bg-white/12" />
            <div className="h-2 w-4/5 rounded bg-white/12" />
            <div className="mt-3 h-16 rounded-xl border border-white/12 bg-white/8" />
          </div>
        </div>
      );
    case 'analytics':
      return (
        <div className="space-y-2 opacity-55">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-white/12 bg-white/8 p-2">
                <div className="h-2 w-8 rounded bg-white/20" />
                <div className="mt-2 h-4 w-10 rounded bg-white/30" />
              </div>
            ))}
          </div>
          <div className="flex h-24 items-end gap-1 rounded-xl border border-white/12 bg-white/5 px-2 pb-2">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-white/25"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      );
    case 'research':
      return (
        <div className="space-y-2 opacity-55">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-white/12 bg-white/8 p-2.5"
            >
              <div className="h-12 w-10 shrink-0 rounded-md bg-white/18" />
              <div className="min-w-0 flex-1 space-y-1.5 pt-1">
                <div className="h-2.5 w-3/4 rounded bg-white/28" />
                <div className="h-2 w-full rounded bg-white/12" />
              </div>
            </div>
          ))}
        </div>
      );
    case 'connections':
      return (
        <div className="space-y-2 opacity-55">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-2.5 py-2"
            >
              <div className="h-8 w-8 rounded-full bg-white/18" />
              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-1/2 rounded bg-white/28" />
                <div className="mt-1.5 h-2 w-2/3 rounded bg-white/12" />
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="space-y-3 opacity-55">
          <div className="h-8 w-2/3 rounded-lg bg-white/20" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-white/12 bg-white/8" />
            ))}
          </div>
          <div className="h-20 rounded-xl border border-white/12 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
      );
  }
}

export function AuthCollage() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index] ?? SLIDES[0];

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <div
      className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[rgba(34,34,34,0.08)] bg-[#17171a] px-5 py-6 text-white shadow-[0_30px_80px_rgba(23,23,26,0.22)] sm:px-7 sm:py-8"
      data-testid="auth-collage"
      aria-roledescription="carousel"
      aria-label="CodeCard live demo feature showcase"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
        Inside the live demo
      </p>

      <div className="relative mt-5 min-h-[168px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.45, ease: 'easeInOut' }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#d7b3f0]">
              {slide.tab}
            </p>
            <h2 className="mt-2 max-w-[20ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.035em] text-white sm:text-[34px]">
              {slide.title}
            </h2>
            <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-white/72">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mt-6 h-[230px] sm:h-[260px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`visual-${slide.id}`}
            className="absolute inset-0"
            initial={reduced ? { opacity: 0.45 } : { opacity: 0 }}
            animate={{ opacity: 0.42 }}
            exit={reduced ? { opacity: 0.45 } : { opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.55, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <DemoChrome activeTab={slide.tab} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Feature slides">
        {SLIDES.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${item.tab}: ${item.title}`}
              onClick={() => setIndex(i)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active
                  ? 'bg-white text-[#17171a]'
                  : 'bg-white/10 text-white/70 hover:bg-white/16 hover:text-white'
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

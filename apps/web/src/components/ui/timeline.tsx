'use client';

import { type CSSProperties, useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

export type TimelineStop = {
  id: string;
  number?: string;
  title: string;
  lead?: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  accent: string;
  rail?: 'top' | 'bottom';
};

export type TimelineProps = {
  title?: string;
  periodLabel?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  duration?: number;
  items: TimelineStop[];
};

function PersonaCard({ item }: { item: TimelineStop }) {
  return (
    <div className="grid w-full max-w-[78rem] grid-cols-1 items-center gap-8 min-[768px]:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] min-[768px]:gap-14">
      <figure className="relative aspect-[5/4] w-full overflow-hidden bg-[#111] min-[768px]:max-h-[38vh]">
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          sizes="(max-width: 767px) 88vw, 50vw"
          className="object-cover"
          style={{ objectPosition: item.imagePosition ?? 'center' }}
        />
      </figure>
      <div className="min-w-0">
        <p
          className="m-0 font-[family-name:var(--font-eyebrow),ui-monospace,monospace] text-[0.75rem] uppercase tracking-[0.16em]"
          style={{ color: item.accent }}
        >
          {item.number} — {item.title}
        </p>
        {item.lead ? (
          <h3 className="mt-3 mb-3 font-[family-name:var(--font-display),Georgia,serif] text-[clamp(1.8rem,3.4vw,2.8rem)] font-light leading-[1.05] tracking-[-0.035em] [word-spacing:normal] whitespace-normal">
            {item.lead}
          </h3>
        ) : (
          <h3 className="mt-3 mb-3 font-[family-name:var(--font-display),Georgia,serif] text-[clamp(2.4rem,4vw,3.6rem)] font-light leading-none tracking-[-0.04em] [word-spacing:normal] whitespace-normal">
            {item.title}
          </h3>
        )}
        <p
          className="m-0 max-w-[40ch] text-[1.02rem] leading-[1.45] [word-spacing:normal] whitespace-normal"
          style={{ color: 'var(--tl-muted)' }}
        >
          {item.body}
        </p>
      </div>
    </div>
  );
}

function PersonaPanel({ item }: { item: TimelineStop }) {
  const below = item.rail === 'bottom';

  return (
    <article
      className="cc-tl-panel box-border flex h-full w-full shrink-0 flex-col px-[6vw]"
      data-audience-card={item.id}
    >
      <div className="flex min-h-0 flex-1 items-end pb-8 max-[767px]:items-start max-[767px]:pb-4">
        {!below ? <PersonaCard item={item} /> : null}
      </div>
      <div className="flex min-h-0 flex-1 items-start pt-8 max-[767px]:pt-4">
        {below ? <PersonaCard item={item} /> : null}
      </div>
    </article>
  );
}

export function Timeline({
  title = 'The life of a CodeCard',
  periodLabel = 'Create. Meet. Share. Connect. Meet again.',
  textColor = '#f5f5f5',
  mutedTextColor = 'rgba(245,245,245,0.62)',
  activeColor = '#ff5f00',
  backgroundColor = '#000000',
  items,
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLSpanElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh({ contentKey: items.length });

  const sectionStyle: CSSProperties = {
    color: textColor,
    backgroundColor,
    ['--tl-muted' as string]: mutedTextColor,
  };

  useGSAP(
    () => {
      const pin = pinRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      const line = lineRef.current;
      if (!pin || !viewport || !track) return;

      const sizePanels = () => {
        const width = viewport.clientWidth;
        track.querySelectorAll<HTMLElement>('.cc-tl-panel').forEach((panel) => {
          panel.style.width = `${width}px`;
          panel.style.flexBasis = `${width}px`;
        });
      };

      const shift = () => {
        sizePanels();
        return Math.max(0, (items.length - 1) * viewport.clientWidth);
      };

      const setPager = (progress: number) => {
        if (!pagerRef.current || items.length === 0) return;
        const index = Math.min(
          items.length - 1,
          Math.max(0, Math.round(progress * (items.length - 1))),
        );
        pagerRef.current.textContent = String(index + 1);
      };

      sizePanels();
      setPager(0);
      if (line) line.style.width = canEnhanceMotion ? '8%' : '100%';

      if (!hydrated || !canEnhanceMotion) return;
      if (window.matchMedia('(max-width: 767px)').matches) {
        if (line) line.style.width = '100%';
        return;
      }

      ensureGsapPlugins();

      const travel = () => Math.max(shift(), window.innerWidth * 0.6);

      if (line) {
        gsap.fromTo(
          line,
          { width: '8%' },
          {
            width: '100%',
            ease: 'none',
            scrollTrigger: {
              trigger: pin,
              start: 'top top',
              end: () => `+=${travel()}`,
              scrub: true,
              markers: gsapMarkersEnabled(),
            },
          },
        );
      }

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -shift(),
          ease: 'none',
          scrollTrigger: {
            id: 'editorial-audience-strip',
            trigger: pin,
            start: 'top top',
            end: () => `+=${travel()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onRefreshInit: sizePanels,
            onRefresh: sizePanels,
            onUpdate: (self) => setPager(self.progress),
          },
        },
      );
    },
    {
      scope: sectionRef,
      dependencies: [
        canEnhanceMotion,
        hydrated,
        items.map((item) => item.id).join('|'),
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="relative w-full"
      style={sectionStyle}
    >
      <div
        ref={pinRef}
        className="flex min-h-[100svh] flex-col max-[767px]:min-h-0"
      >
        <div className="flex shrink-0 items-end justify-between gap-6 px-[6vw] pt-24 pb-3 max-[767px]:pt-16">
          <h3 className="m-0 font-[family-name:var(--font-display),Georgia,serif] text-[clamp(2rem,3.4vw,3rem)] font-light leading-none tracking-[-0.04em] [word-spacing:normal] whitespace-normal">
            {title}
          </h3>
          <p
            className="m-0 text-[0.95rem] leading-snug [word-spacing:normal] whitespace-normal"
            style={{ color: mutedTextColor }}
          >
            {periodLabel}
          </p>
        </div>

        <div
          ref={viewportRef}
          className="relative min-h-[32rem] flex-1 overflow-hidden max-[767px]:overflow-visible"
        >
          <div
            className="pointer-events-none absolute inset-x-[6vw] top-1/2 z-10 hidden -translate-y-1/2 items-center min-[768px]:flex"
            aria-hidden
          >
            <div
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            <div
              ref={lineRef}
              className="cc-tl-line h-px w-[8%] rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            <div
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
          </div>

          <div
            ref={trackRef}
            className="cc-tl-track flex h-full w-max items-stretch max-[767px]:w-full max-[767px]:flex-col max-[767px]:gap-14"
            data-testid="editorial-audience-track"
          >
            {items.map((item) => (
              <PersonaPanel key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between px-[6vw] pt-3 pb-8">
          <p
            className="m-0 font-[family-name:var(--font-eyebrow),ui-monospace,monospace] text-[0.72rem] uppercase tracking-[0.14em]"
            style={{ color: mutedTextColor }}
            aria-live="polite"
          >
            [
            <span ref={pagerRef} data-audience-index>
              1
            </span>
            /{items.length}]
          </p>
          <p
            className="m-0 font-[family-name:var(--font-eyebrow),ui-monospace,monospace] text-[0.72rem] uppercase tracking-[0.14em]"
            style={{ color: mutedTextColor }}
          >
            The life of a CodeCard
          </p>
        </div>
      </div>
    </section>
  );
}

export default Timeline;

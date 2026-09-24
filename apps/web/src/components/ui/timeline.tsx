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

function PersonaPanel({ item }: { item: TimelineStop }) {
  return (
    <article
      className="cc-tl-panel box-border flex h-full w-full shrink-0 items-center px-[6vw] py-6"
      data-audience-card={item.id}
    >
      <div className="grid h-full w-full max-w-[78rem] grid-cols-1 items-center gap-10 min-[768px]:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] min-[768px]:gap-16">
        <figure className="relative aspect-[5/4] w-full overflow-hidden bg-[#111] min-[768px]:max-h-[62vh]">
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            sizes="(max-width: 767px) 88vw, 52vw"
            className="object-cover"
            style={{ objectPosition: item.imagePosition ?? 'center' }}
          />
        </figure>
        <div className="min-w-0">
          <p
            className="m-0 font-[family-name:var(--font-eyebrow),ui-monospace,monospace] text-[0.75rem] uppercase tracking-[0.16em]"
            style={{ color: item.accent }}
          >
            {item.number ?? item.title}
          </p>
          <h3 className="mt-3 mb-4 font-[family-name:var(--font-display),Georgia,serif] text-[clamp(2.6rem,5vw,4.5rem)] font-light leading-none tracking-[-0.04em] [word-spacing:normal] whitespace-normal">
            {item.title}
          </h3>
          <p
            className="m-0 max-w-[34ch] text-[1.05rem] leading-[1.45] [word-spacing:normal] whitespace-normal"
            style={{ color: 'var(--tl-muted)' }}
          >
            {item.body}
          </p>
        </div>
      </div>
    </article>
  );
}

export function Timeline({
  title = "Who it's for",
  periodLabel = 'Not five types. Five moments.',
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
        <div className="flex shrink-0 items-end justify-between gap-6 px-[6vw] pt-24 pb-4 max-[767px]:pt-16">
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
          className="relative min-h-[28rem] flex-1 overflow-hidden max-[767px]:overflow-visible"
        >
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

        <div className="shrink-0 px-[6vw] pt-4 pb-8">
          <div className="mb-4 flex items-center">
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
          <div className="flex items-center justify-between">
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
              Who it&apos;s for
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Timeline;

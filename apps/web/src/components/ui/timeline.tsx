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
import { cn } from '@/lib/cn';

export type TimelineStop = {
  id: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  accent: string;
  rail: 'top' | 'bottom';
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

function PersonaStop({ item }: { item: TimelineStop }) {
  const top = item.rail === 'top';

  return (
    <article
      className="relative flex h-full w-[min(22rem,28vw)] shrink-0 flex-col max-[767px]:h-auto max-[767px]:w-full"
      data-audience-card={item.id}
    >
      <div
        className={cn(
          'absolute left-0 flex w-px flex-col items-center',
          top ? 'inset-y-0' : 'inset-y-0',
        )}
        aria-hidden
      >
        {top ? (
          <>
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.accent }}
            />
            <span
              className="w-px flex-1"
              style={{ backgroundColor: item.accent }}
            />
          </>
        ) : (
          <>
            <span
              className="w-px flex-1"
              style={{ backgroundColor: item.accent }}
            />
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.accent }}
            />
          </>
        )}
      </div>

      <div
        className={cn(
          'flex h-full flex-col pl-5',
          top ? 'justify-start pb-8' : 'justify-end pt-8',
        )}
      >
        <figure
          className={cn(
            'relative w-full overflow-hidden bg-[#111]',
            top ? 'order-1 mb-3' : 'order-3 mt-3',
          )}
          style={{ aspectRatio: '5 / 4' }}
        >
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            sizes="(max-width: 767px) 88vw, 28vw"
            className="object-cover"
            style={{ objectPosition: item.imagePosition ?? 'center' }}
          />
        </figure>
        <h3
          className={cn(
            'font-[family-name:var(--font-display),Georgia,serif] text-[clamp(1.8rem,3vw,2.6rem)] font-light leading-none tracking-[-0.04em]',
            top ? 'order-2 mb-2' : 'order-2 mb-2',
          )}
        >
          {item.title}
        </h3>
        <p
          className={cn(
            'max-w-[22ch] text-[0.95rem] leading-snug',
            top ? 'order-3' : 'order-1 mb-2',
          )}
          style={{ color: 'var(--tl-muted)' }}
        >
          {item.body}
        </p>
      </div>
    </article>
  );
}

export function Timeline({
  title = "Who it's for",
  periodLabel = 'Five people. One card.',
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
  const pagerRef = useRef<HTMLSpanElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh({ contentKey: items.length });

  const topItems = items.filter((item) => item.rail === 'top');
  const bottomItems = items.filter((item) => item.rail === 'bottom');
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
      if (!pin || !viewport || !track) return;

      const shift = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      const setPager = (progress: number) => {
        if (!pagerRef.current || items.length === 0) return;
        const index = Math.min(
          items.length - 1,
          Math.max(0, Math.round(progress * (items.length - 1))),
        );
        pagerRef.current.textContent = String(index + 1);
      };

      setPager(0);

      const line = pin.querySelector<HTMLElement>('.cc-tl-line');
      if (line) {
        line.style.width = '92%';
      }

      if (!hydrated || !canEnhanceMotion) return;
      if (window.matchMedia('(max-width: 767px)').matches) return;

      ensureGsapPlugins();

      if (line) {
        gsap.fromTo(
          line,
          { width: '8%' },
          {
            width: '92%',
            ease: 'none',
            scrollTrigger: {
              trigger: pin,
              start: 'top top',
              end: () => `+=${Math.max(shift(), window.innerWidth)}`,
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
            end: () => `+=${Math.max(shift(), window.innerWidth)}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
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
        className="flex min-h-[100svh] flex-col justify-between py-24 max-[767px]:min-h-0 max-[767px]:py-16"
      >
        <div
          ref={viewportRef}
          className="relative min-h-[36rem] flex-1 overflow-hidden max-[767px]:overflow-visible"
        >
          <div
            ref={trackRef}
            className="cc-tl-track relative flex h-full w-max items-stretch px-[5vw] max-[767px]:w-full max-[767px]:flex-col max-[767px]:gap-12"
            data-testid="editorial-audience-track"
          >
            <div className="relative flex h-full min-h-[36rem] w-max flex-col max-[767px]:h-auto max-[767px]:min-h-0 max-[767px]:w-full">
              <div className="absolute left-0 top-1/2 hidden w-full -translate-y-1/2 items-center min-[768px]:flex">
                <div
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: activeColor }}
                />
                <div
                  className="cc-tl-line h-px w-[92%] rounded-full"
                  style={{ backgroundColor: activeColor }}
                />
                <div
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: activeColor }}
                />
              </div>

              <div className="flex h-1/2 items-start gap-x-24 pr-[12vw] max-[767px]:h-auto max-[767px]:flex-col max-[767px]:gap-10 max-[767px]:pr-0">
                <div className="w-[16rem] shrink-0 pt-2 max-[767px]:w-full">
                  <h3 className="font-[family-name:var(--font-display),Georgia,serif] text-[clamp(2.4rem,4vw,3.6rem)] font-light leading-[0.95] tracking-[-0.04em]">
                    {title}
                  </h3>
                </div>
                {topItems.map((item) => (
                  <PersonaStop key={item.id} item={item} />
                ))}
              </div>

              <div className="flex h-1/2 items-end gap-x-28 pr-[12vw] max-[767px]:mt-10 max-[767px]:h-auto max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-10 max-[767px]:pr-0">
                <div className="w-[16rem] shrink-0 max-[767px]:w-full">
                  <p
                    className="text-[1.05rem] leading-snug"
                    style={{ color: mutedTextColor }}
                  >
                    {periodLabel}
                  </p>
                </div>
                {bottomItems.map((item) => (
                  <PersonaStop key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-[5vw] pt-6">
          <p
            className="font-[family-name:var(--font-eyebrow),ui-monospace,monospace] text-[0.72rem] uppercase tracking-[0.14em]"
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
            className="font-[family-name:var(--font-eyebrow),ui-monospace,monospace] text-[0.72rem] uppercase tracking-[0.14em]"
            style={{ color: mutedTextColor }}
          >
            Who it&apos;s for
          </p>
        </div>
      </div>
    </section>
  );
}

export default Timeline;

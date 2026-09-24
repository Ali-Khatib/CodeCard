'use client';

import {
  type CSSProperties,
  useRef,
} from 'react';
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

function PersonaStop({
  item,
  compact,
}: {
  item: TimelineStop;
  compact?: boolean;
}) {
  const top = item.rail === 'top';

  return (
    <article
      className={cn(
        'relative flex h-full w-[22vw] flex-col max-[600px]:w-[72vw]',
        compact && 'w-[20vw]',
      )}
      data-audience-card={item.id}
      data-tl-stop={item.id}
    >
      <div
        className={cn(
          'absolute left-0 flex h-full w-px flex-col items-center',
          top ? 'top-0' : 'bottom-0',
        )}
      >
        {top ? (
          <>
            <span
              className="relative z-10 size-[0.85vw] shrink-0 rounded-full max-[600px]:size-2.5"
              data-tl-dot={item.id}
              style={{ backgroundColor: item.accent }}
            />
            <span
              className="w-px flex-1 origin-top rounded-full"
              data-tl-line={item.id}
              style={{ backgroundColor: item.accent }}
            />
          </>
        ) : (
          <>
            <span
              className="w-px flex-1 origin-bottom rounded-full"
              data-tl-line={item.id}
              style={{ backgroundColor: item.accent }}
            />
            <span
              className="relative z-10 size-[0.85vw] shrink-0 rounded-full max-[600px]:size-2.5"
              data-tl-dot={item.id}
              style={{ backgroundColor: item.accent }}
            />
          </>
        )}
      </div>

      <div
        className={cn(
          'flex h-full flex-col pl-[1.6vw] max-[600px]:pl-5',
          top ? 'justify-start pb-[8%]' : 'justify-end pt-[8%]',
        )}
        data-tl-copy={item.id}
      >
        <figure
          className={cn(
            'relative mb-[1.1vw] w-[13.5vw] overflow-hidden max-[600px]:mb-3 max-[600px]:w-[58vw]',
            top ? 'order-1' : 'order-3',
          )}
          style={{ aspectRatio: '5 / 4' }}
        >
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            sizes="(max-width: 600px) 58vw, 14vw"
            className="object-cover"
            style={{ objectPosition: item.imagePosition ?? 'center' }}
          />
        </figure>
        <h3
          className={cn(
            'font-[family-name:var(--font-display),Georgia,serif] text-[2.15vw] font-light leading-none tracking-[-0.04em] max-[600px]:text-[7vw]',
            top ? 'order-2 mb-[0.55vw] mt-[0.15vw]' : 'order-2 mb-[0.55vw]',
          )}
        >
          {item.title}
        </h3>
        <p
          className={cn(
            'w-[90%] text-[0.95vw] leading-[1.35] max-[600px]:text-[3.6vw]',
            top ? 'order-3' : 'order-1 mb-[0.7vw]',
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
  duration = 1.1,
  items,
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLSpanElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh({ contentKey: items.length });

  const topItems = items.filter((item) => item.rail === 'top');
  const bottomItems = items.filter((item) => item.rail === 'bottom');
  const normalizedDuration = Math.max(0.2, duration);
  const sectionStyle: CSSProperties = {
    color: textColor,
    backgroundColor,
    ['--tl-muted' as string]: mutedTextColor,
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      ensureGsapPlugins();

      const nodes = items.map((item) => ({
        item,
        line: section.querySelector<HTMLElement>(`[data-tl-line="${item.id}"]`),
        dot: section.querySelector<HTMLElement>(`[data-tl-dot="${item.id}"]`),
        copy: section.querySelector<HTMLElement>(`[data-tl-copy="${item.id}"]`),
      }));

      const setPager = (progress: number) => {
        if (!pagerRef.current || items.length === 0) return;
        const index = Math.min(
          items.length - 1,
          Math.max(0, Math.round(progress * (items.length - 1))),
        );
        pagerRef.current.textContent = String(index + 1);
      };

      const reveal = (enhanced: boolean) => {
        nodes.forEach(({ line, dot, copy }) => {
          gsap.set(line, {
            scaleY: enhanced ? 0 : 1,
            transformOrigin: 'center',
          });
          gsap.set(dot, { scale: enhanced ? 0 : 1 });
          gsap.set(copy, {
            y: enhanced ? 28 : 0,
            opacity: enhanced ? 0 : 1,
          });
        });
      };

      if (!hydrated || !canEnhanceMotion || window.matchMedia('(max-width: 600px)').matches) {
        reveal(false);
        gsap.set('.cc-tl-line', { width: '92%' });
        setPager(1);
        return;
      }

      reveal(true);
      setPager(0);

      const isNarrow = window.innerWidth < 1100;
      const slidePercent = isNarrow ? -58 : -52;

      gsap.fromTo(
        track,
        { xPercent: 0 },
        {
          xPercent: slidePercent,
          ease: 'none',
          scrollTrigger: {
            id: 'editorial-audience-strip',
            trigger: section,
            start: 'top top',
            end: isNarrow ? '88% 50%' : '92% bottom',
            scrub: 1,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => setPager(self.progress),
          },
        },
      );

      gsap.fromTo(
        section.querySelector('.cc-tl-line'),
        { width: '0%' },
        {
          width: isNarrow ? '72%' : '94%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: isNarrow ? 'top 30%' : 'top 22%',
            end: isNarrow ? '82% 50%' : '90% bottom',
            scrub: true,
            markers: gsapMarkersEnabled(),
          },
        },
      );

      const starts = isNarrow
        ? [18, 30, 42, 54, 66]
        : [10, 26, 42, 58, 72];

      nodes.forEach(({ item, line, dot, copy }, index) => {
        const start = starts[index] ?? 10 + index * 16;
        gsap.set(line, {
          transformOrigin: item.rail === 'top' ? 'top' : 'bottom',
        });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: `${start}% 32%`,
              end: `${start + 16}% 52%`,
              scrub: true,
              markers: gsapMarkersEnabled(),
            },
          })
          .to(line, { scaleY: 1, duration: normalizedDuration * 0.4 })
          .to(dot, { scale: 1, duration: normalizedDuration * 0.35 }, '<')
          .to(
            copy,
            {
              y: 0,
              opacity: 1,
              duration: normalizedDuration,
              ease: 'power2.out',
            },
            '<',
          );
      });
    },
    {
      scope: sectionRef,
      dependencies: [
        canEnhanceMotion,
        hydrated,
        normalizedDuration,
        items.map((item) => item.id).join('|'),
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="relative h-[200vw] w-full max-[600px]:h-auto"
      style={sectionStyle}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden pt-[11vh] max-[600px]:relative max-[600px]:h-auto max-[600px]:overflow-visible max-[600px]:pt-16">
        <div
          ref={trackRef}
          className="cc-tl-track mr-[2vw] flex h-[31vw] w-[200vw] items-center px-[5vw] max-[600px]:mr-0 max-[600px]:h-auto max-[600px]:w-full max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:gap-14 max-[600px]:px-5"
          data-testid="editorial-audience-track"
        >
          <div className="relative h-full w-full max-[600px]:h-auto">
            <div className="absolute left-0 top-[49%] flex h-fit w-full -translate-y-1/2 items-center max-[600px]:hidden">
              <div
                className="size-[0.7vw] rounded-full"
                style={{ backgroundColor: activeColor }}
              />
              <div
                className="cc-tl-line h-px w-0 rounded-full"
                style={{ backgroundColor: activeColor }}
              />
              <div
                className="size-[0.7vw] rounded-full"
                style={{ backgroundColor: activeColor }}
              />
            </div>

            <div className="flex h-1/2 w-full items-start max-[600px]:h-auto max-[600px]:flex-col max-[600px]:gap-12">
              <div className="w-[18%] shrink-0 pt-[0.4vw] max-[600px]:w-full max-[600px]:pt-0">
                <h3 className="w-[12ch] font-[family-name:var(--font-display),Georgia,serif] text-[2.8vw] font-light leading-[0.95] tracking-[-0.04em] max-[600px]:w-auto max-[600px]:text-[11vw]">
                  {title}
                </h3>
              </div>
              <div className="flex h-full w-full justify-start gap-x-[16vw] max-[600px]:h-auto max-[600px]:flex-col max-[600px]:gap-12">
                {topItems.map((item) => (
                  <PersonaStop key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="flex h-1/2 w-full items-end max-[600px]:mt-10 max-[600px]:h-auto max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-12">
              <div className="w-[26%] shrink-0 max-[600px]:w-full">
                <p
                  className="text-[1.15vw] leading-none max-[600px]:text-[4.2vw]"
                  style={{ color: mutedTextColor }}
                >
                  {periodLabel}
                </p>
              </div>
              <div className="ml-[6vw] flex h-full w-full justify-start gap-x-[20vw] max-[600px]:ml-0 max-[600px]:h-auto max-[600px]:flex-col max-[600px]:gap-12">
                {bottomItems.map((item) => (
                  <PersonaStop key={item.id} item={item} compact />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between px-[5vw] pb-10 max-[600px]:mt-12 max-[600px]:px-5">
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

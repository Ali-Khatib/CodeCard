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
    <div className="cc-tl-card">
      <figure className="cc-tl-card__photo">
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          sizes="(max-width: 767px) 88vw, 42vw"
          className="object-cover"
          style={{ objectPosition: item.imagePosition ?? 'center' }}
        />
      </figure>
      <div className="cc-tl-card__copy">
        <p className="cc-tl-card__kicker" style={{ color: item.accent }}>
          {item.number} — {item.title}
        </p>
        <h3 className="cc-tl-card__lead">{item.lead ?? item.title}</h3>
        <p className="cc-tl-card__body">{item.body}</p>
      </div>
    </div>
  );
}

function PersonaPanel({ item }: { item: TimelineStop }) {
  const below = item.rail === 'bottom';

  return (
    <article
      className="cc-tl-panel"
      data-audience-card={item.id}
    >
      <div className="cc-tl-slot cc-tl-slot--top">
        {!below ? <PersonaCard item={item} /> : null}
      </div>
      <div className="cc-tl-slot cc-tl-slot--bottom">
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
  const spineRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLSpanElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh({ contentKey: items.length });

  const sectionStyle: CSSProperties = {
    color: textColor,
    backgroundColor,
    ['--tl-muted' as string]: mutedTextColor,
    ['--tl-accent' as string]: activeColor,
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
        if (items.length === 0) return;
        const index = Math.min(
          items.length - 1,
          Math.max(0, Math.round(progress * (items.length - 1))),
        );
        if (pagerRef.current) pagerRef.current.textContent = String(index + 1);
        const spine = spineRef.current;
        if (!spine) return;
        spine.style.setProperty('--tl-progress', String(progress));
        spine.querySelectorAll<HTMLElement>('[data-tl-stop]').forEach((stop, i) => {
          const threshold = items.length <= 1 ? 0 : i / (items.length - 1);
          stop.dataset.reached = progress + 0.02 >= threshold ? 'true' : 'false';
          stop.dataset.current = i === index ? 'true' : 'false';
        });
      };

      sizePanels();
      setPager(0);
      if (line) line.style.width = canEnhanceMotion ? '12%' : '100%';

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
          { width: '12%' },
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
      className="cc-tl"
      style={sectionStyle}
    >
      <div ref={pinRef} className="cc-tl-pin">
        <div className="cc-tl-head">
          <h3 className="cc-tl-head__title">{title}</h3>
          <p className="cc-tl-head__period">{periodLabel}</p>
        </div>

        <div ref={viewportRef} className="cc-tl-viewport">
          <div ref={spineRef} className="cc-tl-spine" aria-hidden>
            <div className="cc-tl-spine__track">
              <div ref={lineRef} className="cc-tl-line cc-tl-spine__fill" />
            </div>
            <ol className="cc-tl-spine__stops">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  data-tl-stop
                  data-rail={item.rail ?? 'top'}
                  data-edge={
                    index === 0 ? 'start' : index === items.length - 1 ? 'end' : 'mid'
                  }
                  data-reached={index === 0 ? 'true' : 'false'}
                  data-current={index === 0 ? 'true' : 'false'}
                  className="cc-tl-spine__stop"
                  style={{
                    ['--stop' as string]: String(
                      items.length <= 1 ? 0 : index / (items.length - 1),
                    ),
                  }}
                >
                  <span className="cc-tl-spine__stem" />
                  <span className="cc-tl-spine__node" />
                  <span className="cc-tl-spine__label">{item.title}</span>
                </li>
              ))}
            </ol>
          </div>

          <div
            ref={trackRef}
            className="cc-tl-track"
            data-testid="editorial-audience-track"
          >
            {items.map((item) => (
              <PersonaPanel key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="cc-tl-foot">
          <p className="cc-tl-foot__meta" aria-live="polite">
            [
            <span ref={pagerRef} data-audience-index>
              1
            </span>
            /{items.length}]
          </p>
          <p className="cc-tl-foot__meta">The life of a CodeCard</p>
        </div>
      </div>
    </section>
  );
}

export default Timeline;

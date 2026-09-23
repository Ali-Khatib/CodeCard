'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';
import { LANDING_PERSONAS } from '@/lib/marketing/landing-personas';

/** 1920 reference: each project is wider than the distance to the next origin. */
const PROJECT_WIDTH = 1520;
const PROJECT_OFFSET = 1220;

function readScale(el: HTMLElement) {
  const raw = getComputedStyle(el).getPropertyValue('--cg-s').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : Math.min(1.25, Math.max(0.72, window.innerWidth / 1920));
}

function PersonaPanel({
  persona,
  index,
}: {
  persona: (typeof LANDING_PERSONAS)[number];
  index: number;
}) {
  return (
    <article
      className="cc-ed-audience__project"
      data-audience-card={persona.id}
      style={{ left: `calc(${index} * var(--cg-offset))` }}
    >
      <p className="cc-ed-audience__number">Project {persona.number}</p>
      <h3 className="cc-ed-audience__title">{persona.title}</h3>
      <figure className="cc-ed-audience__frame">
        <Image
          src={persona.imageSrc}
          alt={persona.imageAlt}
          fill
          sizes="560px"
          className="cc-ed-audience__photo"
          style={{ objectPosition: persona.imagePosition }}
        />
      </figure>
      <div className="cc-ed-audience__meta">
        <p className="cc-ed-audience__lead">{persona.lead}</p>
        <p className="cc-ed-audience__body">{persona.body}</p>
      </div>
    </article>
  );
}

/**
 * Who CodeCard is for — one continuous horizontal canvas.
 * Projects stay mounted and overlap; the track translates on X from vertical scroll.
 */
export function EditorialAudience() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLSpanElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!hydrated || !canEnhanceMotion) return;
      if (window.matchMedia('(max-width: 767px)').matches) return;
      const pin = pinRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!pin || !viewport || !track) return;

      ensureGsapPlugins();

      const count = LANDING_PERSONAS.length;

      const metrics = () => {
        const scale = readScale(pin);
        const offset = PROJECT_OFFSET * scale;
        const width = PROJECT_WIDTH * scale;
        const travel = Math.max(0, (count - 1) * offset);
        return { offset, width, travel };
      };

      const sizeTrack = () => {
        const { offset, width } = metrics();
        track.style.width = `${(count - 1) * offset + width}px`;
      };

      const setPager = (progress: number) => {
        if (!pagerRef.current) return;
        const { offset, travel } = metrics();
        const x = progress * travel;
        let best = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < count; i += 1) {
          const dist = Math.abs(i * offset - x);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
        pagerRef.current.textContent = String(best + 1);
      };

      sizeTrack();
      setPager(0);

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -metrics().travel,
          ease: 'none',
          scrollTrigger: {
            id: 'editorial-audience-strip',
            trigger: pin,
            start: 'top top',
            end: () => `+=${metrics().travel}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onRefreshInit: sizeTrack,
            onRefresh: sizeTrack,
            onUpdate: (self) => setPager(self.progress),
          },
        },
      );
    },
    {
      scope: rootRef,
      dependencies: [hydrated, canEnhanceMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={rootRef}
      id="audience"
      className="cc-ed__section cc-ed-audience"
      data-chapter-section="audience"
      data-testid="editorial-audience"
      data-chrome-surface="dark"
      data-audience-motion={hydrated && !canEnhanceMotion ? 'flow' : 'pin'}
      aria-labelledby="editorial-audience-heading"
    >
      <div ref={pinRef} className="cc-ed-audience__pin">
        <h2 id="editorial-audience-heading" className="sr-only">
          Who CodeCard is for
        </h2>

        <div ref={viewportRef} className="cc-ed-audience__viewport">
          <div
            ref={trackRef}
            className="cc-ed-audience__track"
            data-testid="editorial-audience-track"
          >
            {LANDING_PERSONAS.map((persona, index) => (
              <PersonaPanel
                key={persona.id}
                persona={persona}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="cc-ed-audience__chrome" aria-hidden={false}>
          <div className="cc-ed-audience__rule" aria-hidden />
          <div className="cc-ed-audience__chrome-row">
            <p className="cc-ed-audience__pager" aria-live="polite">
              [
              <span ref={pagerRef} data-audience-index>
                1
              </span>
              /{LANDING_PERSONAS.length}]
            </p>
            <p className="cc-ed-audience__viewall">View all projects ↗</p>
          </div>
        </div>
      </div>
    </section>
  );
}

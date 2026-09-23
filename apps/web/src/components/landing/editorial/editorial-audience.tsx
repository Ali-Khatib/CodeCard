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

function PersonaCard({
  persona,
  index,
}: {
  persona: (typeof LANDING_PERSONAS)[number];
  index: number;
}) {
  const last = index === LANDING_PERSONAS.length - 1;
  return (
    <article
      className={
        last
          ? 'cc-ed-audience__card cc-ed-audience__card--last'
          : 'cc-ed-audience__card'
      }
      data-audience-card={persona.id}
    >
      <div className="cc-ed-audience__name">
        <p className="cc-ed-audience__number">{persona.number}</p>
        <h3 className="cc-ed-audience__title">{persona.title}</h3>
      </div>
      <figure className="cc-ed-audience__frame">
        <Image
          src={persona.imageSrc}
          alt={persona.imageAlt}
          fill
          sizes="(max-width: 767px) 78vw, 36vw"
          className="cc-ed-audience__photo"
          style={{ objectPosition: persona.imagePosition }}
        />
      </figure>
      <div className="cc-ed-audience__dek">
        <p className="cc-ed-audience__lead">{persona.lead}</p>
        <p className="cc-ed-audience__body">{persona.body}</p>
      </div>
    </article>
  );
}

/**
 * Who CodeCard is for — Creative Giants-style overlapping filmstrip.
 * Each slide is a viewport-wide 12-col grid (name / photo / copy). Later
 * slides pull left so the next title crosses the previous dek.
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
      const pin = pinRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!pin || !viewport || !track) return;

      ensureGsapPlugins();

      const cards = Array.from(
        track.querySelectorAll<HTMLElement>('[data-audience-card]'),
      );
      const count = Math.max(cards.length, 1);

      const shift = () =>
        Math.max(0, track.scrollWidth - viewport.clientWidth);

      const setPager = (progress: number) => {
        if (!pagerRef.current) return;
        const index = Math.min(
          count - 1,
          Math.max(0, Math.round(progress * (count - 1))),
        );
        pagerRef.current.textContent = String(index + 1).padStart(2, '0');
      };

      setPager(0);

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
            end: () => `+=${shift()}`,
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
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
      data-audience-motion={hydrated && !canEnhanceMotion ? 'snap' : 'pin'}
      aria-labelledby="editorial-audience-heading"
    >
      <div ref={pinRef} className="cc-ed-audience__pin">
        <div className="cc-ed-audience__intro">
          <p className="cc-ed__eyebrow">Who CodeCard is for</p>
          <h2
            id="editorial-audience-heading"
            className="cc-ed-audience__heading"
          >
            Made for the moment you meet.
          </h2>
        </div>

        <div ref={viewportRef} className="cc-ed-audience__viewport">
          <div
            ref={trackRef}
            className="cc-ed-audience__track"
            data-testid="editorial-audience-track"
          >
            {LANDING_PERSONAS.map((persona, index) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                index={index}
              />
            ))}
          </div>
        </div>

        <p className="cc-ed-audience__pager" aria-live="polite">
          <span ref={pagerRef} data-audience-index>
            01
          </span>
          <span className="cc-ed-audience__pager-total">
            {' '}
            / {String(LANDING_PERSONAS.length).padStart(2, '0')}
          </span>
        </p>
      </div>
    </section>
  );
}

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
}: {
  persona: (typeof LANDING_PERSONAS)[number];
}) {
  return (
    <article
      className="cc-ed-audience__card"
      data-audience-card={persona.id}
    >
      <figure className="cc-ed-audience__frame">
        <Image
          src={persona.imageSrc}
          alt={persona.imageAlt}
          fill
          sizes="(max-width: 767px) 78vw, 28rem"
          className="cc-ed-audience__photo"
          style={{ objectPosition: persona.imagePosition }}
        />
      </figure>
      <p className="cc-ed-audience__number">{persona.number}</p>
      <h3 className="cc-ed-audience__title">{persona.title}</h3>
      <p className="cc-ed-audience__lead">{persona.lead}</p>
      <p className="cc-ed-audience__body">{persona.body}</p>
    </article>
  );
}

/**
 * Who CodeCard is for — five persona cards in a horizontal strip.
 * Page scroll drives the strip sideways; reduced motion uses native snap.
 */
export function EditorialAudience() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!hydrated || !canEnhanceMotion) return;
      const pin = pinRef.current;
      const track = trackRef.current;
      if (!pin || !track) return;

      ensureGsapPlugins();

      const shift = () => Math.max(0, track.scrollWidth - pin.clientWidth);

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
            end: () => `+=${shift() + window.innerHeight * 0.35}`,
            pin: true,
            scrub: 0.45,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
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
          <p className="cc-ed-audience__intro-lede">
            CodeCard is built for people who need to show what they do when the
            introduction happens, not days later.
          </p>
        </div>

        <div className="cc-ed-audience__viewport">
          <div
            ref={trackRef}
            className="cc-ed-audience__track"
            data-testid="editorial-audience-track"
          >
            {LANDING_PERSONAS.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

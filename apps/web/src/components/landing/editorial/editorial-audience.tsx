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
import { LANDING_PERSONAS } from '@/lib/marketing/landing-personas';

function PersonaStory({
  persona,
}: {
  persona: (typeof LANDING_PERSONAS)[number];
}) {
  return (
    <article
      className={`cc-ed-audience__story cc-ed-audience__story--${persona.layout} cc-ed-audience__story--${persona.frame}`}
      data-audience-story={persona.id}
    >
      <div className="cc-ed-audience__copy" data-audience-copy>
        <p className="cc-ed-audience__number">{persona.number}</p>
        <h3 className="cc-ed-audience__title">{persona.title}</h3>
      </div>
      <figure className="cc-ed-audience__frame" data-audience-image>
        <Image
          src={persona.imageSrc}
          alt={persona.imageAlt}
          fill
          sizes="(max-width: 767px) 92vw, 46vw"
          className="cc-ed-audience__photo"
          style={{ objectPosition: persona.imagePosition }}
        />
      </figure>
      <div className="cc-ed-audience__dek" data-audience-dek>
        <p className="cc-ed-audience__lead">{persona.lead}</p>
        <p className="cc-ed-audience__body">{persona.body}</p>
      </div>
    </article>
  );
}

/**
 * Who CodeCard is for — five editorial persona stories, not a card marquee.
 */
export function EditorialAudience() {
  const rootRef = useRef<HTMLElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();

  useGSAP(
    () => {
      if (!hydrated || !canEnhanceMotion) return;
      const root = rootRef.current;
      if (!root) return;

      ensureGsapPlugins();
      const stories = Array.from(
        root.querySelectorAll<HTMLElement>('[data-audience-story]'),
      );

      stories.forEach((story) => {
        const copy = story.querySelector<HTMLElement>('[data-audience-copy]');
        const dek = story.querySelector<HTMLElement>('[data-audience-dek]');
        const image = story.querySelector<HTMLElement>('[data-audience-image]');
        const trigger = {
          trigger: story,
          start: 'top 88%',
          end: 'bottom 18%',
          scrub: 0.55,
          invalidateOnRefresh: true,
          markers: gsapMarkersEnabled(),
        };

        if (copy || dek) {
          gsap.fromTo(
            [copy, dek].filter(Boolean),
            { y: 28 },
            { y: -16, ease: 'none', scrollTrigger: trigger },
          );
        }
        if (image) {
          gsap.fromTo(
            image,
            { y: -22, scale: 1.04 },
            { y: 20, scale: 1, ease: 'none', scrollTrigger: trigger },
          );
        }
      });
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
      aria-labelledby="editorial-audience-heading"
    >
      <div className="cc-ed-audience__intro">
        <p className="cc-ed__eyebrow">Who CodeCard is for</p>
        <h2 id="editorial-audience-heading" className="cc-ed-audience__heading">
          Made for the moment you meet.
        </h2>
        <p className="cc-ed-audience__intro-lede">
          CodeCard is built for people who need to show what they do when the
          introduction happens, not days later.
        </p>
      </div>

      <div className="cc-ed-audience__stories">
        {LANDING_PERSONAS.map((persona) => (
          <PersonaStory key={persona.id} persona={persona} />
        ))}
      </div>
    </section>
  );
}

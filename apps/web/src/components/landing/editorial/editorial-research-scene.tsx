'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE, MOTION_LIMITS } from '@/components/motion/motion-tokens';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

type ResearchBeat = {
  id: string;
  index: string;
  marker: string;
  problemTitle: string;
  researchBody: string;
  solutionBody: string;
};

const BEATS: ResearchBeat[] = [
  {
    id: 'attention',
    index: '01',
    marker: 'Attention window',
    problemTitle: 'Your best work never gets the glance.',
    researchBody:
      'Eye-tracking research shows first looks often last only a few seconds. Name, school, and title get seen. Real projects get skipped.',
    solutionBody:
      'CodeCard puts your projects up front. The good stuff shows before the glance is over.',
  },
  {
    id: 'prestige',
    index: '02',
    marker: 'Prestige bias',
    problemTitle: 'Your school can decide first.',
    researchBody:
      'Cross-country experiments found school prestige cues still shaped early screening. The education line moved the cut before anyone tested the work.',
    solutionBody:
      'CodeCard leads with builds and outcomes. Proof shows up before the credential story takes over.',
  },
  {
    id: 'proof',
    index: '03',
    marker: 'Skills visibility',
    problemTitle: 'Hidden skills get skipped.',
    researchBody:
      'Skills-based hiring research shows pools open much wider when skills are easy to find. Buried work stays out of the match.',
    solutionBody:
      'CodeCard makes your skills and projects easy to see. More people can find you.',
  },
];

function ResearchBeatPanel({ beat }: { beat: ResearchBeat }) {
  const panelRef = useRef<HTMLElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();
      const panel = panelRef.current;
      if (!panel) return;

      const items = panel.querySelectorAll('[data-research-reveal]');
      gsap.set(items, { opacity: 0, y: MOTION_LIMITS.revealY * 0.55 });

      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: MOTION_EASE.inOut,
        scrollTrigger: {
          trigger: panel,
          start: 'top 78%',
          end: 'top 42%',
          scrub: 0.45,
          markers: gsapMarkersEnabled(),
        },
      });
    },
    { scope: panelRef, dependencies: [canEnhanceMotion, beat.id], revertOnUpdate: true },
  );

  return (
    <article
      ref={panelRef}
      className="cc-ed-research-beat"
      data-testid={`editorial-proof-box-${beat.id}`}
    >
      <div className="cc-ed-research-beat__rail">
        <span className="cc-ed-research-beat__index" data-research-reveal>
          {beat.index}
        </span>
        <span className="cc-ed-research-beat__marker" data-research-reveal>
          {beat.marker}
        </span>
      </div>
      <div className="cc-ed-research-beat__body">
        <p className="cc-ed-research-beat__label" data-research-reveal>
          The problem
        </p>
        <h3 className="cc-ed-research-beat__title" data-research-reveal>
          {beat.problemTitle}
        </h3>
        <div className="cc-ed-research-beat__columns">
          <div className="cc-ed-research-beat__column" data-research-reveal>
            <p className="cc-ed-research-beat__column-label">The research</p>
            <p className="cc-ed-research-beat__copy">{beat.researchBody}</p>
          </div>
          <div className="cc-ed-research-beat__column" data-research-reveal>
            <p className="cc-ed-research-beat__column-label">The solution</p>
            <p className="cc-ed-research-beat__solution">{beat.solutionBody}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function EditorialResearchScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();
      const intro = introRef.current;
      if (!intro) return;

      const lines = intro.querySelectorAll('[data-research-intro]');
      gsap.fromTo(
        lines,
        { opacity: 0.35, y: MOTION_LIMITS.revealY * 0.75 },
        {
          opacity: 1,
          y: 0,
          ease: MOTION_EASE.inOut,
          stagger: 0.08,
          scrollTrigger: {
            trigger: intro,
            start: 'top 82%',
            end: 'top 48%',
            scrub: 0.5,
            markers: gsapMarkersEnabled(),
          },
        },
      );
    },
    { scope: rootRef, dependencies: [canEnhanceMotion], revertOnUpdate: true },
  );

  return (
    <section
      ref={rootRef}
      id="why-research"
      className="cc-ed__section cc-ed-proof cc-ed-research-scene"
      data-chapter-section="proof"
      data-testid="editorial-research-proof"
      aria-labelledby="editorial-research-proof-heading"
      data-motion-pattern="reveal-editorial"
      data-motion-owner="gsap"
    >
      <div ref={introRef} className="cc-ed-research-scene__intro">
        <p className="cc-ed__eyebrow" data-research-intro>
          The research
        </p>
        <h2
          id="editorial-research-proof-heading"
          className="cc-ed__display cc-ed__display--xl mt-3"
        >
          <span className="cc-ed__lead" data-research-intro>
            THEY DO NOT READ YOU.
          </span>
          <span className="cc-ed__sub" data-research-intro>
            THEY SORT YOU.
          </span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4" data-research-intro>
          Seconds decide. Prestige steers the gate. Buried skills never enter the pool.
          CodeCard puts proof where it cannot be ignored.
        </p>
      </div>

      <div className="cc-ed-research-scene__beats">
        {BEATS.map((beat) => (
          <ResearchBeatPanel key={beat.id} beat={beat} />
        ))}
      </div>

      <p className="cc-ed-proof__more">
        <Link href="/research" className="cc-ed__link">
          See all research papers →
        </Link>
      </p>
    </section>
  );
}

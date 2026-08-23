'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE, MOTION_LIMITS } from '@/components/motion/motion-tokens';
import {
  EditorialResearchStory,
  type EditorialResearchBeat,
} from '@/components/ui/editorial-research-story';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

const BEATS: EditorialResearchBeat[] = [
  {
    id: 'attention',
    index: '01',
    marker: 'Attention window',
    problemTitle: 'Your best work never gets the glance.',
    problemLead: 'YOUR BEST WORK',
    problemSub: 'NEVER GETS THE GLANCE.',
    researchBody:
      'Eye-tracking research shows first looks often last only a few seconds. Name, school, and title get seen. Real projects get skipped.',
    solutionBody:
      'CodeCard puts your projects up front. The good stuff shows before the glance is over.',
    imageSrc: '/auth-demo/research.webp',
    imageAlt: 'Research papers and technical writing on a desk',
  },
  {
    id: 'prestige',
    index: '02',
    marker: 'Prestige bias',
    problemTitle: 'Your school can decide first.',
    problemLead: 'YOUR SCHOOL CAN',
    problemSub: 'DECIDE FIRST.',
    researchBody:
      'Cross-country experiments found school prestige cues still shaped early screening. The education line moved the cut before anyone tested the work.',
    solutionBody:
      'CodeCard leads with builds and outcomes. Proof shows up before the credential story takes over.',
    imageSrc: '/auth-collage/desk.jpg',
    imageAlt: 'Focused workspace with a laptop and notes',
  },
  {
    id: 'proof',
    index: '03',
    marker: 'Skills visibility',
    problemTitle: 'Hidden skills get skipped.',
    problemLead: 'HIDDEN SKILLS',
    problemSub: 'GET SKIPPED.',
    researchBody:
      'Skills-based hiring research shows pools open much wider when skills are easy to find. Buried work stays out of the match.',
    solutionBody:
      'CodeCard makes your skills and projects easy to see. More people can find you.',
    imageSrc: '/auth-collage/code.jpg',
    imageAlt: 'Code editor showing technical work in progress',
  },
];

export function EditorialResearchScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();
      const label = labelRef.current;
      if (!label) return;

      gsap.fromTo(
        label,
        { opacity: 0.45, y: MOTION_LIMITS.revealY * 0.4 },
        {
          opacity: 1,
          y: 0,
          ease: MOTION_EASE.soft,
          scrollTrigger: {
            trigger: label,
            start: 'top 88%',
            end: 'top 68%',
            scrub: 0.4,
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
      <div ref={labelRef} className="cc-ed-research-scene__label">
        <span className="cc-ed-research-scene__label-mark" aria-hidden />
        <p className="cc-ed__eyebrow" id="editorial-research-proof-heading">
          The research
        </p>
      </div>

      <EditorialResearchStory beats={BEATS} />
    </section>
  );
}

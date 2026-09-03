'use client';

import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {
  EditorialResearchStory,
  type EditorialResearchBeat,
} from '@/components/ui/editorial-research-story';

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
    imageSrc: '/auth-collage/team.jpg',
    imageAlt: 'Two people collaborating at a shared workspace',
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

/**
 * Research proof — cream → charcoal wash on scroll, then three editorial beats
 * with headline redaction reveals (CodeCard colors only).
 */
export function EditorialResearchScene() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() === true;

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'start 0.15'],
  });

  const wash = useTransform(
    scrollYProgress,
    [0, 0.4, 0.82, 1],
    ['#fcf1e7', '#8f8a84', '#202020', '#1a1a1c'],
  );

  return (
    <motion.section
      ref={rootRef}
      id="why-research"
      className="cc-ed__section cc-ed-proof cc-ed-research-scene"
      data-chapter-section="proof"
      data-testid="editorial-research-proof"
      aria-labelledby="editorial-research-proof-heading"
      data-motion-pattern="reveal-editorial"
      data-motion-owner="motion"
      style={reduced ? undefined : { backgroundColor: wash }}
    >
      <div className="cc-ed-research-scene__label">
        <span className="cc-ed-research-scene__label-mark" aria-hidden />
        <p className="cc-ed__eyebrow" id="editorial-research-proof-heading">
          The research
        </p>
      </div>

      <EditorialResearchStory beats={BEATS} />
    </motion.section>
  );
}

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
    accent: '#e95a0b',
    marker: 'Attention window',
    problemTitle: 'Early review can be extremely brief.',
    problemLead: 'EARLY REVIEW',
    problemSub: 'CAN BE EXTREMELY BRIEF.',
    researchBody:
      'Research on recruiter eye-tracking suggests that early resume review can be extremely brief. Name, school, and title often receive the first look.',
    solutionBody:
      'CodeCard puts selected work in front of someone during the introduction, instead of hoping they find it later.',
    imageSrc: '/auth-collage/team.jpg',
    imageAlt: 'Two people collaborating at a shared workspace',
  },
  {
    id: 'prestige',
    index: '02',
    accent: '#86b54a',
    marker: 'Prestige bias',
    problemTitle: 'Prestige cues can shape early cuts.',
    problemLead: 'PRESTIGE CUES',
    problemSub: 'CAN SHAPE EARLY CUTS.',
    researchBody:
      'Experimental research has found that educational prestige cues can influence early evaluation, before demonstrated work is inspected.',
    solutionBody:
      'Lead with builds and papers in the same profile so the credential line is not the only signal available.',
    imageSrc: '/auth-collage/desk.jpg',
    imageAlt: 'Focused workspace with a laptop and notes',
  },
  {
    id: 'proof',
    index: '03',
    accent: '#8c9288',
    marker: 'Skills visibility',
    problemTitle: 'Skills evidence is easy to miss.',
    problemLead: 'SKILLS EVIDENCE',
    problemSub: 'IS EASY TO MISS.',
    researchBody:
      'Skills-based approaches can make relevant evidence easier to identify across a broader candidate pool. Buried work stays out of that match.',
    solutionBody:
      'Projects, methods, and publications sit together so a visitor does not have to reconstruct them from a citation list.',
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
    ['#fcf1e7', '#8c9288', '#1c4636', '#080a09'],
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

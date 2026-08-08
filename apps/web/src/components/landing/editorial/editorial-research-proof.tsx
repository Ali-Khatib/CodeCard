'use client';

import Link from 'next/link';
import { TextParallaxContent } from '@/components/ui/text-parallax-content-scroll';

const U = (id: string, w = 2400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

type ResearchBeat = {
  id: string;
  imgUrl: string;
  problemTitle: string;
  researchBody: string;
  solutionBody: string;
};

/** Atmospheric photos — CV screening, campus, unused code shot. */
const BEATS: ResearchBeat[] = [
  {
    id: 'attention',
    // People reviewing papers / CVs at a desk
    imgUrl: U('photo-1450101499163-c8848c66ca85'),
    problemTitle: 'Your best work never gets the glance.',
    researchBody:
      'Eye-tracking research shows first looks often last only a few seconds. Name, school, and title get seen. Real projects get skipped.',
    solutionBody:
      'CodeCard puts your projects up front. The good stuff shows before the glance is over.',
  },
  {
    id: 'prestige',
    // University / school building
    imgUrl: U('photo-1562774053-701939374585'),
    problemTitle: 'Your school can decide first.',
    researchBody:
      'Cross-country experiments found school prestige cues still shaped early screening. The education line moved the cut before anyone tested the work.',
    solutionBody:
      'CodeCard leads with builds and outcomes. Proof shows up before the credential story takes over.',
  },
  {
    id: 'proof',
    // Code photo unused elsewhere on marketing / demo surfaces
    imgUrl: U('photo-1627398242454-45a1465c2479'),
    problemTitle: 'Hidden skills get skipped.',
    researchBody:
      'Skills-based hiring research shows pools open much wider when skills are easy to find. Buried work stays out of the match.',
    solutionBody:
      'CodeCard makes your skills and projects easy to see. More people can find you.',
  },
];

/**
 * Three sticky image fades — same motion as before, problem / research / solution on each.
 */
export function EditorialResearchProof() {
  return (
    <section
      id="why-research"
      className="cc-ed__section cc-ed-proof"
      data-chapter-section="proof"
      data-testid="editorial-research-proof"
      aria-labelledby="editorial-research-proof-heading"
    >
      <div className="cc-ed-proof__intro">
        <p className="cc-ed__eyebrow">The research</p>
        <h2
          id="editorial-research-proof-heading"
          className="cc-ed__display cc-ed__display--xl mt-3"
        >
          <span className="cc-ed__lead">THEY DO NOT READ YOU.</span>
          <span className="cc-ed__sub">THEY SORT YOU.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          Seconds decide. Prestige steers the gate. Buried skills never enter the
          pool. CodeCard puts proof where it cannot be ignored.
        </p>
      </div>

      <div className="cc-ed-proof__parallax">
        {BEATS.map((beat) => (
          <div key={beat.id} data-testid={`editorial-proof-box-${beat.id}`}>
            <TextParallaxContent
              imgUrl={beat.imgUrl}
              subheading="The problem"
              heading={beat.problemTitle}
              research={beat.researchBody}
              solution={beat.solutionBody}
            />
          </div>
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

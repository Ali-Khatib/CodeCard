'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import {
  FullScreenScrollFX,
  type FullScreenFXSection,
} from '@/components/ui/full-screen-scroll-fx';
import {
  ensureGsapPlugins,
  gsap,
} from '@/components/motion/gsap-runtime';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=75`;

type WalkStory = {
  id: string;
  label: string;
  headline: string;
  lead: string;
  points: string[];
  background: string;
};

const STORIES: WalkStory[] = [
  {
    id: 'projects',
    label: 'Projects',
    headline: 'SHOW IT WHILE YOU TALK.',
    lead: 'Open it on your phone. They see your best work before the intro is over.',
    points: [
      'Impress faster than a speech or a later link.',
      'They go as deep as they want. You keep talking.',
      'The showcase happens in the room.',
    ],
    background: U('photo-1461749280684-dccba630e2f6'),
  },
  {
    id: 'research',
    label: 'Research',
    headline: 'PAPERS IN THE SAME BEAT.',
    lead: 'Research sits next to the builds. They can open it before they walk away.',
    points: [
      'Figures land first. Methods are there if they want them.',
      'Papers next to the projects that prove them.',
      'One conversation. Builds and findings together.',
    ],
    background: U('photo-1497633762265-9d179a990aa6'),
  },
  {
    id: 'connections',
    label: 'Connections',
    headline: 'PEOPLE YOU ACTUALLY MET.',
    lead: 'Keep the face-to-face ones. The handshake is the connection.',
    points: [
      'Date, place, a note from the conversation.',
      'No search. No digital invite hunt.',
      'Follow up so they do not vanish into forgotten contacts.',
    ],
    background: U('photo-1515169067868-5387ec356754'),
  },
  {
    id: 'circle',
    label: 'Circle',
    headline: 'WHO YOU MET. NOT A FEED.',
    lead: 'Circle is the people who stood in front of you. Quiet. Chosen.',
    points: [
      'One place for real meetings.',
      'Their work, because you connected.',
      'Memory for relationships, not a follower graph.',
    ],
    background: U('photo-1600880292203-757bb62b4baf'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    headline: 'FOLLOW UP WITH CONTEXT.',
    lead: 'See what they opened. Write like you were still in the room.',
    points: [
      'Views, opens, scans from people who met you.',
      'Know which project they lingered on.',
      'Keep events you plan to attend.',
    ],
    background: U('photo-1514565131-fce0801e5785'),
  },
];

/** Short labels for the mobile equal-width chapter rail (must stay one row). */
const MOBILE_LABELS: Record<string, string> = {
  projects: 'Projects',
  research: 'Research',
  connections: 'Connect',
  circle: 'Circle',
  analytics: 'Stats',
};

function StoryContent({ story, index }: { story: WalkStory; index: number }) {
  return (
    <>
      <p className="fx-story__kicker">
        {String(index + 1).padStart(2, '0')} · {story.label}
      </p>
      <h3 className="fx-story__title">{story.headline}</h3>
      <p className="fx-story__lead">{story.lead}</p>
      <ul className="fx-story__points">
        {story.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </>
  );
}

const SECTIONS: FullScreenFXSection[] = STORIES.map((story, index) => ({
  id: story.id,
  leftLabel: story.label,
  leftLabelShort: MOBILE_LABELS[story.id] ?? story.label,
  background: story.background,
  content: <StoryContent story={story} index={index} />,
}));

/**
 * Full-screen scroll walkthrough — one chapter per viewport with photo + story.
 */
export function EditorialFeatureWalkthrough() {
  const reduced = useReducedMotion();
  const introRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced) return;
      ensureGsapPlugins();
      const intro = introRef.current;
      if (!intro) return;

      const lines = intro.querySelectorAll(
        '.cc-ed__eyebrow, .cc-ed__lead, .cc-ed__sub, .cc-ed__lede',
      );
      // Play once on enter — do not scrub color or clip against the wheel.
      gsap.fromTo(
        lines,
        { y: 36, clipPath: 'inset(0% 0% 100% 0%)' },
        {
          y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.08,
          overwrite: true,
          scrollTrigger: {
            trigger: intro,
            start: 'top 82%',
            once: true,
          },
        },
      );
    },
    { scope: introRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section
      id="walkthrough"
      className="cc-ed__section cc-ed-walk"
      data-chapter-section="walkthrough"
      data-testid="editorial-feature-walkthrough"
      aria-labelledby="editorial-walkthrough-heading"
    >
      <div ref={introRef} className="cc-ed-walk__intro">
        <p className="cc-ed__eyebrow">What CodeCard is</p>
        <h2 id="editorial-walkthrough-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">IMPRESS IN THE ROOM.</span>
          <span className="cc-ed__sub">KEEP WHO YOU MET.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          Work in front of them now. Keep the people you actually met. Follow up
          so they do not disappear.
        </p>
      </div>

      <div className="cc-ed-walk__bridge cc-ed-walk__bridge--in" aria-hidden />

      <div className="cc-ed-walk__stage">
        <FullScreenScrollFX
          sections={SECTIONS}
          reduceMotion={reduced}
          showProgress
          showEnd={false}
          bgTransition="fade"
          durations={{ change: 0.55, snap: 720 }}
          colors={{
            text: 'rgba(245, 243, 240, 0.95)',
            overlay: 'rgba(32, 32, 36, 0.22)',
            pageBg: '#202020',
            stageBg: '#202020',
            accent: 'var(--ed-accent, #a86f55)',
          }}
          fontFamily='var(--font-display), "Instrument Serif", Georgia, serif'
          header={
            <>
              <span className="fx-header-kicker">Crash course</span>
              <span>Impress. Keep. Follow up.</span>
            </>
          }
          ariaLabel="CodeCard feature walkthrough"
        />
      </div>
    </section>
  );
}

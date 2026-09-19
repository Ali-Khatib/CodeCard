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
    headline: 'SHOW WHAT YOU BUILD.',
    lead: 'A visual, structured showcase. What it is, how it works, the stack, the outcome.',
    points: [
      'Images, presentations, demos, descriptions, and results, ready to open.',
      'One of the quickest ways to put actual work in front of someone.',
      'Open it on your phone. They can go as deep as they want while you talk.',
    ],
    background: U('photo-1461749280684-dccba630e2f6'),
  },
  {
    id: 'research',
    label: 'Research',
    headline: 'PRESENT THE RESEARCH.',
    lead: 'Papers and findings sit next to the projects that support them. Presented, not dumped.',
    points: [
      'Figures, methods, and related builds in a form people can actually explore.',
      'Research should feel understandable, not like a folder of PDFs.',
      'The same living profile holds what you build and what you study.',
    ],
    background: U('photo-1497633762265-9d179a990aa6'),
  },
  {
    id: 'connections',
    label: 'Connections',
    headline: 'THE LIGHTEST CARD HOLDER.',
    lead: 'For the valuable people you actually meet. The physical interaction is the connection.',
    points: [
      'When you met, where you met, what you talked about, and what comes next.',
      'No username search. No digital invite hunt. The handshake is intentional.',
      'Schedule a follow up after you impress each other.',
    ],
    background: U('photo-1515169067868-5387ec356754'),
  },
  {
    id: 'events',
    label: 'Events',
    headline: 'PLACES YOU PLAN TO BE.',
    lead: 'Keep upcoming events, then attach the people you meet there to that day.',
    points: [
      'Meetups, fairs, and conferences in one calendar.',
      'Attend, connect in person, and keep the room attached to the relationship.',
      'Events, connections, and follow ups belong to the same workflow.',
    ],
    background: U('photo-1505373877841-8d25f7d46678'),
  },
  {
    id: 'circle',
    label: 'Circle',
    headline: 'YOUR LIVING NETWORK.',
    lead: 'Stay with the people you have actually connected with. See what they are working on and shipping.',
    points: [
      'The network starts with real relationships, not a follower graph.',
      'Their latest work, because you chose each other.',
      'Quiet, chosen, and built for staying connected, not farming engagement.',
    ],
    background: U('photo-1600880292203-757bb62b4baf'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    headline: 'A LIVING PROFILE.',
    lead: 'See how people interact with your identity and your work.',
    points: [
      'Profile views, project opens, research activity, and QR scans.',
      'Know which work they lingered on after the meeting.',
      'This is not a static page. It is a living technical identity.',
    ],
    background: U('photo-1514565131-fce0801e5785'),
  },
];

/** Short labels for the mobile equal-width chapter rail (must stay one row). */
const MOBILE_LABELS: Record<string, string> = {
  projects: 'Projects',
  research: 'Research',
  connections: 'Connect',
  events: 'Events',
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
          <span className="cc-ed__lead">YOUR WORK. YOUR IDENTITY.</span>
          <span className="cc-ed__sub">YOUR CONNECTIONS.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          One system around a living technical identity. Build it. Show the work.
          Meet people. Connect in person. Remember the context. Stay connected.
          Follow up.
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
              <span>Identity. Work. Connections.</span>
            </>
          }
          ariaLabel="CodeCard feature walkthrough"
        />
      </div>
    </section>
  );
}

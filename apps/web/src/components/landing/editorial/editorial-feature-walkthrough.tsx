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
import { EditorialComparison } from './editorial-comparison';

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
    headline: 'PRESENT THE WORK.',
    lead: 'Enough context to understand the problem, the implementation, and the result. Not just a title and a technology list.',
    points: [
      'Images, demos, presentations, and supporting material where they add evidence.',
      'Make the relationship between the project, your skills, and the outcome easy to read.',
      'Open the profile while you talk. Visitors can go as deep as they want.',
    ],
    background: U('photo-1461749280684-dccba630e2f6'),
  },
  {
    id: 'research',
    label: 'Research',
    headline: 'KEEP PAPERS CLOSE.',
    lead: 'Present papers, experiments, findings, and related projects as part of the same professional profile.',
    points: [
      'Make publications accessible without burying them behind external links.',
      'Surface the result instead of forcing visitors to decode a citation list.',
      'Connect research to the projects, methods, and technical work around it.',
    ],
    background: U('photo-1497633762265-9d179a990aa6'),
  },
  {
    id: 'connections',
    label: 'Connections',
    headline: 'CONTEXT, NOT JUST A NAME.',
    lead: 'A name in a contact list tells you who someone is. CodeCard lets you remember why you met.',
    points: [
      'Record when the introduction happened, and keep the event or place attached.',
      'Write down what was discussed while you still remember it.',
      'Schedule the next interaction instead of leaving it to memory.',
    ],
    background: U('photo-1515169067868-5387ec356754'),
  },
  {
    id: 'events',
    label: 'Events',
    headline: 'KEEP THE EVENT ATTACHED.',
    lead: 'Keep conferences, meetups, fairs, and other events connected to the people you meet there.',
    points: [
      'Keep the events on your calendar visible from the same workspace.',
      'See which people came from which event.',
      'Move from introduction to next step without losing the original context.',
    ],
    background: U('photo-1505373877841-8d25f7d46678'),
  },
  {
    id: 'circle',
    label: 'Circle',
    headline: 'A PRIVATE CIRCLE.',
    lead: 'Circle is where your CodeCard connections live. There is no public feed or follower count.',
    points: [
      'People you have actually connected with, and their work.',
      'Your notes and interaction history, kept with you.',
      'The next step, still attached to how you met.',
    ],
    background: U('photo-1600880292203-757bb62b4baf'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    headline: 'WHAT PEOPLE OPEN.',
    lead: 'See how visitors interact with your CodeCard and which parts of your work attract attention.',
    points: [
      'Profile views, QR scans, project opens, and research activity.',
      'Returning visitors, labeled as such.',
      'Use the numbers to see what people actually explore.',
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
          <span className="cc-ed__lead">AROUND THE INTRODUCTION.</span>
          <span className="cc-ed__sub">NOT A REPLACEMENT FEED.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          CodeCard sits next to GitHub and LinkedIn. It does not host your
          repositories or run a social feed. It is what you open when someone
          asks what you do, then what you use to keep the meeting organized.
        </p>
      </div>

      <EditorialComparison />

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
              <span>Projects. Research. Circle.</span>
            </>
          }
          ariaLabel="CodeCard feature walkthrough"
        />
      </div>
    </section>
  );
}

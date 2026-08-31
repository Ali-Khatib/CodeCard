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
    headline: 'PROJECTS PEOPLE CAN READ.',
    lead: 'The quickest way to showcase your projects in a clear, educational page that covers everything you want to show off.',
    points: [
      'Tell the story: what it is, how it runs, what changed.',
      'Put demos, stack, and outcomes where visitors can actually see them.',
      'Let people open the work without hunting across tabs.',
    ],
    // Code on screen — bright, clearly a project surface
    background: U('photo-1461749280684-dccba630e2f6'),
  },
  {
    id: 'research',
    label: 'Research',
    headline: 'SHARE YOUR RESEARCH TOO.',
    lead: 'Not only projects. Put papers on your CodeCard so people can open, skim, and cite them.',
    points: [
      'Present findings like a product page, not a file dump.',
      'Keep figures and methods where eyes land first.',
      'Link papers to the projects that prove them.',
    ],
    // Stack of books / papers — readable topic photo
    background: U('photo-1497633762265-9d179a990aa6'),
  },
  {
    id: 'connections',
    label: 'Connections',
    headline: 'YOUR CARD HOLDER, TOO.',
    lead: 'CodeCard is a card holder as well. Keep who you met, why it mattered, and what to do next.',
    points: [
      'Connect in person — someone scans your CodeCard QR, and you are connected.',
      'No searching, usernames, or digital invites — physical QR is the only way.',
      'Attach private notes and follow ups only you can see.',
    ],
    background: U('photo-1515169067868-5387ec356754'),
  },
  {
    id: 'circle',
    label: 'Circle',
    headline: 'YOUR NETWORK, SHIPPING LIVE.',
    lead: 'Then see those people in Circle too. A feed of work from people you trust, without digging through chats.',
    points: [
      'Open Circle to watch what your saved people ship as it lands.',
      'Follow builders, not empty status updates.',
      'Stay close to the work that matters to you.',
    ],
    background: U('photo-1600880292203-757bb62b4baf'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    headline: 'EVERY SIGNAL. NOTHING MISSED.',
    lead: 'Detailed analysis of views, opens, reads, and scans. We tell you everything that lands.',
    points: [
      'See who looked, what they opened, and what they came back to.',
      'Track profile, projects, research, and scans in one place.',
      'Use the full picture to decide what to ship next.',
    ],
    // Night city lights / signals — not a SaaS dashboard screenshot
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
          <span className="cc-ed__lead">ONE LIVING</span>
          <span className="cc-ed__sub">TECHNICAL IDENTITY.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          Not a resume dump. Not a link tree. CodeCard keeps projects, papers,
          people, and signals in one profile you can carry and share.
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
              <span>Five surfaces. Learn the card.</span>
            </>
          }
          ariaLabel="CodeCard feature walkthrough"
        />
      </div>
    </section>
  );
}

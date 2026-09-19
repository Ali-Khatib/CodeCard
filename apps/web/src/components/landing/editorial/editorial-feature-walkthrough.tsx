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
    headline: 'SHOW YOUR BEST WORK NOW.',
    lead: 'The quickest way to impress someone with your work, right from your phone, while you are still talking.',
    points: [
      'Open your CodeCard and QR on your phone during the introduction.',
      'They scan, then explore images, overview, stack, and the story in the browser.',
      'They do not need the CodeCard app just to view your work.',
    ],
    background: U('photo-1461749280684-dccba630e2f6'),
  },
  {
    id: 'research',
    label: 'Research',
    headline: 'SHARE THE PAPERS TOO.',
    lead: 'Selected work can include research. Put papers on your CodeCard so people can open them in the same conversation.',
    points: [
      'Present findings so they are easy to skim on a phone.',
      'Keep figures and methods where eyes land first.',
      'Keep papers next to the projects that prove them.',
    ],
    background: U('photo-1497633762265-9d179a990aa6'),
  },
  {
    id: 'connections',
    label: 'Connections',
    headline: 'THE LIGHTEST CARD HOLDER.',
    lead: 'CodeCard holds the face to face connections you actually care about, without turning them into another feed.',
    points: [
      'Connect through the physical scan, not a search or a digital invite.',
      'Record when you met, where you met, and a note about the conversation.',
      'Schedule a follow up so the person does not disappear into forgotten contacts.',
    ],
    background: U('photo-1515169067868-5387ec356754'),
  },
  {
    id: 'circle',
    label: 'Circle',
    headline: 'STAY CLOSE TO PEOPLE YOU MET.',
    lead: 'Circle is for the people you connected with in person. It is not a social network and it is not a public feed.',
    points: [
      'Keep the people you actually met in one quiet place.',
      'See the work from connections you chose, not strangers.',
      'Use it as memory for real relationships, not as a follower graph.',
    ],
    background: U('photo-1600880292203-757bb62b4baf'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    headline: 'SEE WHAT THEY OPENED.',
    lead: 'After they scan, you can see what they looked at so the follow up has context.',
    points: [
      'Track views, opens, and scans from the people who met you.',
      'Know which project they spent time on before you write.',
      'Keep events you plan to attend so the next meetings have a place.',
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
          <span className="cc-ed__lead">MEET. SHOW.</span>
          <span className="cc-ed__sub">CONNECT. FOLLOW UP.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          Showcase, connect, and follow up are one workflow. Meet someone, show
          your work from your phone, remember the interaction, and keep the next
          step.
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
              <span>One workflow. Five moments on the card.</span>
            </>
          }
          ariaLabel="CodeCard feature walkthrough"
        />
      </div>
    </section>
  );
}

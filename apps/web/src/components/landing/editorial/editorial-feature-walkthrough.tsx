'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
} from '@/components/motion/gsap-runtime';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { ScrollTriggeredVideoHero } from '@/components/ui/scroll-triggered-video-hero';
import { EditorialComparison } from './editorial-comparison';

const V = (file: string) => `https://videos.pexels.com/video-files/${file}`;

const CHAPTERS = [
  {
    id: 'projects',
    label: 'Projects',
    title: 'The work, in the room.',
    description:
      'Open the live record while you speak. Problem, implementation, result, and the artifact that proves the claim.',
    videoUrl: V('4974774/4974774-hd_1920_1080_25fps.mp4'),
  },
  {
    id: 'research',
    label: 'Research',
    title: 'Papers on the same card.',
    description:
      'Methods, findings, and the builds they describe sit in one inspectable surface. No separate citation hunt.',
    videoUrl: V('6549981/6549981-hd_1920_1080_25fps.mp4'),
  },
  {
    id: 'connections',
    label: 'Connections',
    title: 'Context on the person.',
    description:
      'Persist who you met with time, place, a private note, and the next action. The introduction is the source record.',
    videoUrl: V('4484270/4484270-hd_1920_1080_25fps.mp4'),
  },
  {
    id: 'events',
    label: 'Events',
    title: 'Venue on the connection.',
    description:
      'Conference and meetup stay as metadata on the people from that room, not as an orphaned list.',
    videoUrl: V('8716585/8716585-hd_1920_1080_25fps.mp4'),
  },
  {
    id: 'circle',
    label: 'Circle',
    title: 'A private circle.',
    description:
      'A closed set: people you actually exchanged with, their work, your notes, the meeting history. No public graph.',
    videoUrl: V('8426060/8426060-hd_1920_1080_25fps.mp4'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    title: 'What the scan opened.',
    description:
      'QR hits, project opens, paper views, and return visits after the handshake. Signal from the introduction, not a vanity count.',
    videoUrl: V('7947507/7947507-hd_1920_1080_30fps.mp4'),
  },
] as const;

/**
 * Crash course: scroll-triggered video chapters after positioning and comparison.
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
          onComplete: () => {
            gsap.set(lines, { clearProps: 'clipPath,y' });
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
        <p className="cc-ed__eyebrow">In the room</p>
        <h2 id="editorial-walkthrough-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">
            WHEN THE CONVERSATION TURNS TO YOUR WORK.
          </span>
          <span className="cc-ed__sub">HAVE IT READY TO SHOW.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          Pull up your CodeCard and let the work speak for itself. Your
          projects, research, and ideas are right there while you talk, so the
          person you&apos;re meeting remembers more than just your name.
        </p>
      </div>

      <EditorialComparison />

      <div className="cc-ed-walk__bridge cc-ed-walk__bridge--in" aria-hidden />

      <div className="cc-ed-walk__stage">
        <ScrollTriggeredVideoHero
          chapters={[...CHAPTERS]}
          reduceMotion={reduced}
        />
      </div>
    </section>
  );
}

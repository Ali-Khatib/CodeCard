'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE } from '@/components/motion/motion-tokens';
import { useResponsiveScrollScene } from '@/hooks/use-responsive-scroll-scene';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { IdentityProductCard } from './identity-product-card';

const DEMO_PROJECT = DEMO_FEATURED_PROJECTS[0]!;
const DEMO_PAPER = DEMO_RESEARCH_PAPERS[0]!;
const PROJECT_IMAGE = DEMO_PROJECT.screenshots?.[0] ?? DEMO_PROJECT.posterUrl ?? '';

const PIN_VH = { desktop: 160, tablet: 125 } as const;
const PIN_START = 'top 88px';

const EVIDENCE_LAYOUT = [
  { x: -42, y: -30 },
  { x: 38, y: -28 },
  { x: 0, y: 36 },
] as const;

function ProjectEvidence() {
  return (
    <article className="cc-id-assembly__evidence" data-kind="project" data-assembly-evidence="project">
      <p className="cc-id__eyebrow">Project</p>
      <h3 className="cc-id__heading">{DEMO_PROJECT.title}</h3>
      <p className="cc-id__body">{DEMO_PROJECT.tagline}</p>
      {PROJECT_IMAGE ? (
        <div className="cc-id-card__media relative mt-3">
          <Image
            src={PROJECT_IMAGE}
            alt=""
            fill
            sizes="280px"
            className="object-cover object-top"
          />
        </div>
      ) : null}
    </article>
  );
}

function ResearchEvidence() {
  return (
    <article className="cc-id-assembly__evidence" data-kind="research" data-assembly-evidence="research">
      <p className="cc-id__eyebrow">Research</p>
      <h3 className="cc-id__heading">{DEMO_PAPER.title}</h3>
      <p className="cc-id__body line-clamp-4">{DEMO_PAPER.abstract}</p>
    </article>
  );
}

function ImpactEvidence() {
  return (
    <article className="cc-id-assembly__evidence" data-kind="impact" data-assembly-evidence="impact">
      <p className="cc-id__eyebrow">Impact</p>
      <h3 className="cc-id__heading">Professional reach</h3>
      <div className="cc-id-card__metrics mt-4">
        <div className="cc-id-card__metric">
          <strong>1.2k</strong>
          <span>Views</span>
        </div>
        <div className="cc-id-card__metric">
          <strong>86</strong>
          <span>Saves</span>
        </div>
        <div className="cc-id-card__metric">
          <strong>3×</strong>
          <span>Faster intros</span>
        </div>
      </div>
    </article>
  );
}

/**
 * Chapter 2 — Three evidence cards assemble into one IdentityProductCard.
 */
export function IdentityAssembly() {
  const rootRef = useRef<HTMLElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const { mode, canPin } = useResponsiveScrollScene();
  useScrollTriggerRefresh({ contentKey: mode });

  useGSAP(
    () => {
      if (!canEnhanceMotion || mode === 'reduced') return;
      const root = rootRef.current;
      if (!root) return;

      ensureGsapPlugins();
      const stage = root.querySelector<HTMLElement>('[data-assembly-stage]');
      const card = root.querySelector<HTMLElement>('[data-assembly-card]');
      const chips = gsap.utils.toArray<HTMLElement>('[data-assembly-chip]', root);
      if (!stage || !card || chips.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const pinVh = window.matchMedia('(min-width: 1024px)').matches
          ? PIN_VH.desktop
          : PIN_VH.tablet;
        const depthScale = window.matchMedia('(min-width: 1024px)').matches ? 1 : 0.72;

        chips.forEach((chip, i) => {
          const layout = EVIDENCE_LAYOUT[i % EVIDENCE_LAYOUT.length]!;
          gsap.set(chip, {
            xPercent: layout.x * depthScale,
            yPercent: layout.y * depthScale,
            opacity: 0,
            scale: 0.92,
            force3D: true,
          });
        });
        gsap.set(card, { opacity: 0, scale: 0.94, force3D: true });

        const tl = gsap.timeline({
          defaults: { ease: MOTION_EASE.inOut },
          scrollTrigger: {
            id: 'identity-assembly-pin',
            trigger: root,
            start: PIN_START,
            end: `+=${pinVh}%`,
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
          },
        });

        chips.forEach((chip, i) => {
          tl.to(chip, { opacity: 1, scale: 1, duration: 0.2 }, 0.08 + i * 0.06);
        });

        chips.forEach((chip, i) => {
          const layout = EVIDENCE_LAYOUT[i % EVIDENCE_LAYOUT.length]!;
          tl.to(
            chip,
            {
              xPercent: layout.x * 0.5 * depthScale,
              yPercent: layout.y * 0.5 * depthScale,
              duration: 0.28,
            },
            0.38,
          );
        });

        tl.to(
          chips,
          {
            xPercent: 0,
            yPercent: 0,
            opacity: 0,
            scale: 0.86,
            duration: 0.38,
            stagger: 0.03,
          },
          0.68,
        );

        tl.to(card, { opacity: 1, scale: 1, duration: 0.35 }, 0.82);
        tl.to({}, { duration: 0.2 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    {
      scope: rootRef,
      dependencies: [canEnhanceMotion, mode, canPin],
      revertOnUpdate: true,
    },
  );

  const showStatic = mode === 'mobile' || mode === 'reduced';
  const showStage = mode === 'desktop' || mode === 'tablet';

  return (
    <section
      ref={rootRef}
      id="assembly"
      className="cc-id-assembly scroll-mt-28"
      data-testid="identity-assembly"
      data-scene-mode={mode}
      data-motion-owner="gsap"
    >
      <div className="cc-container">
        <p className="cc-id-assembly__equation">
          <em>Project</em> + <em>Research</em> + <em>Impact</em> = CodeCard
        </p>
        <p className="cc-id__eyebrow">The assembly</p>
        <h2 className="cc-id__heading">Evidence becomes identity.</h2>
        <p className="cc-id__body max-w-[42ch]">
          Three proof points — shipped work, published research, measurable impact — converge into
          one living profile.
        </p>

        {showStage ? (
          <div
            className="cc-id-assembly__stage"
            data-assembly-stage
            aria-hidden={showStage || undefined}
          >
            {(['project', 'research', 'impact'] as const).map((kind) => (
              <div
                key={kind}
                className="cc-id-assembly__evidence-wrap"
                data-assembly-chip
                data-evidence={kind}
              >
                {kind === 'project' ? (
                  <ProjectEvidence />
                ) : kind === 'research' ? (
                  <ResearchEvidence />
                ) : (
                  <ImpactEvidence />
                )}
              </div>
            ))}

            <div className="cc-id-assembly__card-wrap" data-assembly-card>
              <IdentityProductCard state="profile" />
            </div>
          </div>
        ) : null}

        {showStatic ? (
          <div className="cc-id-assembly__static" data-testid="identity-assembly-static">
            <div className="cc-id-assembly__static-grid">
              <ProjectEvidence />
              <ResearchEvidence />
              <ImpactEvidence />
            </div>
            <div className="mt-8 flex justify-center">
              <IdentityProductCard state="profile" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

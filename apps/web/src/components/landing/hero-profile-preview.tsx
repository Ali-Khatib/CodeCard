'use client';

import { DEMO_PROFILE, DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

const DEMO_PROJECT = DEMO_FEATURED_PROJECTS[0];

export function HeroProfilePreview() {
  const reducedMotion = useReducedMotion();
  const showVideo = !reducedMotion && Boolean(DEMO_PROJECT.videoUrl);

  return (
    <LiveDemoLink
      className="cc-hero-preview cc-instant-press group mx-auto mt-12 block w-full max-w-[680px] text-left active:scale-[0.99]"
      data-hero-preview
      aria-label="Open the live demo workspace"
    >
      <div className="cc-hero-preview__glow" aria-hidden />
      <div className="cc-hero-preview__frame">
        <div className="cc-hero-preview__header">
          <div className="cc-hero-preview__avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DEMO_PROFILE.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words font-display text-[17px] font-medium leading-tight text-ink md:text-[18px]">
              {DEMO_PROFILE.display_name}
            </p>
            <p className="mt-0.5 break-words text-[13px] leading-snug text-smoke md:text-[14px]">{DEMO_PROFILE.headline}</p>
          </div>
          <span className="cc-hero-preview__live font-eyebrow">Live demo</span>
        </div>

        <div className="cc-hero-preview__project">
          <div className="cc-hero-preview__media">
            {showVideo && DEMO_PROJECT.videoUrl ? (
              <video
                src={DEMO_PROJECT.videoUrl}
                poster={DEMO_PROJECT.posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover object-top"
              />
            ) : DEMO_PROJECT.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={DEMO_PROJECT.posterUrl}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            ) : null}
            <div className="cc-hero-preview__media-overlay">
              <p className="font-eyebrow text-[11px] uppercase tracking-[0.08em] text-white/90">
                Featured project
              </p>
              <p className="mt-1 font-display text-[20px] font-medium leading-tight text-white md:text-[22px]">
                {DEMO_PROJECT.title}
              </p>
              <p className="mt-1 text-[14px] text-white/80">{DEMO_PROJECT.tagline}</p>
            </div>
          </div>
        </div>

        <p className="cc-hero-preview__cta font-sans">Open live demo workspace →</p>
      </div>
    </LiveDemoLink>
  );
}

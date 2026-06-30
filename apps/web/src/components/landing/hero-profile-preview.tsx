'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_PROFILE, DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { prefetchHref } from '@/hooks/use-view-transition-navigate';

const DEMO_PROJECT = DEMO_FEATURED_PROJECTS[0];

export function HeroProfilePreview() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const showVideo = !reducedMotion && Boolean(DEMO_PROJECT.videoUrl);

  return (
    <Link
      href="/profiles"
      className="cc-hero-preview cc-instant-press group mx-auto mt-12 block w-full max-w-[680px] text-left active:scale-[0.99]"
      data-hero-preview
      aria-label={`See ${DEMO_PROFILE.display_name}'s live demo profile`}
      onMouseEnter={() => prefetchHref('/profiles', router)}
      onFocus={() => prefetchHref('/profiles', router)}
    >
      <div className="cc-hero-preview__glow" aria-hidden />
      <div className="cc-hero-preview__frame">
        <div className="cc-hero-preview__browser" aria-hidden>
          <span className="cc-hero-preview__dot" />
          <span className="cc-hero-preview__dot" />
          <span className="cc-hero-preview__dot" />
          <span className="cc-hero-preview__url font-eyebrow">codecard.app/demo</span>
        </div>

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
            <p className="truncate font-display text-[17px] font-medium text-vellum md:text-[18px]">
              {DEMO_PROFILE.display_name}
            </p>
            <p className="truncate text-[13px] text-ash md:text-[14px]">{DEMO_PROFILE.headline}</p>
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
              <p className="font-eyebrow text-[11px] uppercase tracking-[0.08em] text-reactor-bright">
                Featured project
              </p>
              <p className="mt-1 font-display text-[20px] font-medium leading-tight text-vellum md:text-[22px]">
                {DEMO_PROJECT.title}
              </p>
              <p className="mt-1 text-[14px] text-ash">{DEMO_PROJECT.tagline}</p>
            </div>
          </div>
        </div>

        <p className="cc-hero-preview__cta font-sans">See live demo profile →</p>
      </div>
    </Link>
  );
}

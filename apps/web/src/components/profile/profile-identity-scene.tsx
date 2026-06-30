'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import {
  createLanyardBackImage,
  createLanyardFrontImage,
  parseHeadline,
} from '@/lib/profile/lanyard-badge-images';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { MagneticIconButton } from './magnetic-icon-button';
import {
  getProfileLinkAria,
  resolveProfileLinkIcon,
} from '@/lib/icons/profile-links';

const Radar = dynamic(() => import('@/components/react-bits/radar/radar'), {
  ssr: false,
  loading: () => null,
});

const Lanyard = dynamic(() => import('@/components/react-bits/lanyard/lanyard'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(52vh,420px)] w-full items-center justify-center">
      <div className="h-32 w-24 animate-pulse rounded-2xl bg-zinc-900/80" />
    </div>
  ),
});

interface ProfileIdentitySceneProps {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  accentColor: string;
  onProjectSelect: (projectId: string) => void;
}

export function ProfileIdentityScene({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  links,
  projects,
  accentColor,
  onProjectSelect,
}: ProfileIdentitySceneProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { role, company } = parseHeadline(headline);

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${profileSlug === 'demo' ? '/demo' : `/${profileSlug}`}`
      : '';

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '100px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const front = await createLanyardFrontImage({
        avatarUrl,
        displayName,
        headline: role,
        company,
        accentColor,
      });
      const back = await createLanyardBackImage({
        profileUrl: profileUrl || `https://codecard.app/${profileSlug}`,
        location: null,
        linkCount: Math.max(links.length, 3),
        accentColor,
      });
      if (!cancelled) {
        setFrontImage(front);
        setBackImage(back);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [avatarUrl, displayName, role, company, accentColor, profileUrl, profileSlug, links.length]);

  const radarPoints = useMemo(
    () =>
      projects.slice(0, 8).map((p, i) => {
        const angle = (i / Math.max(projects.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const radius = 38 + (i % 3) * 8;
        return {
          id: p.id,
          title: p.title,
          domain: p.domains[0] ?? 'Work',
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius * 0.65,
        };
      }),
    [projects],
  );

  return (
    <section
      ref={sceneRef}
      aria-labelledby="profile-identity-heading"
      className="relative mx-auto w-full max-w-6xl px-4 pb-6 pt-20 md:px-8 md:pt-24"
      suppressHydrationWarning
    >
      <div className="sr-only">
        <h1 id="profile-identity-heading">{displayName}</h1>
        {headline && <p>{headline}</p>}
      </div>

      <div className="relative grid min-h-[min(58vh,520px)] grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_320px]">
        <div className="relative order-2 lg:order-1">
          <div className="max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-500">
              Identity
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
              {displayName}
            </h2>
            <p className="mt-2 text-base text-zinc-400 md:text-lg">{role}</p>
            {company && <p className="mt-1 text-sm text-zinc-500">{company}</p>}

            {links.length > 0 && (
              <nav className="mt-6 flex flex-wrap gap-2" aria-label="Connect">
                {links.map((link) => {
                  const Icon = resolveProfileLinkIcon(link.type);
                  return (
                    <MagneticIconButton
                      key={link.url + link.type}
                      href={link.url}
                      ariaLabel={getProfileLinkAria(link.type, link.label)}
                      accent={accentColor}
                    >
                      <Icon aria-hidden />
                    </MagneticIconButton>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        <div className="relative order-1 mx-auto h-[min(52vh,420px)] w-full max-w-md lg:order-2">
          {!reducedMotion && visible && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.22]">
              <Radar
                color={accentColor}
                backgroundColor="#000000"
                brightness={0.35}
                scale={0.55}
                ringCount={6}
                spokeCount={8}
                sweepSpeed={0.35}
                ringThickness={0.04}
                falloff={2.4}
                enableMouseInteraction={false}
                paused={!visible}
              />
            </div>
          )}

          {radarPoints.map((pt) => (
            <RadarPoint
              key={pt.id}
              point={pt}
              accentColor={accentColor}
              onSelect={() => onProjectSelect(pt.id)}
            />
          ))}

          {reducedMotion ? (
            <MobileBadge
              frontImage={frontImage}
              backImage={backImage}
              flipped={flipped}
              onToggle={() => setFlipped((f) => !f)}
              displayName={displayName}
            />
          ) : (
            visible &&
            frontImage &&
            backImage && (
              <div className="relative h-full w-full">
                <Suspense
                  fallback={
                    <MobileBadge
                      frontImage={frontImage}
                      backImage={backImage}
                      flipped={flipped}
                      onToggle={() => setFlipped((f) => !f)}
                      displayName={displayName}
                    />
                  }
                >
                  <Lanyard
                    position={[0, 0, 22]}
                    gravity={[0, -32, 0]}
                    fov={18}
                    frontImage={frontImage}
                    backImage={backImage}
                    imageFit="cover"
                    lanyardWidth={0.9}
                  />
                </Suspense>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function RadarPoint({
  point,
  accentColor,
  onSelect,
}: {
  point: { id: string; title: string; domain: string; x: number; y: number };
  accentColor: string;
  onSelect: () => void;
}) {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLit(true);
      window.setTimeout(() => setLit(false), 400);
    }, 3200 + Math.random() * 2000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
      }}
      onClick={onSelect}
      aria-label={`Open ${point.title}`}
    >
      <span
        className="block h-2 w-2 rounded-full transition-all duration-300"
        style={{
          backgroundColor: lit ? accentColor : `${accentColor}66`,
          boxShadow: lit ? `0 0 12px ${accentColor}` : 'none',
        }}
      />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900/95 px-2 py-1 text-[10px] text-zinc-300 shadow-lg group-hover:block group-focus-visible:block">
        {point.title}
        <span className="ml-1.5 text-zinc-600">{point.domain}</span>
      </span>
    </button>
  );
}

function MobileBadge({
  frontImage,
  backImage,
  flipped,
  onToggle,
  displayName,
}: {
  frontImage: string | null;
  backImage: string | null;
  flipped: boolean;
  onToggle: () => void;
  displayName: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative mx-auto flex h-[280px] w-[200px] perspective-[800px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)]"
      aria-label={flipped ? 'Show front of badge' : `Show back of ${displayName} badge`}
    >
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
          {frontImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={frontImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-zinc-900" />
          )}
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {backImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-zinc-900" />
          )}
        </div>
      </div>
    </button>
  );
}

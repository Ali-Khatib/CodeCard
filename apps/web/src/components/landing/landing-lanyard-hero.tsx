'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
import {
  createLanyardBackImage,
  createLanyardFrontImage,
  parseHeadline,
} from '@/lib/profile/lanyard-badge-images';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { GradientBlinds } from '@/components/research/gradient-blinds';
import { COLORS } from '@/lib/design/tokens';

const Lanyard = dynamic(() => import('@/components/react-bits/lanyard/lanyard'), {
  ssr: false,
  loading: () => <LanyardSkeleton />,
});

const ACCENT = COLORS.reactor;

interface LandingLanyardHeroProps {
  scrollProgress?: number;
  webglOpacityRef?: React.RefObject<HTMLDivElement | null>;
  lanyardTransformRef?: React.RefObject<HTMLDivElement | null>;
}

export function LandingLanyardHero({
  scrollProgress = 0,
  webglOpacityRef,
  lanyardTransformRef,
}: LandingLanyardHeroProps) {
  const reducedMotion = useReducedMotion();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const { role, company } = parseHeadline(DEMO_PROFILE.headline);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const front = await createLanyardFrontImage({
        avatarUrl: DEMO_PROFILE.avatar_url,
        displayName: DEMO_PROFILE.display_name,
        headline: role,
        company,
        accentColor: ACCENT,
      });
      const back = await createLanyardBackImage({
        profileUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/demo/card`,
        linkCount: DEMO_PROFILE.links.length,
        accentColor: ACCENT,
      });
      if (!cancelled) {
        setFrontImage(front);
        setBackImage(back);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, company]);

  const isMobile =
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#000000]">
      <GradientBlinds intensity={0.85} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 65% at 72% 48%, rgba(76,29,149,0.35), transparent 62%), radial-gradient(ellipse 40% 40% at 20% 30%, rgba(15,2,23,0.9), transparent)',
        }}
      />

      <div
        ref={webglOpacityRef}
        className="absolute inset-0"
        data-testid="lanyard-canvas-wrap"
      >
        <div
          ref={lanyardTransformRef}
          className="absolute inset-0 origin-center will-change-transform"
        >
          {reducedMotion || isMobile ? (
            <div className="flex h-full items-center justify-center px-6">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="h-[min(58vh,320px)] w-[min(72vw,240px)] perspective-[800px] outline-none focus-visible:ring-2 focus-visible:ring-[#a855f7]"
                aria-label="Flip demo CodeCard badge"
                data-testid="lanyard-badge-bounds"
              >
                <div
                  className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
                  style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  <BadgeFace src={frontImage} />
                  <BadgeFace src={backImage} flipped />
                </div>
              </button>
            </div>
          ) : frontImage && backImage ? (
            <div className="absolute inset-y-0 right-0 w-full lg:left-[42%] lg:w-[58%]">
              <div
                data-testid="lanyard-badge-bounds"
                className="pointer-events-none absolute left-1/2 top-[48%] h-[min(72vh,560px)] min-h-[420px] w-[min(42vw,440px)] -translate-x-1/2 -translate-y-1/2"
              />
              <Suspense fallback={<LanyardSkeleton />}>
                <Lanyard
                  position={[0.8, 0, 11]}
                  gravity={[0, -30, 0]}
                  fov={11}
                  frontImage={frontImage}
                  backImage={backImage}
                  imageFit="cover"
                  lanyardWidth={1}
                  cardScale={3.35}
                  scrollProgress={scrollProgress}
                  className="absolute inset-0"
                />
              </Suspense>
            </div>
          ) : (
            <LanyardSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}

function LanyardSkeleton() {
  return (
    <div className="absolute inset-y-0 right-0 flex w-full items-center justify-center lg:left-[42%] lg:w-[58%]">
      <div
        className="h-[min(72vh,520px)] min-h-[420px] w-[min(50vw,380px)] animate-pulse rounded-lg border border-[rgba(196,167,255,0.24)] bg-[#0f0217]"
        aria-hidden
        data-testid="lanyard-loading"
      />
    </div>
  );
}

function BadgeFace({ src, flipped }: { src: string | null; flipped?: boolean }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-lg border border-[rgba(196,167,255,0.35)] shadow-[0_0_40px_rgba(124,58,237,0.25)] [backface-visibility:hidden] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-[#0f0217]" />
      )}
    </div>
  );
}

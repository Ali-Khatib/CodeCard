'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectMedia } from '@/components/profile/project-media';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { FeaturedProject } from '@/lib/projects/featured';
import { centerProximity, lerp } from '@/lib/projects/featured';
import { prefetchProjectRoute } from '@/hooks/use-view-transition-navigate';
import { saveScrollForProfile } from '@/hooks/use-scroll-restore';
import { TechLogoRow } from '@/components/profile/tech-logo-row';
import { TYPE } from '@/lib/design/tokens';

gsap.registerPlugin(ScrollTrigger);

const ACTIVE_THRESHOLD = 0.58;
const BASE_SCALE = 0.94;
const ACTIVE_SCALE = 1;

interface ScrollProjectCardProps {
  project: FeaturedProject;
  profileSlug: string;
  isActive: boolean;
  isOnlyActiveVideo?: boolean;
  proximity: number;
  reducedMotion: boolean;
  accentColor: string;
  onProximityChange: (id: string, proximity: number) => void;
  onOpen?: (element: HTMLElement) => void;
}

export function ScrollProjectCard({
  project,
  profileSlug,
  isActive,
  isOnlyActiveVideo = false,
  proximity,
  reducedMotion,
  accentColor,
  onProximityChange,
  onOpen,
}: ScrollProjectCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const breatheRef = useRef<gsap.core.Tween | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [scrollScale, setScrollScale] = useState(BASE_SCALE);

  const borderRadius = reducedMotion ? 8 : lerp(16, 8, proximity);
  const dimOpacity = reducedMotion ? 1 : lerp(0.78, 1, proximity);
  const saturation = reducedMotion ? 1 : lerp(0.88, 1.05, proximity);
  const showVideo = isOnlyActiveVideo && videoReady && project.videoUrl && !reducedMotion;
  const isCentered = proximity >= ACTIVE_THRESHOLD;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const prox = centerProximity(rect, window.innerHeight);
      onProximityChange(project.id, prox);
      if (!reducedMotion) setScrollScale(lerp(BASE_SCALE, ACTIVE_SCALE, prox));
    };

    measure();
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.15,
      onUpdate: measure,
      onRefresh: measure,
    });

    return () => st.kill();
  }, [project.id, onProximityChange, reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !project.videoUrl || reducedMotion) return;
    if (isOnlyActiveVideo && proximity > ACTIVE_THRESHOLD) video.play().catch(() => {});
    else video.pause();
  }, [isOnlyActiveVideo, proximity, project.videoUrl, reducedMotion]);

  useEffect(() => {
    const media = mediaRef.current;
    if (reducedMotion || !isActive || !media || proximity < ACTIVE_THRESHOLD) {
      breatheRef.current?.kill();
      return;
    }
    breatheRef.current?.kill();
    breatheRef.current = gsap.to(media, {
      scale: 1.012,
      duration: 2.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      transformOrigin: 'center center',
    });
    return () => {
      breatheRef.current?.kill();
    };
  }, [isActive, reducedMotion, proximity]);

  const projectUrl = `${profileSlug === 'demo' ? '/demo' : `/${profileSlug}`}/projects/${project.id}`;

  const handlePrefetch = useCallback(() => {
    prefetchProjectRoute(profileSlug, project.id, router);
    if (project.posterUrl) {
      const img = new Image();
      img.src = project.posterUrl;
    }
  }, [profileSlug, project.id, project.posterUrl, router]);

  const handleOpen = useCallback(() => {
    if (!cardRef.current) return;
    saveScrollForProfile(profileSlug);
    if (onOpen) {
      onOpen(cardRef.current);
      return;
    }
    router.push(projectUrl);
  }, [onOpen, profileSlug, projectUrl, router]);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      onClick={handleOpen}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className="relative mx-auto w-[min(90%,1100px)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-void-canvas cc-project-card-morph cc-instant-press active:scale-[0.985] active:brightness-[0.98]"
      style={{
        opacity: dimOpacity,
        transform: reducedMotion ? undefined : `scale(${scrollScale})`,
        filter: reducedMotion ? undefined : `saturate(${saturation}) brightness(${isCentered ? 1.02 : 0.96})`,
        willChange: reducedMotion ? 'auto' : 'transform, opacity, filter',
        transition: reducedMotion ? undefined : 'transform 0.08s ease-out, filter 0.2s',
        minHeight: 'min(68vh, 780px)',
      }}
      data-active={isActive}
    >
      <div
        className="relative overflow-hidden bg-midnight shadow-rim"
        style={{
          borderRadius: `${borderRadius}px`,
          boxShadow: isCentered
            ? `0 0 0 1px ${accentColor}44, 0 32px 80px -24px rgba(0,0,0,0.55)`
            : undefined,
        }}
      >
        <div
          className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]"
          style={{ borderRadius: `${borderRadius}px` }}
        >
          <div ref={mediaRef} className="absolute inset-0">
            <div className="absolute inset-0">
              {project.posterUrl && (
                <ProjectMedia
                  src={project.posterUrl}
                  className="transition-opacity duration-500"
                  style={{ opacity: showVideo ? 0 : 1 }}
                  sizes="(max-width: 768px) 100vw, 1180px"
                  priority={proximity > 0.35}
                />
              )}
              {project.videoUrl && (
                <video
                  ref={videoRef}
                  src={project.videoUrl}
                  muted
                  loop
                  playsInline
                  preload={proximity > 0.2 ? 'auto' : 'metadata'}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
                  style={{ opacity: showVideo ? 1 : 0 }}
                  onLoadedData={() => setVideoReady(true)}
                />
              )}
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-void-canvas/90 via-void-canvas/35 to-transparent"
            style={{ borderRadius: `${borderRadius}px` }}
          />

          <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-10">
            <h3 className={`${TYPE.projectTitle} text-lilac-white`}>{project.title}</h3>
            {project.tagline && (
              <p className="mt-2 max-w-[640px] text-[17px] text-ash md:text-[18px]">{project.tagline}</p>
            )}
            {project.technologies.length > 0 && (
              <TechLogoRow
                technologies={project.technologies.slice(0, 8)}
                isActive={isCentered}
                pop
                size="md"
                className="mt-5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

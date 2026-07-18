'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { ProjectMedia } from './project-media';
import { scrollBehaviorForPreference } from '@/hooks/use-reduced-motion';

interface ScrollStripProps {
  projects: FeaturedProject[];
  activeId: string;
  accentColor: string;
  onSelect: (projectId: string) => void;
}

export function ScrollStrip({ projects, activeId, accentColor, onSelect }: ScrollStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeEl = track.querySelector(`[data-id="${activeId}"]`) as HTMLElement | null;
    if (activeEl) {
      const target =
        activeEl.offsetLeft - track.clientWidth / 2 + activeEl.clientWidth / 2;
      track.scrollTo({ left: target, behavior: scrollBehaviorForPreference() });
    }
  }, [activeId]);

  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { active: true, startX: e.clientX, scrollLeft: track.scrollLeft };
    track.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active || !trackRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    trackRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.active = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  const onWheel = useCallback((e: React.WheelEvent) => {
    const track = trackRef.current;
    if (!track || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    track.scrollLeft += e.deltaX;
  }, []);

  if (projects.length <= 1) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 w-[min(94vw,640px)] -translate-x-1/2"
      role="navigation"
      aria-label="Project strip"
    >
      <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/85 py-2 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-zinc-950/95 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-950/95 to-transparent" />

        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto px-4 scrollbar-none"
          style={{ scrollBehavior: 'auto' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          {projects.map((p) => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                data-id={p.id}
                onClick={() => onSelect(p.id)}
                className="group flex shrink-0 flex-col items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)]"
                aria-current={isActive ? 'true' : undefined}
              >
                <div
                  className="relative h-12 w-[72px] overflow-hidden rounded-lg transition-all duration-300"
                  style={{
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: isActive ? accentColor : 'rgb(39 39 42)',
                    transform: isActive ? 'scale(1.05)' : 'scale(0.95)',
                    opacity: isActive ? 1 : 0.55,
                  }}
                >
                  {p.posterUrl ? (
                    <ProjectMedia src={p.posterUrl} className="h-full w-full object-cover" sizes="72px" />
                  ) : (
                    <div className="h-full w-full bg-zinc-900" />
                  )}
                </div>
                <span className="max-w-[88px] break-words text-center text-[9px] leading-tight text-zinc-500 group-aria-[current=true]:text-zinc-300">
                  {p.title}
                </span>
              </button>
            );
          })}
        </div>

        <motion.div
          className="absolute bottom-0 left-4 right-4 h-0.5 origin-left rounded-full bg-zinc-800"
          aria-hidden
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor, scaleX: progress, transformOrigin: 'left' }}
          />
        </motion.div>
      </div>
    </div>
  );
}

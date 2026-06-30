'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TechIcon } from './tech-icon';
import { getTechLabel } from '@/lib/icons/tech-icons';

interface TechLogosCarouselProps {
  technologies: string[];
  className?: string;
  speed?: number;
}

export function TechLogosCarousel({
  technologies,
  className = '',
  speed = 0.45,
}: TechLogosCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const items = technologies.filter(Boolean);
  const loopItems = [...items, ...items];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    if (reducedMotion || items.length < 2) return;
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const step = () => {
      if (!pausedRef.current && !dragRef.current.active) {
        offsetRef.current -= speed;
        const half = track.scrollWidth / 2;
        if (half > 0 && Math.abs(offsetRef.current) >= half) offsetRef.current = 0;
        track.style.transform = `translateX(${offsetRef.current}px)`;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, items.length, speed]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startOffset: offsetRef.current };
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    offsetRef.current = dragRef.current.startOffset + (e.clientX - dragRef.current.startX);
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current.active = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);
  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  if (items.length === 0) return null;
  if (!mounted) {
    return <div className={`h-16 ${className}`} aria-hidden />;
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#050505] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#050505] to-transparent" />

      <div
        ref={trackRef}
        className="flex w-max gap-8 px-6 py-3 will-change-transform"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        role="list"
        aria-label="Technologies"
      >
        {loopItems.map((tech, i) => {
          const label = getTechLabel(tech);
          const isDuplicate = i >= items.length;
          return (
            <span
              key={`${tech}-${i}`}
              role="listitem"
              aria-hidden={isDuplicate}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl text-zinc-300"
              title={isDuplicate ? undefined : label}
            >
              <TechIcon tech={tech} imgClassName="h-7 w-7" />
            </span>
          );
        })}
      </div>
    </div>
  );
}

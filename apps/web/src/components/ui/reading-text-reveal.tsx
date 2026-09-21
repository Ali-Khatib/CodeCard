'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function revealedWordCount(progress: number, total: number) {
  if (total <= 0) return 0;
  const t = Math.max(0, Math.min(1, progress));
  return Math.min(total, Math.floor(t * total + 1e-6));
}

export function wordsFromSegments(segments: readonly string[]) {
  return segments.flatMap((segment) => segment.trim().split(/\s+/).filter(Boolean));
}

type ReadingTextRevealProps = {
  segments: readonly string[];
  className?: string;
  segmentClassName?: string;
  revealedClassName?: string;
  pendingClassName?: string;
};

/**
 * Scroll-linked word reveal. Progress is derived from the block's position
 * against the viewport eye-line, then eased with a short lerp.
 */
export function ReadingTextReveal({
  segments,
  className,
  segmentClassName,
  revealedClassName = 'text-black dark:text-white',
  pendingClassName = 'text-gray-400 dark:text-gray-600',
}: ReadingTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(0);
  const totalWords = useMemo(() => wordsFromSegments(segments).length, [segments]);

  useEffect(() => {
    let rafId: number | null = null;
    let targetProgress = 0;
    let currentProgress = 0;

    const smoothScroll = () => {
      const difference = targetProgress - currentProgress;
      currentProgress += difference * 0.12;

      if (Math.abs(targetProgress - currentProgress) > 0.001) {
        setRevealed(revealedWordCount(currentProgress, totalWords));
        rafId = requestAnimationFrame(smoothScroll);
      } else {
        setRevealed(revealedWordCount(targetProgress, totalWords));
      }
    };

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const eyeLevel = windowHeight * 0.62;
      const animationStart = rect.top + window.scrollY - eyeLevel;
      const animationEnd = rect.top + window.scrollY + rect.height - eyeLevel;
      const scrollDistance = Math.max(animationEnd - animationStart, 1);
      const progress = (window.scrollY - animationStart) / scrollDistance;
      targetProgress = Math.max(0, Math.min(1, progress));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(smoothScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [totalWords]);

  let wordIndex = 0;

  return (
    <div
      ref={containerRef}
      className={cn('max-w-5xl mx-auto px-8 pt-32 pb-32', className)}
      style={{ minHeight: '400vh' }}
    >
      <div className="space-y-16">
        {segments.map((segment, segmentIndex) => {
          const segmentWords = segment.trim().split(/\s+/).filter(Boolean);
          const segmentStartIndex = wordIndex;
          wordIndex += segmentWords.length;

          return (
            <p
              key={segmentIndex}
              className={cn('text-5xl md:text-6xl leading-tight font-semibold', segmentClassName)}
            >
              {segmentWords.map((word, i) => {
                const currentWordIndex = segmentStartIndex + i;
                const isRevealed = currentWordIndex < revealed;
                return (
                  <span
                    key={`${segmentIndex}-${i}`}
                    className={isRevealed ? revealedClassName : pendingClassName}
                    style={{
                      transition: 'all 0.3s ease-out',
                      opacity: isRevealed ? 1 : 0.4,
                    }}
                  >
                    {word}{' '}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
}

const DEMO_SEGMENTS = [
  'So there I was, 3 AM on a Tuesday, debugging code that I swore worked perfectly just six hours ago.',
  'My client had just sent their fourth quick question of the night.',
  'The coffee machine broke at midnight. This was not ideal.',
  'I realized I had been wearing the same hoodie for three days straight. My cat had stopped judging me. That is when I knew things were serious.',
  'The client wanted just a small change to the entire backend architecture. No big deal, right?',
  'I quoted them two weeks. They needed it by Friday. It was already Wednesday.',
  'My inbox had 47 unread messages. 43 of them started with a quick question.',
  'I discovered I had been on mute during the entire client call. For 45 minutes, I had been passionately explaining solutions to absolutely no one.',
  'The final revision was revision number 23. The optimist in me died somewhere around revision 11.',
  'But you know what? I shipped it. On time. It actually worked.',
  'The client loved it. Five stars. Would definitely send more quick questions at 3 AM again.',
  'This is the life. This is freelancing. This is why I will never go back to a regular job.',
  'At least my cat respects me again.',
] as const;

export const Component = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-black dark:via-black dark:to-black transition-colors duration-500">
      <ReadingTextReveal segments={DEMO_SEGMENTS} />
      <div style={{ height: '100vh' }} />
      <div className="pb-20 pt-12 text-center">
        <p className="text-8xl md:text-9xl tracking-tight text-gray-400 dark:text-gray-600 font-semibold">
          The End
        </p>
      </div>
    </div>
  );
};

export default Component;

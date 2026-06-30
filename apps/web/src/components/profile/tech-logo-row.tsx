'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { TechIcon } from './tech-icon';
import { getTechLabel } from '@/lib/icons/tech-icons';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface TechLogoRowProps {
  technologies: string[];
  sequential?: boolean;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Elastic scale-in, like audience bounce cards */
  pop?: boolean;
}

const POP_EASE = 'elastic.out(1, 0.5)';

function TechIconContent({ tech, size }: { tech: string; size: 'sm' | 'md' | 'lg' }) {
  const imgSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';

  return <TechIcon tech={tech} imgClassName={imgSize} />;
}

export function TechLogoRow({
  technologies,
  sequential = false,
  isActive = true,
  size = 'md',
  className = '',
  pop = false,
}: TechLogoRowProps) {
  const reducedMotion = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);
  const iconSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-[32px]' : 'text-xl';

  useEffect(() => {
    if (!pop || reducedMotion) return;

    const el = rowRef.current;
    if (!el) return;

    const items = el.querySelectorAll('.cc-tech-logo-pop-item');
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.killTweensOf(items);

      if (isActive) {
        gsap.fromTo(
          items,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            stagger: 0.08,
            ease: POP_EASE,
            duration: 0.85,
          },
        );
      } else {
        gsap.set(items, { scale: 0, opacity: 0 });
      }
    }, rowRef);

    return () => ctx.revert();
  }, [pop, isActive, technologies, reducedMotion]);

  if (pop) {
    return (
      <div
        ref={rowRef}
        className={`flex flex-wrap items-center gap-2 md:gap-3 ${className}`}
        role="list"
      >
        {technologies.map((tech) => {
          const label = getTechLabel(tech);

          return (
            <span
              key={tech}
              role="listitem"
              title={label}
              aria-label={label}
              className={`cc-tech-logo-pop-item inline-flex items-center justify-center ${iconSize}`}
              style={reducedMotion ? undefined : { opacity: 0, transform: 'scale(0)' }}
            >
              <TechIconContent tech={tech} size={size} />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 md:gap-3 ${className}`} role="list">
      {technologies.map((tech, i) => {
        const label = getTechLabel(tech);

        return (
          <motion.span
            key={tech}
            role="listitem"
            title={label}
            aria-label={label}
            className={`inline-flex items-center justify-center ${iconSize}`}
            initial={sequential && !isActive ? { opacity: 0, scale: 0.8 } : false}
            animate={
              sequential
                ? { opacity: 1, scale: 1 }
                : { opacity: isActive ? 1 : 0.45, scale: 1 }
            }
            transition={{
              delay: sequential ? 0.08 * i : 0,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <TechIconContent tech={tech} size={size} />
          </motion.span>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
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
  /** Re-bounce visible icons when hoverActive toggles (e.g. card hover) */
  hoverPop?: boolean;
  /** Drives hoverPop animation — separate from mount pop isActive */
  hoverActive?: boolean;
  /** Paper chips with border — better contrast on light dashboards */
  variant?: 'plain' | 'chip';
}

const POP_EASE = 'elastic.out(1, 0.5)';
const HOVER_SPRING = { type: 'spring', stiffness: 420, damping: 24 } as const;

function TechIconContent({ tech, size }: { tech: string; size: 'sm' | 'md' | 'lg' }) {
  const imgSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';

  return <TechIcon tech={tech} imgClassName={imgSize} />;
}

const CHIP_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

function TechLogoItem({
  tech,
  size,
  variant,
  iconSize,
  popItem,
  hoverPopItem,
  style,
  sequential,
  index = 0,
  isActive = true,
  reducedMotion = false,
}: {
  tech: string;
  size: 'sm' | 'md' | 'lg';
  variant: 'plain' | 'chip';
  iconSize: string;
  popItem?: boolean;
  hoverPopItem?: boolean;
  style?: CSSProperties;
  sequential?: boolean;
  index?: number;
  isActive?: boolean;
  reducedMotion?: boolean;
}) {
  const label = getTechLabel(tech);
  const inner = <TechIconContent tech={tech} size={size} />;
  const chipClass =
    variant === 'chip'
      ? `cc-tech-logo-chip ${CHIP_SIZE[size]}`
      : `inline-flex items-center justify-center ${iconSize}`;

  const chip = (
    <motion.span
      className="cc-tech-logo-chip-lift"
      whileHover={
        reducedMotion ? undefined : { y: -6, scale: 1.12 }
      }
      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      transition={HOVER_SPRING}
    >
      <span
        className={`${chipClass}${popItem ? ' cc-tech-logo-pop-item' : ''}${hoverPopItem ? ' cc-tech-logo-hover-pop-item' : ''}`}
        style={style}
      >
        {inner}
      </span>
    </motion.span>
  );

  const tooltip = <span className="cc-tech-logo-tooltip">{label}</span>;

  const content = (
    <>
      {chip}
      {tooltip}
    </>
  );

  if (sequential) {
    return (
      <motion.span
        role="listitem"
        aria-label={label}
        className="cc-tech-logo-chip-wrap"
        initial={!isActive ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.08 * index,
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span
      role="listitem"
      aria-label={label}
      className="cc-tech-logo-chip-wrap"
      style={!sequential && !isActive ? { opacity: 0.45 } : undefined}
    >
      {content}
    </span>
  );
}

export function TechLogoRow({
  technologies,
  sequential = false,
  isActive = true,
  size = 'md',
  className = '',
  pop = false,
  hoverPop = false,
  hoverActive = false,
  variant = 'plain',
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
    }, rowRef);

    return () => {
      gsap.killTweensOf(items);
    };
  }, [pop, technologies, reducedMotion]);

  useEffect(() => {
    if (!hoverPop || reducedMotion || !hoverActive) return;

    const el = rowRef.current;
    if (!el) return;

    const items = el.querySelectorAll('.cc-tech-logo-hover-pop-item');
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.killTweensOf(items);
      gsap.fromTo(
        items,
        { scale: 0.72 },
        {
          scale: 1,
          stagger: 0.055,
          ease: POP_EASE,
          duration: 0.65,
        },
      );
    }, rowRef);

    return () => {
      gsap.killTweensOf(items);
      gsap.set(items, { scale: 1, clearProps: 'transform' });
    };
  }, [hoverPop, hoverActive, technologies, reducedMotion]);

  if (pop || hoverPop) {
    return (
      <div
        ref={rowRef}
        className={`flex flex-wrap items-center gap-2 md:gap-3 ${className}`}
        role="list"
      >
        {technologies.map((tech, i) => (
          <TechLogoItem
            key={tech}
            tech={tech}
            size={size}
            variant={variant}
            iconSize={iconSize}
            popItem={pop}
            hoverPopItem={hoverPop}
            sequential={sequential}
            index={i}
            isActive={isActive}
            reducedMotion={reducedMotion}
            style={
              pop && !reducedMotion ? { opacity: 0, transform: 'scale(0)' } : undefined
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 md:gap-3 ${className}`} role="list">
      {technologies.map((tech, i) => (
        <TechLogoItem
          key={tech}
          tech={tech}
          size={size}
          variant={variant}
          iconSize={iconSize}
          sequential={sequential}
          index={i}
          isActive={isActive}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

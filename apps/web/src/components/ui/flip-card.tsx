'use client';

import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight, Code2, Copy, Rocket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  sceneClassName?: string;
  /** Quiet cue for touch devices. Empty string hides it. */
  hint?: string;
  defaultFlipped?: boolean;
  flipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** Hover-flip on fine pointers. Disable when a parent owns hover. */
  flipOnHover?: boolean;
  /** Tap empty areas to toggle on coarse pointers. */
  flipOnClick?: boolean;
  /** Shown while flipped. Defaults to “Tap to flip back”. */
  hintWhenFlipped?: string;
};

function isFineHoverDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function isFlipCardInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('a, button, input, textarea, select, [role="button"]'))
  );
}

/**
 * 3D flip shell. Hover flips on desktop; tap toggles on phones.
 * Interactive children (links, buttons) do not toggle the card.
 */
export function FlipCard({
  front,
  back,
  className,
  sceneClassName,
  hint = 'Tap to flip',
  defaultFlipped = false,
  flipped,
  onFlippedChange,
  flipOnHover = true,
  flipOnClick = true,
  hintWhenFlipped,
}: FlipCardProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultFlipped);
  const isControlled = flipped !== undefined;
  const isFlipped = isControlled ? flipped : uncontrolled;

  const setFlipped = useCallback(
    (next: boolean | ((value: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(isFlipped) : next;
      if (!isControlled) setUncontrolled(resolved);
      onFlippedChange?.(resolved);
    },
    [isControlled, isFlipped, onFlippedChange],
  );

  const hoverOn = useCallback(() => {
    if (flipOnHover && isFineHoverDevice()) setFlipped(true);
  }, [flipOnHover, setFlipped]);

  const hoverOff = useCallback(() => {
    if (flipOnHover && isFineHoverDevice()) setFlipped(false);
  }, [flipOnHover, setFlipped]);

  const onSceneClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!flipOnClick) return;
      if (isFlipCardInteractiveTarget(event.target)) return;
      if (isFineHoverDevice()) return;
      setFlipped((value) => !value);
    },
    [flipOnClick, setFlipped],
  );

  return (
    <div
      className={cn('cc-flip-card group/flip relative w-full min-w-0', className)}
      data-flipped={isFlipped ? 'true' : 'false'}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
    >
      {hint ? (
        <button
          type="button"
          className="cc-flip-card__hint"
          aria-pressed={isFlipped}
          onClick={(event) => {
            event.stopPropagation();
            setFlipped((value) => !value);
          }}
        >
          {isFlipped ? (hintWhenFlipped ?? 'Tap to flip back') : hint}
        </button>
      ) : null}
      <div
        className={cn(
          'cc-flip-card__scene relative w-full min-w-0 [perspective:2000px]',
          sceneClassName,
        )}
        onClick={onSceneClick}
      >
        <div
          className={cn(
            'cc-flip-card__rotator relative h-full w-full [transform-style:preserve-3d]',
            'transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
            isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]',
          )}
        >
          <div className="cc-flip-card__face cc-flip-card__face--front relative">{front}</div>
          <div className="cc-flip-card__face cc-flip-card__face--back absolute inset-0 overflow-auto">
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CardFlipProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  color?: string;
}

const FEATURE_ICONS = [Copy, Code2, Rocket, Zap] as const;

/** Stock flip-card face pair from the design kit. Prefer FlipCard for product UI. */
export default function CardFlip({
  title = 'Build MVPs Fast',
  subtitle = 'Launch your idea in record time',
  description =
    'Copy, paste, customize—and launch your MVP faster than ever with our developer-first component library.',
  features = [
    'Copy & Paste Ready',
    'Developer-First',
    'MVP Optimized',
    'Zero Setup Required',
  ],
  color = '#ff2e88',
}: CardFlipProps) {
  return (
    <FlipCard
      className="mx-auto max-w-[300px]"
      front={
        <div
          style={{ ['--primary' as string]: color }}
          className="flex h-[360px] flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-lg dark:border-zinc-800/50 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-800"
        >
          <div className="mb-8 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] shadow-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{subtitle}</p>
          <Zap className="mt-3 h-5 w-5 text-[var(--primary)]" />
        </div>
      }
      back={
        <div
          style={{ ['--primary' as string]: color }}
          className="flex h-[360px] flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-800"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          <ul className="mt-4 space-y-2.5">
            {features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]">
                    <Icon className="h-3 w-3 text-[var(--primary)]" />
                  </span>
                  <span className="font-medium">{feature}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4 dark:border-zinc-800">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Start building
            </span>
            <ArrowRight className="h-4 w-4 text-[var(--primary)]" />
          </div>
        </div>
      }
    />
  );
}

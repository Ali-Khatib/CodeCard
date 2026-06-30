'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

export type BounceCardItem = {
  image?: string;
  content?: ReactNode;
  ariaLabel?: string;
};

interface BounceCardsProps {
  className?: string;
  images?: string[];
  items?: BounceCardItem[];
  orientation?: 'horizontal' | 'vertical';
  containerWidth?: number;
  containerHeight?: number;
  cardWidth?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
  hoverPushAmount?: number;
  onImageClick?: (index: number, src: string) => void;
  /** Lift + zoom card, then fire callback (e.g. navigate) */
  onCardSelect?: (index: number) => void;
  /** Pull card out and keep it — click again to put back */
  pickOnClick?: boolean;
  /** lift = pull card up (default). in-place = highlight in the fan without moving off-screen */
  pickBehavior?: 'lift' | 'in-place';
  selectedIndex?: number | null;
  onSelectedIndexChange?: (index: number | null) => void;
  showPickDim?: boolean;
  /** When false, cards render immediately without scale/opacity entrance (avoids scroll glitches). */
  enableEntranceAnimation?: boolean;
}

function defaultTransforms(count: number, orientation: 'horizontal' | 'vertical', gap: number): string[] {
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => {
    const offset = (i - mid) * gap;
    const rot = (i - mid) * (orientation === 'vertical' ? 1.5 : 5);
    if (orientation === 'vertical') {
      return `rotate(${rot}deg) translateY(${offset}px)`;
    }
    return `rotate(${rot}deg) translateX(${offset}px)`;
  });
}

function stripRotation(transformStr: string): string {
  if (/rotate\([\s\S]*?\)/.test(transformStr)) {
    return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
  }
  return transformStr === 'none' ? 'rotate(0deg)' : `${transformStr} rotate(0deg)`;
}

function pushTransform(
  baseTransform: string,
  offset: number,
  axis: 'x' | 'y',
): string {
  const regex = axis === 'x' ? /translateX\(([-0-9.]+)px\)/ : /translateY\(([-0-9.]+)px\)/;
  const legacy = axis === 'x' ? /translate\(([-0-9.]+)px\)/ : /translate\([^,]+,\s*([-0-9.]+)px\)/;
  const match = baseTransform.match(regex) ?? baseTransform.match(legacy);
  if (match) {
    const current = parseFloat(match[1]);
    if (axis === 'x') {
      return baseTransform.replace(regex, `translateX(${current + offset}px)`).replace(legacy, `translateX(${current + offset}px)`);
    }
    return baseTransform.replace(regex, `translateY(${current + offset}px)`);
  }
  const prop = axis === 'x' ? `translateX(${offset}px)` : `translateY(${offset}px)`;
  return baseTransform === 'none' ? prop : `${baseTransform} ${prop}`;
}

export default function BounceCards({
  className = '',
  images = [],
  items,
  orientation = 'horizontal',
  containerWidth = 400,
  containerHeight = 400,
  cardWidth = 200,
  animationDelay = 0.15,
  animationStagger = 0.06,
  easeType = 'back.out(1.4)',
  transformStyles,
  enableHover = true,
  hoverPushAmount,
  onImageClick,
  onCardSelect,
  pickOnClick = false,
  pickBehavior = 'lift',
  selectedIndex = null,
  onSelectedIndexChange,
  showPickDim = true,
  enableEntranceAnimation = true,
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);
  const pickingRef = useRef(false);
  const pickedIndexRef = useRef<number | null>(null);

  const cards: BounceCardItem[] =
    items ??
    images.map((src) => ({
      image: src,
    }));

  const gap = orientation === 'vertical' ? 88 : 70;
  const styles =
    transformStyles ?? defaultTransforms(cards.length, orientation, gap);

  const isInteractive = Boolean(onCardSelect || onImageClick || pickOnClick);

  useEffect(() => {
    if (!enableEntranceAnimation) {
      playedRef.current = true;
      return;
    }
    const el = containerRef.current;
    if (!el || playedRef.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || playedRef.current) return;
        playedRef.current = true;
        const ctx = gsap.context(() => {
          gsap.fromTo(
            '.bounce-card',
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              stagger: animationStagger,
              ease: easeType,
              delay: animationDelay,
            },
          );
        }, containerRef);
        io.disconnect();
        return () => ctx.revert();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animationDelay, animationStagger, easeType, cards.length, enableEntranceAnimation]);

  const pushSiblings = (hoveredIdx: number) => {
    const q = gsap.utils.selector(containerRef);
    if (!enableHover || !containerRef.current || pickingRef.current) return;
    const pushAmount = hoverPushAmount ?? (orientation === 'vertical' ? 72 : 120);
    cards.forEach((_, i) => {
      const selector = q(`.bounce-card-${i}`);
      gsap.killTweensOf(selector);
      const baseTransform = styles[i] || 'none';
      if (i === hoveredIdx) {
        gsap.to(selector, {
          transform: stripRotation(baseTransform),
          duration: 0.35,
          ease: 'back.out(1.2)',
          overwrite: 'auto',
        });
      } else {
        const offset = i < hoveredIdx ? -pushAmount : pushAmount;
        gsap.to(selector, {
          transform: pushTransform(baseTransform, offset, orientation === 'vertical' ? 'y' : 'x'),
          duration: 0.35,
          ease: 'back.out(1.2)',
          delay: Math.abs(hoveredIdx - i) * 0.04,
          overwrite: 'auto',
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current || pickingRef.current) return;
    const q = gsap.utils.selector(containerRef);
    cards.forEach((_, i) => {
      const selector = q(`.bounce-card-${i}`);
      gsap.killTweensOf(selector);
      gsap.to(selector, {
        transform: styles[i] || 'none',
        duration: 0.35,
        ease: 'back.out(1.2)',
        overwrite: 'auto',
      });
    });
  };

  const unpickCard = useCallback(() => {
    const q = gsap.utils.selector(containerRef);
    if (!containerRef.current) return;

    pickingRef.current = false;
    pickedIndexRef.current = null;

    if (dimRef.current) {
      gsap.to(dimRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    }

    cards.forEach((_, i) => {
      const selector = q(`.bounce-card-${i}`);
      gsap.killTweensOf(selector);
      gsap.to(selector, {
        transform: styles[i] || 'none',
        opacity: 1,
        scale: 1,
        zIndex: i,
        boxShadow: 'none',
        duration: 0.5,
        ease: 'back.out(1.1)',
        overwrite: 'auto',
      });
    });
  }, [cards, styles]);

  const pickCard = useCallback(
    (idx: number, onComplete?: () => void) => {
      const q = gsap.utils.selector(containerRef);
      if (!containerRef.current) return;

      pickingRef.current = true;
      pickedIndexRef.current = idx;

      if (pickBehavior === 'in-place') {
        cards.forEach((_, i) => {
          const selector = q(`.bounce-card-${i}`);
          gsap.killTweensOf(selector);
          const baseTransform = styles[i] || 'none';
          const isSelected = i === idx;

          gsap.to(selector, {
            transform: stripRotation(baseTransform),
            scale: isSelected ? 1.05 : 0.94,
            opacity: isSelected ? 1 : 0.42,
            zIndex: isSelected ? 30 : i,
            boxShadow: isSelected
              ? '0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(139, 92, 246, 0.35)'
              : 'none',
            duration: 0.42,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        });

        if (onComplete) {
          window.setTimeout(onComplete, pickOnClick ? 0 : 420);
        }
        return;
      }

      const lift = orientation === 'vertical' ? -160 : -200;

      if (showPickDim && dimRef.current) {
        gsap.fromTo(dimRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      }

      cards.forEach((_, i) => {
        const selector = q(`.bounce-card-${i}`);
        gsap.killTweensOf(selector);

        if (i === idx) {
          gsap.to(selector, {
            transform: `translate3d(0px, ${lift}px, 0px) rotate(0deg) scale(1.2)`,
            zIndex: 80,
            boxShadow: '0 48px 96px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(139, 92, 246, 0.35)',
            duration: 0.72,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        } else {
          gsap.to(selector, {
            transform: styles[i] || 'none',
            opacity: 0.15,
            scale: 0.9,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      });

      if (onComplete) {
        window.setTimeout(onComplete, pickOnClick ? 0 : 720);
      }
    },
    [cards, orientation, pickBehavior, pickOnClick, showPickDim, styles],
  );

  useEffect(() => {
    if (selectedIndex === null && pickedIndexRef.current !== null) {
      unpickCard();
      return;
    }
    if (selectedIndex !== null && selectedIndex !== pickedIndexRef.current) {
      pickCard(selectedIndex);
    }
  }, [selectedIndex, pickCard, unpickCard]);

  const handleCardActivate = (idx: number) => {
    const card = cards[idx];

    if (pickOnClick) {
      if (pickedIndexRef.current === idx) {
        unpickCard();
        onSelectedIndexChange?.(null);
        return;
      }

      pickCard(idx, () => onSelectedIndexChange?.(idx));
      return;
    }

    if (pickingRef.current) return;

    const afterPick = () => {
      if (card.image) {
        onImageClick?.(idx, card.image);
      }
      onCardSelect?.(idx);
    };

    if (onCardSelect || onImageClick) {
      pickCard(idx, afterPick);
    }
  };

  if (!cards.length) return null;

  return (
    <div
      className={`cc-bounce-cards-root relative flex items-center justify-center ${className}`}
      ref={containerRef}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {showPickDim && (
        <div
          ref={dimRef}
          className="cc-bounce-cards-dim pointer-events-none absolute inset-0 z-[40] rounded-[inherit] opacity-0"
          aria-hidden
        />
      )}
      {cards.map((card, idx) => {
        const inner = card.content ?? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="h-full w-full object-cover object-top" src={card.image} alt="" />
        );

        const isPicked = pickOnClick && selectedIndex === idx;

        return (
          <div
            key={idx}
            role={isInteractive ? 'button' : 'article'}
            tabIndex={isInteractive ? 0 : undefined}
            aria-pressed={pickOnClick ? isPicked : undefined}
            className={`bounce-card bounce-card-${idx} cc-bounce-card absolute overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-reactor${isInteractive ? ' cursor-pointer' : ''}${isPicked ? ' cc-bounce-card--picked' : ''}`}
            style={{
              width: cardWidth,
              transform: styles[idx] || 'none',
            }}
            onMouseEnter={() => pushSiblings(idx)}
            onMouseLeave={resetSiblings}
            onClick={() => handleCardActivate(idx)}
            onKeyDown={(e) => {
              if (!isInteractive) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardActivate(idx);
              }
            }}
            aria-label={card.ariaLabel ?? (isInteractive ? `Select card ${idx + 1}` : undefined)}
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}

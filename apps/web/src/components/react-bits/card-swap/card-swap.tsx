'use client';

import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useImperativeHandle,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import gsap from 'gsap';

export interface CardSwapHandle {
  /** Animate front card dropping to the back (one step) */
  swap: () => void;
  /** Rotate stack forward by n steps */
  swapSteps: (steps: number) => void;
  /** Jump to a front card without the drop animation */
  goToFront: (frontIndex: number) => void;
}

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  /** Faster 3D motion for scroll-driven swaps */
  motion?: 'timer' | 'scroll';
  /** When set, disables auto-rotate and drives the front card from scroll/step UI */
  activeIndex?: number;
  children: ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, className = '', ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`cc-card-swap__card ${customClass} ${className}`.trim()}
  />
));
Card.displayName = 'Card';

type CardRef = RefObject<HTMLDivElement | null>;

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  });

const orderForFront = (front: number, total: number): number[] =>
  Array.from({ length: total }, (_, i) => (front + i) % total);

const CardSwap = forwardRef<CardSwapHandle, CardSwapProps>(function CardSwap(
  {
    width = 500,
    height = 400,
    cardDistance = 60,
    verticalDistance = 70,
    delay = 5000,
    pauseOnHover = false,
    onCardClick,
    skewAmount = 6,
    easing = 'elastic',
    motion = 'timer',
    activeIndex,
    children,
  },
  ref,
) {
  const isScrollMotion = motion === 'scroll';

  const config = useMemo(
    () => {
      if (isScrollMotion) {
        return {
          ease: 'power3.inOut',
          durDrop: 0.85,
          durMove: 0.75,
          durReturn: 0.9,
          promoteOverlap: 0.82,
          returnDelay: 0.04,
        };
      }
      return easing === 'elastic'
        ? {
            ease: 'elastic.out(0.6,0.9)',
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05,
          }
        : {
            ease: 'power1.inOut',
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2,
          };
    },
    [easing, isScrollMotion],
  );

  const childArr = useMemo(() => Children.toArray(children) as ReactElement<CardProps>[], [children]);
  const refs = useMemo<CardRef[]>(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    [childArr],
  );

  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));
  const activeIndexRef = useRef(activeIndex ?? 0);

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number>(0);
  const container = useRef<HTMLDivElement>(null);
  const swappingRef = useRef(false);
  const queuedSwapsRef = useRef(0);

  const animateToFront = useCallback(
    (frontIndex: number) => {
      const total = refs.length;
      if (total < 1) return;

      const targetOrder = orderForFront(frontIndex, total);
      if (targetOrder[0] === order.current[0] && order.current.length === total) return;

      tlRef.current?.kill();

      const tl = gsap.timeline();
      tlRef.current = tl;

      targetOrder.forEach((cardIdx, stackPos) => {
        const el = refs[cardIdx].current;
        if (!el) return;
        const slot = makeSlot(stackPos, cardDistance, verticalDistance, total);
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            zIndex: slot.zIndex,
            duration: isScrollMotion ? config.durMove * 0.5 : config.durMove * 0.45,
            ease: config.ease,
          },
          stackPos === 0 ? 0 : '<0.12',
        );
      });

      tl.call(() => {
        order.current = targetOrder;
      });
    },
    [cardDistance, verticalDistance, config, isScrollMotion, refs],
  );

  const swap = useCallback(() => {
    if (order.current.length < 2) return;

    const [front, ...rest] = order.current;
    const elFront = refs[front].current;
    if (!elFront) return;

    swappingRef.current = true;
    tlRef.current?.kill();

    const tl = gsap.timeline({
      onComplete: () => {
        swappingRef.current = false;
        if (queuedSwapsRef.current > 0) {
          queuedSwapsRef.current -= 1;
          swap();
        }
      },
    });
    tlRef.current = tl;

    tl.to(elFront, {
      y: '+=500',
      duration: config.durDrop,
      ease: config.ease,
    });

    tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
    rest.forEach((idx, i) => {
      const el = refs[idx].current;
      if (!el) return;
      const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove,
          ease: config.ease,
        },
        `promote+=${i * 0.12}`,
      );
    });

    const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
    tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
    tl.call(
      () => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      },
      undefined,
      'return',
    );
    tl.to(
      elFront,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn,
        ease: config.ease,
      },
      'return',
    );

    tl.call(() => {
      order.current = [...rest, front];
    });
  }, [cardDistance, verticalDistance, config, refs]);

  const queueSwap = useCallback(() => {
    if (swappingRef.current) {
      queuedSwapsRef.current += 1;
      return;
    }
    swap();
  }, [swap]);

  const swapSteps = useCallback(
    (steps: number) => {
      const count = Math.max(0, steps);
      if (count === 0) return;
      queuedSwapsRef.current += count;
      if (!swappingRef.current) {
        queuedSwapsRef.current -= 1;
        swap();
      }
    },
    [swap],
  );

  useImperativeHandle(
    ref,
    () => ({
      swap: queueSwap,
      swapSteps,
      goToFront: animateToFront,
    }),
    [animateToFront, queueSwap, swapSteps],
  );

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });

    if (activeIndex !== undefined) {
      const targetOrder = orderForFront(activeIndex, total);
      targetOrder.forEach((cardIdx, stackPos) => {
        const el = refs[cardIdx].current;
        if (el) placeNow(el, makeSlot(stackPos, cardDistance, verticalDistance, total), skewAmount);
      });
      order.current = targetOrder;
      activeIndexRef.current = activeIndex;
      return;
    }

    if (isScrollMotion) {
      return;
    }

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover) {
      const node = container.current;
      if (!node) return () => clearInterval(intervalRef.current);

      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
      };
    }

    return () => clearInterval(intervalRef.current);
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, refs, swap, activeIndex, isScrollMotion]);

  useEffect(() => {
    if (activeIndex === undefined) return;
    if (activeIndexRef.current === activeIndex) return;
    activeIndexRef.current = activeIndex;
    animateToFront(activeIndex);
  }, [activeIndex, animateToFront]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (e: React.MouseEvent<HTMLDivElement>) => {
            child.props.onClick?.(e);
            onCardClick?.(i);
          },
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child,
  );

  return (
    <div ref={container} className="cc-card-swap" style={{ width, height }}>
      {rendered}
    </div>
  );
});

export default CardSwap;

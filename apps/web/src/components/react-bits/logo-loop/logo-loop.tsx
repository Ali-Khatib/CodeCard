'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

export type LogoLoopItem = {
  node: ReactNode;
  title: string;
  href?: string;
};

export interface LogoLoopProps {
  logos: LogoLoopItem[];
  className?: string;
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  logoHeight?: number;
  gap?: number;
  /** Minimum times to repeat logos; auto-expands to fill container width */
  logoCopies?: number;
  /** Pixels per second while hovered; 0 keeps full speed on hover */
  hoverSpeed?: number;
  pauseOnHover?: boolean;
  scaleOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  ariaLabel?: string;
}

function isVertical(direction: LogoLoopProps['direction']) {
  return direction === 'up' || direction === 'down';
}

export default function LogoLoop({
  logos,
  className = '',
  speed = 100,
  direction = 'left',
  logoHeight = 48,
  gap = 48,
  logoCopies = 2,
  hoverSpeed = 0,
  pauseOnHover,
  scaleOnHover = false,
  fadeOut = false,
  fadeOutColor = '#0a0a13',
  ariaLabel = 'Technology logos',
}: LogoLoopProps) {
  const loopRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(40);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [repeatSets, setRepeatSets] = useState(Math.max(2, logoCopies));

  const vertical = isVertical(direction);
  const shouldPauseOnHover = pauseOnHover ?? false;
  const isPaused = hovering && shouldPauseOnHover;
  const activeSpeed = hovering && hoverSpeed > 0 ? hoverSpeed : speed;

  const expandedLogos = useMemo(() => {
    const copies = Math.max(1, repeatSets);
    return Array.from({ length: copies }, () => logos).flat();
  }, [repeatSets, logos]);

  const measure = useCallback(() => {
    const seq = seqRef.current;
    if (!seq) return;
    const size = vertical ? seq.offsetHeight : seq.offsetWidth;
    if (size <= 0) return;
    const pxPerSec = Math.abs(activeSpeed) || 1;
    setDuration(size / pxPerSec);
  }, [activeSpeed, vertical]);

  const ensureFill = useCallback(() => {
    const loop = loopRef.current;
    const seq = seqRef.current;
    if (!loop || !seq || logos.length === 0) return;

    const containerSize = vertical ? loop.offsetHeight : loop.offsetWidth;
    const sequenceSize = vertical ? seq.offsetHeight : seq.offsetWidth;
    if (containerSize <= 0 || sequenceSize <= 0) return;

    const minSequenceSize = containerSize * 1.35;
    const oneSetSize = sequenceSize / Math.max(1, repeatSets);
    if (oneSetSize <= 0) return;

    const neededSets = Math.max(
      Math.max(2, logoCopies),
      Math.ceil(minSequenceSize / oneSetSize),
    );

    if (neededSets > repeatSets) {
      setRepeatSets(neededSets);
      return;
    }

    measure();
  }, [logoCopies, logos.length, measure, repeatSets, vertical]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    ensureFill();
  }, [ensureFill, expandedLogos.length, logoHeight, gap]);

  useEffect(() => {
    const loop = loopRef.current;
    const seq = seqRef.current;
    if (!loop || !seq || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => ensureFill());
    ro.observe(loop);
    ro.observe(seq);
    return () => ro.disconnect();
  }, [ensureFill]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const fonts = document.fonts;
    if (!fonts?.ready) return;
    fonts.ready.then(() => ensureFill()).catch(() => undefined);
  }, [ensureFill]);

  const animationName = vertical ? 'cc-logo-loop-scroll-y' : 'cc-logo-loop-scroll-x';
  const reverse =
    direction === 'right' || direction === 'up' ? 'reverse' : 'normal';

  const trackStyle = {
    '--cc-logo-loop-gap': `${gap}px`,
    '--cc-logo-loop-height': `${logoHeight}px`,
    '--cc-logo-loop-fade': fadeOutColor,
    animationName: reducedMotion ? 'none' : animationName,
    animationDuration: `${duration}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationDirection: reverse,
    animationPlayState: isPaused || reducedMotion ? 'paused' : 'running',
  } as CSSProperties;

  const renderLogo = (logo: LogoLoopItem, key: string) => {
    const inner = (
      <span
        className={`cc-logo-loop__logo${scaleOnHover ? ' cc-logo-loop__logo--scale' : ''}`}
        style={{ height: logoHeight }}
        title={logo.title}
      >
        {logo.node}
      </span>
    );

    if (logo.href) {
      return (
        <a
          key={key}
          className="cc-logo-loop__item"
          href={logo.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={logo.title}
        >
          {inner}
        </a>
      );
    }

    return (
      <span key={key} className="cc-logo-loop__item" aria-label={logo.title}>
        {inner}
      </span>
    );
  };

  const sequence = expandedLogos.map((logo, i) => renderLogo(logo, `logo-${i}`));

  if (!expandedLogos.length) return null;

  return (
    <div
      ref={loopRef}
      className={`cc-logo-loop${fadeOut ? ' cc-logo-loop--fade' : ''}${vertical ? ' cc-logo-loop--vertical' : ''} ${className}`}
      aria-label={ariaLabel}
      role="region"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={() => setHovering(false)}
    >
      <div ref={trackRef} className="cc-logo-loop__track" style={trackStyle}>
        <div ref={seqRef} className="cc-logo-loop__sequence" aria-hidden={false}>
          {sequence}
        </div>
        <div className="cc-logo-loop__sequence" aria-hidden>
          {sequence}
        </div>
      </div>
    </div>
  );
}

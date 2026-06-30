'use client';

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

export interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  edgeSensitivity?: number;
  /** RGB channels space-separated, e.g. "139 92 246" */
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
}

export default function BorderGlow({
  children,
  className = '',
  innerClassName = '',
  edgeSensitivity = 30,
  glowColor = '139 92 246',
  backgroundColor = '#08080c',
  borderRadius = 12,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ['#8b5cf6', '#c084fc', '#a78bfa'],
}: BorderGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);
  const [angle, setAngle] = useState(0);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dist = Math.min(x, y, rect.width - x, rect.height - y);
      const nearEdge = dist < edgeSensitivity;
      const t = nearEdge ? 1 - dist / edgeSensitivity : 0;
      setOpacity(t * glowIntensity);
      setGlowX((x / rect.width) * 100);
      setGlowY((y / rect.height) * 100);
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      setAngle((Math.atan2(y - cy, x - cx) * 180) / Math.PI);
    },
    [edgeSensitivity, glowIntensity],
  );

  const onPointerLeave = useCallback(() => {
    setOpacity(0);
  }, []);

  const style = {
    '--border-glow-bg': backgroundColor,
    '--border-glow-radius': `${borderRadius}px`,
    '--border-glow-x': `${glowX}%`,
    '--border-glow-y': `${glowY}%`,
    '--border-glow-opacity': opacity,
    '--border-glow-radius-size': `${glowRadius}px`,
    '--border-glow-spread': `${coneSpread}deg`,
    '--border-glow-angle': `${angle}deg`,
    '--border-glow-rgb': glowColor,
    '--border-glow-c1': colors[0] ?? '#8b5cf6',
    '--border-glow-c2': colors[1] ?? colors[0] ?? '#c084fc',
    '--border-glow-c3': colors[2] ?? colors[0] ?? '#a78bfa',
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`cc-border-glow ${animated ? 'cc-border-glow--animated' : ''} ${className}`}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className={`cc-border-glow__sheen`} aria-hidden />
      <div className={`cc-border-glow__inner ${innerClassName}`}>{children}</div>
    </div>
  );
}

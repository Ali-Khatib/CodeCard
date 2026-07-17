'use client';

import createGlobe from 'cobe';
import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export interface GlobeBarMarker {
  id: string;
  location: [number, number];
  value: number;
  barValue?: number;
  label: string;
}

interface GlobeBarsProps {
  markers?: GlobeBarMarker[];
  className?: string;
  speed?: number;
  activeMarkerId?: string | null;
}

type AnchorStyle = CSSProperties & {
  positionAnchor: string;
  '--value': string;
};

const defaultMarkers: GlobeBarMarker[] = [
  { id: 'bar-nyc', location: [40.71, -74.01], value: 85, barValue: 85, label: 'NYC' },
  { id: 'bar-london', location: [51.51, -0.13], value: 62, barValue: 62, label: 'London' },
  { id: 'bar-tokyo', location: [35.68, 139.65], value: 94, barValue: 94, label: 'Tokyo' },
  { id: 'bar-singapore', location: [1.35, 103.82], value: 78, barValue: 78, label: 'Singapore' },
];

export function GlobeBars({
  markers = defaultMarkers,
  className = '',
  speed = 0.003,
  activeMarkerId = null,
}: GlobeBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const currentPhiRef = useRef(0);
  const currentThetaRef = useRef(0.2);
  const targetPhiRef = useRef<number | null>(null);
  const targetThetaRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = { x: event.clientX, y: event.clientY };
    targetPhiRef.current = null;
    targetThetaRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = 'grabbing';
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current) {
      currentPhiRef.current += dragOffset.current.phi;
      currentThetaRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerInteracting.current) return;
      dragOffset.current = {
        phi: (event.clientX - pointerInteracting.current.x) / 300,
        theta: (event.clientY - pointerInteracting.current.y) / 1000,
      };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    const activeMarker = markers.find((marker) => marker.id === activeMarkerId);
    if (!activeMarker) {
      targetPhiRef.current = null;
      targetThetaRef.current = null;
      return;
    }

    const [latitude, longitude] = activeMarker.location;
    targetPhiRef.current =
      Math.PI - ((longitude * Math.PI) / 180 - Math.PI / 2);
    targetThetaRef.current = Math.max(-0.75, Math.min(0.75, (latitude * Math.PI) / 180));
  }, [activeMarkerId, markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let size = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const animate = () => {
      if (!globe) return;
      if (
        targetPhiRef.current !== null &&
        targetThetaRef.current !== null &&
        !pointerInteracting.current
      ) {
        const phiDelta = Math.atan2(
          Math.sin(targetPhiRef.current - currentPhiRef.current),
          Math.cos(targetPhiRef.current - currentPhiRef.current),
        );
        currentPhiRef.current += phiDelta * 0.08;
        currentThetaRef.current += (targetThetaRef.current - currentThetaRef.current) * 0.08;
      } else if (!isPausedRef.current && !reducedMotion) {
        currentPhiRef.current += speed;
      }
      globe.update({
        phi: currentPhiRef.current + dragOffset.current.phi,
        theta: currentThetaRef.current + dragOffset.current.theta,
      });
      animationId = window.requestAnimationFrame(animate);
    };

    const initialize = (nextSize: number) => {
      if (globe || nextSize <= 0) return;
      size = nextSize;
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: Math.round(size * dpr),
        height: Math.round(size * dpr),
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 8,
        baseColor: [0.96, 0.94, 0.9],
        markerColor: [0.75, 0.58, 0.89],
        glowColor: [0.98, 0.96, 0.92],
        markerElevation: 0.02,
        markers: markers.map((marker) => ({
          location: marker.location,
          size: 0.035,
          id: marker.id,
        })),
        arcs: [],
        arcColor: [0.75, 0.58, 0.89],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.82,
      });
      canvas.style.opacity = '1';
      animate();
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextSize = Math.round(entry?.contentRect.width ?? 0);
      if (nextSize <= 0) return;
      if (!globe) {
        initialize(nextSize);
        return;
      }
      if (nextSize !== size) {
        size = nextSize;
        globe.update({
          width: Math.round(size * dpr),
          height: Math.round(size * dpr),
        });
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationId);
      globe?.destroy();
    };
  }, [markers, reducedMotion, speed]);

  return (
    <div
      className={`relative aspect-square select-none ${className}`}
      role="img"
      aria-label={`Interactive globe showing visits from ${markers.map((marker) => marker.label).join(', ')}`}
    >
      <style>{`
        @keyframes cc-globe-bar-fill {
          from { width: 0; }
          to { width: var(--value, 0%); }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="h-full w-full touch-none rounded-full opacity-0 transition-opacity duration-1000"
        style={{ cursor: 'grab' }}
        aria-hidden="true"
      />
      {markers.map((marker) => {
        const active = marker.id === activeMarkerId;
        const barValue = marker.barValue ?? marker.value;
        return (
          <div
            key={marker.id}
            className={`pointer-events-none absolute flex min-w-[60px] -translate-x-1/2 flex-col items-center gap-1 rounded-md border bg-[var(--app-paper)] px-2 py-1.5 transition-[opacity,filter,margin,scale,box-shadow,border-color] duration-300 ${
              active
                ? 'border-[var(--app-iris)] shadow-[0_10px_28px_rgba(126,87,194,0.28)]'
                : 'border-[var(--app-border-strong)] shadow-[0_2px_10px_rgba(34,34,34,0.12)]'
            }`}
            style={
              {
                positionAnchor: `--cobe-${marker.id}`,
                bottom: 'anchor(top)',
                left: 'anchor(center)',
                marginBottom: active ? 38 : 8,
                scale: active ? '1.12' : '1',
                zIndex: active ? 20 : 1,
                opacity:
                  activeMarkerId && !active
                    ? `calc(var(--cobe-visible-${marker.id}, 0) * 0.28)`
                    : `var(--cobe-visible-${marker.id}, 0)`,
                filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 8px))`,
                '--value': `${barValue}%`,
              } as AnchorStyle
            }
          >
            <span className="font-eyebrow text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--app-smoke)]">
              {marker.label}
            </span>
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-bone)]">
              <span
                className="block h-full rounded-full bg-[var(--app-iris)] motion-safe:animate-[cc-globe-bar-fill_1s_ease-out_forwards]"
                style={{ width: `${barValue}%` }}
              />
            </span>
            <span className="font-eyebrow text-[11px] font-semibold tabular-nums text-[var(--app-ink)]">
              {marker.value.toLocaleString()} visitors
            </span>
          </div>
        );
      })}
    </div>
  );
}

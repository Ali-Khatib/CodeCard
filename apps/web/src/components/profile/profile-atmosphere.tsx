'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const DarkVeil = dynamic(() => import('@/components/react-bits/dark-veil/dark-veil'), {
  ssr: false,
  loading: () => null,
});

interface ProfileAtmosphereProps {
  accentColor: string;
  dimmed?: boolean;
  children: React.ReactNode;
}

export function ProfileAtmosphere({ accentColor, dimmed = false, children }: ProfileAtmosphereProps) {
  const reducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const hue = accentToHue(accentColor);

  return (
    <div className="relative min-h-[100dvh] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {reducedMotion ? (
          <div
            className="h-full w-full"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 30% 20%, ${accentColor}12 0%, transparent 55%),
                radial-gradient(ellipse 70% 50% at 75% 80%, #a1a1aa08 0%, transparent 50%),
                linear-gradient(165deg, #0a0a0a 0%, #050505 45%, #080808 100%)
              `,
            }}
          />
        ) : (
          mounted && (
            <DarkVeil
              hueShift={hue}
              noiseIntensity={0.025}
              scanlineIntensity={0.035}
              speed={0.32}
              warpAmount={0.28}
              intensity={dimmed ? 0.45 : 1}
              paused={hidden}
              pointerStrength={0.5}
              className="opacity-90"
            />
          )
        )}
        <div className="absolute inset-0 bg-[#050505]/55 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/30 via-transparent to-[#050505]/80" />
      </div>

      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

function accentToHue(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let hue = 0;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return Math.round(hue * 60);
}

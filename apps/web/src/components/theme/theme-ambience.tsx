'use client';

import { useCodecardTheme } from '@/components/theme/theme-provider';

function FaintCornerBoltSvg() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M20 3 17 14h4L14 29l10-16h-4L22 3h-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ThemeAmbience() {
  const { themeId } = useCodecardTheme();
  if (themeId !== 'neon-grid') return null;

  return (
    <div className="cc-cyber-ambience pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="cc-cyber-lightning-flash" />
      <div className="cc-cyber-spark cc-cyber-spark--tr">
        <FaintCornerBoltSvg />
      </div>
      <div className="cc-cyber-spark cc-cyber-spark--bl">
        <FaintCornerBoltSvg />
      </div>
    </div>
  );
}

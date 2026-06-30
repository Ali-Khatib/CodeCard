'use client';

import dynamic from 'next/dynamic';
import { CARD_BORDER_GLOW } from '@/lib/design/border-glow-preset';

const BorderGlow = dynamic(() => import('@/components/react-bits/border-glow/border-glow'), {
  ssr: false,
});

interface BorderGlowCardProps {
  children: React.ReactNode;
  className?: string;
}

export function BorderGlowCard({ children, className = '' }: BorderGlowCardProps) {
  return (
    <BorderGlow {...CARD_BORDER_GLOW} className={`cc-feature-column ${className}`}>
      {children}
    </BorderGlow>
  );
}

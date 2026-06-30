import type { BorderGlowProps } from '@/components/react-bits/border-glow/border-glow';

/** Shared purple edge-glow preset for marketing cards */
export const CARD_BORDER_GLOW: Pick<
  BorderGlowProps,
  | 'edgeSensitivity'
  | 'glowColor'
  | 'backgroundColor'
  | 'borderRadius'
  | 'glowRadius'
  | 'glowIntensity'
  | 'coneSpread'
  | 'animated'
  | 'colors'
> = {
  edgeSensitivity: 36,
  glowColor: '139 92 246',
  backgroundColor: '#08080c',
  borderRadius: 12,
  glowRadius: 48,
  glowIntensity: 1,
  coneSpread: 25,
  animated: false,
  colors: ['#8b5cf6', '#c084fc', '#38bdf8'],
};

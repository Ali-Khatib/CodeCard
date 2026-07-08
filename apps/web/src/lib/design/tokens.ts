/** @deprecated Prefer `@/lib/design/hume-tokens` for marketing palette */
import { HUME_COLORS, HUME_GRADIENTS, HUME_RADIUS, HUME_SPACING } from './hume-tokens';

/** CodeCard — Hume AI sampled palette */
export const COLORS = {
  obsidian: HUME_COLORS.ink,
  pitch: '#000000',
  void: HUME_COLORS.cream,
  graphite: HUME_COLORS.paper,
  charcoal: HUME_COLORS.cream,
  vellum: HUME_COLORS.ink,
  smoke: HUME_COLORS.muted,
  ash: HUME_COLORS.muted,
  iris: HUME_COLORS.iris,
  twilight: '#574853',
  specter: '#f7bbe6',
  reactor: HUME_COLORS.iris,
  reactorBright: '#f7bbe6',
  lavenderMist: HUME_COLORS.lavenderMist,
  textOnMist: HUME_COLORS.ink,
  bone: HUME_COLORS.cream,
  slateVeil: HUME_COLORS.muted,
  gunmetal: HUME_COLORS.muted,
  midnight: HUME_COLORS.ink,
  deepIndigo: '#574853',
  lilacWhite: HUME_COLORS.paper,
  ashLegacy: HUME_COLORS.muted,
  fog: HUME_COLORS.muted,
  steel: HUME_COLORS.cream,
  lavender: HUME_COLORS.iris,
  accent: HUME_COLORS.iris,
  lavenderWall: HUME_COLORS.iris,
  canvas: HUME_COLORS.cream,
  surface: HUME_COLORS.paper,
  accentGlow: 'rgba(192, 148, 228, 0.18)',
  glowRgb: '192, 148, 228',
  lime: HUME_COLORS.iris,
  blush: '#fce0ee',
  roseMist: '#fdebf7',
  meringue: '#ffe9cf',
  mint: '#daf7ee',
  seafoam: '#cef1e1',
  paper: HUME_COLORS.paper,
  ink: HUME_COLORS.ink,
  page: HUME_COLORS.page,
  chartHume: HUME_COLORS.chartHume,
  chartCompare: HUME_COLORS.chartCompare,
  surfaceDark: HUME_COLORS.surfaceDark,
} as const;

export { HUME_COLORS, HUME_GRADIENTS, HUME_RADIUS, HUME_SPACING };

export const LAYOUT = {
  containerMax: 1280,
  contentMax: 1280,
  containerPadDesktop: 48,
  containerPadMobile: 24,
  navWidth: 1280,
  navHeight: 56,
  navHeightScrolled: 56,
  pillNavTop: 0,
  radiusBtn: 100,
  radiusLink: 8,
  radiusCard: 16,
  radiusBadge: 100,
  radiusNav: 100,
  sectionGap: 80,
} as const;

export const TYPE = {
  mono: 'font-eyebrow text-[12px] font-normal uppercase tracking-[0.06em]',
  body: 'font-sans text-[16px] font-normal leading-[1.45] tracking-[0.16px] md:text-[16px]',
  nav: 'font-sans text-[14px] font-normal',
  sectionHeading:
    'font-display text-[32px] font-normal leading-[1.06] tracking-[-0.03em] md:text-[44px]',
  heroHeading:
    'font-display text-[40px] font-normal leading-[1.02] tracking-[-0.03em] md:text-[56px] lg:text-[72px]',
  profileName:
    'font-display text-[48px] font-normal tracking-[-1.92px] md:text-[56px]',
  profileRole: 'font-sans text-[18px] leading-[1.3] text-smoke',
  projectTitle:
    'font-display text-[36px] font-normal tracking-[-1.33px] md:text-[46px]',
  eyebrow: 'font-eyebrow text-[11px] font-normal uppercase tracking-[0.08em] leading-[0.9] text-smoke',
  subheading: 'font-sans text-[18px] font-normal leading-[1.3] text-smoke',
} as const;

export const MAGIC_BENTO = {
  textAutoHide: false,
  enableSpotlight: true,
  enableBorderGlow: true,
  enableStars: false,
  particleCount: 0,
  spotlightRadius: 360,
  glowColor: COLORS.glowRgb,
  enableTilt: false,
  clickEffect: false,
  enableMagnetism: false,
} as const;

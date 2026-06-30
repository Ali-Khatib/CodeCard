/** CodeCard — Frame.io cinema + Wealthsimple editorial rhythm */
export const COLORS = {
  obsidian: '#0a0a13',
  pitch: '#000000',
  void: '#040407',
  graphite: '#08080c',
  charcoal: '#2a2a32',
  vellum: '#fcfcfc',
  smoke: '#757580',
  ash: '#a3a3b3',
  iris: '#8b5cf6',
  twilight: '#5b4f8c',
  specter: '#c4b5fd',
  reactor: '#8b5cf6',
  reactorBright: '#a78bfa',
  lavenderMist: '#dedfee',
  textOnMist: '#0a0a13',
  bone: '#fcfcfc',
  slateVeil: '#0c1d32',
  gunmetal: '#4f4f80',
  midnight: '#040407',
  deepIndigo: '#181826',
  lilacWhite: '#fcfcfc',
  ashLegacy: '#a3a3b3',
  fog: '#757580',
  steel: '#2a2a32',
  lavender: '#8b5cf6',
  accent: '#8b5cf6',
  lavenderWall: '#8b5cf6',
  canvas: '#0a0a13',
  surface: '#08080c',
  accentGlow: 'rgba(139, 92, 246, 0.4)',
  glowRgb: '139, 92, 246',
  lime: '#8b5cf6',
} as const;

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
  radiusCard: 10,
  radiusBadge: 100,
  radiusNav: 100,
  sectionGap: 80,
} as const;

export const TYPE = {
  mono: 'font-eyebrow text-[12px] font-normal uppercase tracking-[0.06em]',
  body: 'font-sans text-[16px] font-normal leading-[1.45] tracking-[0.16px] md:text-[16px]',
  nav: 'font-sans text-[14px] font-normal',
  sectionHeading:
    'font-display text-[38px] font-normal leading-[1.04] tracking-[-1.33px] md:text-[48px] md:leading-[1.02] md:tracking-[-1.92px]',
  heroHeading:
    'font-display text-[52px] font-normal leading-[1] tracking-[-1.8px] md:text-[68px] md:tracking-[-2.4px] lg:text-[88px] lg:leading-[0.96] lg:tracking-[-3.2px]',
  profileName:
    'font-display text-[48px] font-normal tracking-[-1.92px] md:text-[56px]',
  profileRole: 'font-sans text-[18px] leading-[1.3] text-smoke',
  projectTitle:
    'font-display text-[36px] font-normal tracking-[-1.33px] md:text-[46px]',
  eyebrow: 'font-eyebrow text-[12px] font-normal uppercase tracking-[0.06em] leading-[0.9] text-iris',
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

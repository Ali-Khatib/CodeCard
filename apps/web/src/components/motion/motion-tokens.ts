/**
 * CodeCard motion tokens — shared timing language for GSAP, Motion, and CSS.
 * Ownership: GSAP owns scroll cinema; Motion owns UI state; CSS owns hover/focus/press.
 * Never animate the same property on the same element with two libraries.
 */

export const MOTION_DURATION = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  soft: 0.55,
  section: 0.75,
  route: 0.4,
} as const;

export const MOTION_EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  soft: 'power2.out',
  linear: 'none',
} as const;

export const MOTION_SPRING = {
  /** Motion / Framer Motion spring presets — not for GSAP. */
  snappy: { type: 'spring' as const, stiffness: 420, damping: 32 },
  soft: { type: 'spring' as const, stiffness: 260, damping: 28 },
};

export const MOTION_STAGGER = {
  tight: 0.04,
  base: 0.08,
  loose: 0.12,
} as const;

export const MOTION_SCROLL = {
  scrub: 0.5,
  revealStart: 'top 88%',
} as const;

export const MOTION_LIMITS = {
  parallaxMaxPx: 24,
  cardTiltMaxDeg: 6,
  hoverScaleMax: 1.02,
  pressScale: 0.98,
  revealY: 28,
  blurMaxPx: 8,
  opacityMin: 0,
  opacityMax: 1,
  mobileReduction: 0.6,
} as const;

export const MOTION_OVERLAY = {
  enter: MOTION_DURATION.route,
  exit: MOTION_DURATION.fast,
} as const;

/** Named patterns → owning library (documentation + runtime hints). */
export const MOTION_PATTERNS = {
  'reveal-soft': 'gsap',
  'reveal-mask': 'gsap',
  'reveal-editorial': 'gsap',
  'card-lift': 'css',
  'card-spotlight': 'motion',
  'button-magnetic': 'motion',
  'button-press': 'css',
  'section-enter': 'gsap',
  'section-exit': 'gsap',
  'route-opening': 'motion',
  'metric-count': 'motion',
  'chart-draw': 'gsap',
  'qr-reveal': 'gsap',
  'ambient-shift': 'css',
} as const;

export type MotionPatternName = keyof typeof MOTION_PATTERNS;

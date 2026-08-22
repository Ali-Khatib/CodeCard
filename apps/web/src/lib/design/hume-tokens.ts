/**
 * Hume AI–inspired marketing design tokens (sampled / best-fit reconstruction).
 * Light-primary site shell; dark surfaces reserved for embedded charts/demos only.
 */

export const HUME_COLORS = {
  page: '#FAFAFA',
  cream: '#FCF1E7',
  lavenderMist: '#E8E3F1',
  periwinkle: '#C3C0F2',
  peach: '#FADAC1',
  pink: '#F1C9DD',
  ink: '#232324',
  /** Secondary body text — WCAG AA ≥4.5:1 on cream/white (was #767073). */
  muted: '#5c5856',
  lineSoft: '#C2BCBB',
  paper: '#FFFFFF',
  /** Charts / demo panels only — not site-wide body */
  surfaceDark: '#202020',
  surfaceBlack: '#0F0F11',
  chartHume: '#EDC4F1',
  chartCompare: '#FEE6C5',
  accentOrange: '#E95A0B',
  iris: '#E95A0B',
} as const;

export const HUME_GRADIENTS = {
  warmBrand:
    'linear-gradient(135deg, #F7D5B8 0%, #FEEBE2 32%, #FADAC1 68%, #FFB760 100%)',
  lavenderTitle:
    'linear-gradient(135deg, #F5C9A8 0%, #FCE8D8 55%, #FFE9CF 100%)',
  accentText:
    'linear-gradient(90deg, #E95A0B 0%, #F97316 50%, #FFB760 100%)',
  softBlob:
    'radial-gradient(circle at 30% 30%, rgba(233,90,11,.22), transparent 45%), radial-gradient(circle at 70% 60%, rgba(250,218,193,.40), transparent 40%), radial-gradient(circle at 55% 20%, rgba(255,183,96,.35), transparent 36%)',
} as const;

export const HUME_SPACING = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  24: '96px',
  32: '128px',
} as const;

export const HUME_RADIUS = {
  sm: '12px',
  md: '16px',
  lg: '24px',
  pill: '9999px',
} as const;

/** CSS custom properties for :root / [data-theme='hume'] */
export const HUME_CSS_VARS: Record<string, string> = {
  '--hume-page': HUME_COLORS.page,
  '--hume-cream': HUME_COLORS.cream,
  '--hume-lavender-mist': HUME_COLORS.lavenderMist,
  '--hume-periwinkle': HUME_COLORS.periwinkle,
  '--hume-peach': HUME_COLORS.peach,
  '--hume-pink': HUME_COLORS.pink,
  '--ink': HUME_COLORS.ink,
  '--smoke': HUME_COLORS.muted,
  '--muted': HUME_COLORS.muted,
  '--line-soft': HUME_COLORS.lineSoft,
  '--bone': HUME_COLORS.cream,
  '--paper': HUME_COLORS.paper,
  '--canvas': HUME_COLORS.cream,
  '--background': HUME_COLORS.cream,
  '--void-canvas': HUME_COLORS.cream,
  '--obsidian': HUME_COLORS.cream,
  '--surface-dark': HUME_COLORS.surfaceDark,
  '--chart-hume': HUME_COLORS.chartHume,
  '--chart-compare': HUME_COLORS.chartCompare,
  '--accent-orange': HUME_COLORS.accentOrange,
  '--iris': HUME_COLORS.iris,
  '--accent': HUME_COLORS.iris,
  '--reactor': HUME_COLORS.iris,
  '--vellum': HUME_COLORS.ink,
  '--phosphor': HUME_COLORS.ink,
  '--text-primary': HUME_COLORS.ink,
  '--foreground': HUME_COLORS.ink,
  '--text-secondary': HUME_COLORS.muted,
  '--ash': HUME_COLORS.muted,
  '--lichen': HUME_COLORS.muted,
  '--graphite': HUME_COLORS.muted,
  '--fog': HUME_COLORS.muted,
  '--border': 'rgba(35, 35, 36, 0.08)',
  '--border-subtle': 'rgba(35, 35, 36, 0.05)',
  '--hume-gradient-warm': HUME_GRADIENTS.warmBrand,
  '--hume-gradient-accent': HUME_GRADIENTS.accentText,
  '--hume-gradient-blob': HUME_GRADIENTS.softBlob,
  '--cosmic-base-start': HUME_COLORS.cream,
  '--cosmic-base-mid': HUME_COLORS.page,
  '--cosmic-base-end': HUME_COLORS.cream,
  '--cosmic-glow': 'rgba(233, 90, 11, 0.14)',
  '--cosmic-glow-secondary': 'rgba(255, 183, 96, 0.12)',
  '--accent-rgb': '233, 90, 11',
  '--accent-bright-rgb': '249, 115, 22',
  '--accent-muted-rgb': '245, 168, 120',
  '--accent-secondary-rgb': '255, 183, 96',
};

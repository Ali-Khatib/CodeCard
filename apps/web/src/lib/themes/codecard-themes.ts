export type CodecardThemeId =
  | 'original'
  | 'violet'
  | 'sunset-ember'
  | 'glacier'
  | 'riot-brass'
  | 'neon-grid';

export type ThemeCssVars = Record<string, string>;

export type CodecardTheme = {
  id: CodecardThemeId;
  label: string;
  swatch: string;
  description: string;
  pro?: boolean;
  logo?: 'punk' | 'cyber';
  vars: ThemeCssVars;
};

const DEFAULT_FONTS: ThemeCssVars = {
  '--font-sans': 'var(--font-inter), system-ui, sans-serif',
  '--font-display': 'var(--font-instrument), Georgia, ui-serif, serif',
  '--font-eyebrow': 'var(--font-space-mono), ui-monospace, monospace',
};

const CYBER_FONTS: ThemeCssVars = {
  '--font-sans': 'var(--font-cyber-sans), ui-monospace, monospace',
  '--font-display': 'var(--font-cyber-display), ui-sans-serif, sans-serif',
  '--font-eyebrow': 'var(--font-cyber-sans), ui-monospace, monospace',
};

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = Number.parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  return `rgba(${hexToRgb(hex)}, ${alpha})`;
}

export function rgbCsvToRgba(csv: string, alpha: number): string {
  return `rgba(${csv}, ${alpha})`;
}

function theme(
  id: CodecardThemeId,
  label: string,
  swatch: string,
  description: string,
  colors: {
    obsidian: string;
    surface: string;
    fern: string;
    accent: string;
    accentBright: string;
    accentMuted: string;
    accentSecondary?: string;
    twilight: string;
    bone?: string;
    paper?: string;
    cosmicStart: string;
    cosmicMid: string;
    cosmicEnd: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      faint: string;
    };
  },
  extra?: { pro?: boolean; logo?: 'punk' | 'cyber'; fonts?: ThemeCssVars },
): CodecardTheme {
  const accentRgb = hexToRgb(colors.accent);
  const brightRgb = hexToRgb(colors.accentBright);
  const mutedRgb = hexToRgb(colors.accentMuted);
  const secondaryRgb = colors.accentSecondary
    ? hexToRgb(colors.accentSecondary)
    : brightRgb;

  return {
    id,
    label,
    swatch,
    description,
    pro: extra?.pro,
    logo: extra?.logo,
    vars: {
      ...(extra?.fonts ?? DEFAULT_FONTS),
      '--obsidian': colors.obsidian,
      '--void-canvas': colors.obsidian,
      '--canvas': colors.obsidian,
      '--graphite-surface': colors.surface,
      '--moss': colors.surface,
      '--fern': colors.fern,
      '--deep-indigo': colors.fern,
      '--reactor': colors.accent,
      '--reactor-bright': colors.accentBright,
      '--iris': colors.accent,
      '--accent': colors.accent,
      '--lavender': colors.accent,
      '--lime': colors.accent,
      '--violet': colors.accent,
      '--accent-glow': `rgba(${accentRgb}, 0.4)`,
      '--twilight': colors.twilight,
      '--specter': colors.accentMuted,
      '--lavender-mist': colors.accentMuted,
      '--accent-rgb': accentRgb,
      '--accent-bright-rgb': brightRgb,
      '--accent-muted-rgb': mutedRgb,
      '--accent-secondary-rgb': secondaryRgb,
      '--cosmic-glow': `rgba(${accentRgb}, 0.35)`,
      '--cosmic-glow-secondary': `rgba(${secondaryRgb}, 0.28)`,
      '--cosmic-base-start': colors.cosmicStart,
      '--cosmic-base-mid': colors.cosmicMid,
      '--cosmic-base-end': colors.cosmicEnd,
      '--background': colors.obsidian,
      '--foreground': colors.text.primary,
      '--ink': colors.text.primary,
      '--vellum': colors.text.primary,
      '--phosphor': colors.text.primary,
      '--pearl': colors.paper ?? '#ffffff',
      '--lilac-white': colors.paper ?? '#ffffff',
      '--text-primary': colors.text.primary,
      '--bone': colors.bone ?? colors.obsidian,
      '--paper': colors.paper ?? '#ffffff',
      '--ash': colors.text.secondary,
      '--lichen': colors.text.secondary,
      '--text-secondary': colors.text.secondary,
      '--muted': colors.text.secondary,
      '--lavender-mist-text': colors.text.muted,
      '--graphite': colors.text.faint,
      '--smoke': colors.text.faint,
      '--fog': colors.text.faint,
      '--border': `rgba(${accentRgb}, 0.28)`,
      '--border-subtle': `rgba(${accentRgb}, 0.1)`,
    },
  };
}

export const ORIGINAL_THEME = theme(
  'original',
  'Original',
  '#c094e4',
  'Calm light workspace — bone canvas, ink type, iris accents.',
  {
    obsidian: '#fcf1e7',
    surface: '#ffffff',
    fern: '#fcf1e7',
    bone: '#fcf1e7',
    paper: '#ffffff',
    accent: '#c094e4',
    accentBright: '#f7bbe6',
    accentMuted: '#edc4f1',
    accentSecondary: '#ffb760',
    twilight: '#574853',
    cosmicStart: '#fcf1e7',
    cosmicMid: '#fafafa',
    cosmicEnd: '#fcf1e7',
    text: {
      primary: '#232324',
      secondary: '#767073',
      muted: '#767073',
      faint: '#767073',
    },
  },
);

export const VIOLET_THEME = theme(
  'violet',
  'Classic Violet (legacy)',
  '#8B5CF6',
  'Legacy dark purple theme.',
  {
    obsidian: '#0a0a13',
    surface: '#08080c',
    fern: '#181826',
    accent: '#8b5cf6',
    accentBright: '#a78bfa',
    accentMuted: '#c4b5fd',
    twilight: '#5b4f8c',
    cosmicStart: '#0a0018',
    cosmicMid: '#050010',
    cosmicEnd: '#12082a',
    text: {
      primary: '#fcfcfc',
      secondary: '#c4b5fd',
      muted: '#a3a3b3',
      faint: '#757580',
    },
  },
);

export const SUNSET_EMBER_THEME = theme(
  'sunset-ember',
  'Sunset Ember',
  '#E86A3F',
  'Warm terracotta skies. Cream headlines, peach body copy, ember accents.',
  {
    obsidian: '#1C1412',
    surface: '#1A1513',
    fern: '#221A17',
    accent: '#E86A3F',
    accentBright: '#F19A6B',
    accentMuted: '#F5C4A8',
    twilight: '#8B4A32',
    cosmicStart: '#180E0A',
    cosmicMid: '#100A08',
    cosmicEnd: '#241610',
    text: {
      primary: '#FFF4ED',
      secondary: '#F0C4A8',
      muted: '#D4A088',
      faint: '#9A7B6A',
    },
  },
);

export const GLACIER_THEME = theme(
  'glacier',
  'Glacier',
  '#2DD4BF',
  'Arctic navy canvas. Ice-white titles, sea-glass subtitles, mint glow.',
  {
    obsidian: '#0A1628',
    surface: '#0C1A2E',
    fern: '#0F2038',
    accent: '#2DD4BF',
    accentBright: '#5EEAD4',
    accentMuted: '#A7F3D0',
    twilight: '#1E6B7A',
    cosmicStart: '#061220',
    cosmicMid: '#040C18',
    cosmicEnd: '#0C2840',
    text: {
      primary: '#E8FFFC',
      secondary: '#94E8D8',
      muted: '#6BC4B8',
      faint: '#4A7A8A',
    },
  },
);

export const RIOT_BRASS_THEME = theme(
  'riot-brass',
  'Riot Brass',
  '#FF2D55',
  'Pro punk energy. Hot pink, acid yellow, loud type. Rad as hell.',
  {
    obsidian: '#0A0A0A',
    surface: '#111111',
    fern: '#1A1A1A',
    accent: '#FF2D55',
    accentBright: '#FFE566',
    accentMuted: '#FF8FAB',
    twilight: '#8A2040',
    cosmicStart: '#140008',
    cosmicMid: '#0A0A0A',
    cosmicEnd: '#1A0010',
    text: {
      primary: '#FFF5F7',
      secondary: '#FF8FAB',
      muted: '#FF5C7A',
      faint: '#8A5060',
    },
  },
  { pro: true, logo: 'punk' },
);

export const NEON_GRID_THEME = theme(
  'neon-grid',
  'Neon Grid',
  '#00F0FF',
  'Full cyberpunk. Cyan/magenta neon, scanlines, mono-tech fonts everywhere.',
  {
    obsidian: '#050508',
    surface: '#08081A',
    fern: '#0C0C24',
    accent: '#00F0FF',
    accentBright: '#FF00C8',
    accentMuted: '#67E8F9',
    accentSecondary: '#FF00C8',
    twilight: '#1A1A6E',
    cosmicStart: '#020218',
    cosmicMid: '#050510',
    cosmicEnd: '#0A0030',
    text: {
      primary: '#D4FFFF',
      secondary: '#67E8F9',
      muted: '#22D3EE',
      faint: '#3A6A8A',
    },
  },
  { pro: true, logo: 'cyber', fonts: CYBER_FONTS },
);

export const CODECARD_THEMES: Record<CodecardThemeId, CodecardTheme> = {
  original: ORIGINAL_THEME,
  violet: VIOLET_THEME,
  'sunset-ember': SUNSET_EMBER_THEME,
  glacier: GLACIER_THEME,
  'riot-brass': RIOT_BRASS_THEME,
  'neon-grid': NEON_GRID_THEME,
};

export const PICKER_THEMES: CodecardTheme[] = [ORIGINAL_THEME];

export const THEME_STORAGE_KEY = 'codecard-theme';

/** Default product theme */
export const DEFAULT_THEME_ID: CodecardThemeId = 'original';

const ALL_THEME_VAR_KEYS = [
  ...new Set(
    Object.values(CODECARD_THEMES).flatMap((theme) => Object.keys(theme.vars)),
  ),
];

const LEGACY_THEME_IDS: Record<string, CodecardThemeId> = {
  hume: 'original',
  'noir-gild': 'original',
  violet: 'original',
  'sunset-ember': 'original',
  glacier: 'original',
  'riot-brass': 'original',
  'neon-grid': 'original',
};

export function clearThemeInlineVars(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const key of ALL_THEME_VAR_KEYS) {
    root.style.removeProperty(key);
  }
}

export function getTheme(id: CodecardThemeId): CodecardTheme {
  return CODECARD_THEMES[id] ?? ORIGINAL_THEME;
}

export function applyThemeVars(_themeId: CodecardThemeId = DEFAULT_THEME_ID): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  clearThemeInlineVars();
  root.setAttribute('data-theme', DEFAULT_THEME_ID);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#fcf1e7');
}

export function readStoredTheme(): CodecardThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    return DEFAULT_THEME_ID;
  }

  if (stored in LEGACY_THEME_IDS) {
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    return DEFAULT_THEME_ID;
  }

  if (stored in CODECARD_THEMES) {
    if (stored === DEFAULT_THEME_ID) return DEFAULT_THEME_ID;
    // Migrate any persisted legacy picker theme to Original.
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    return DEFAULT_THEME_ID;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
  return DEFAULT_THEME_ID;
}

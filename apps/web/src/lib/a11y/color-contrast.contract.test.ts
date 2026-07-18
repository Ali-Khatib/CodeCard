import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUME_COLORS } from '@/lib/design/hume-tokens';
import {
  compositeRgbaOverHex,
  contrastRatio,
  meetsContrastAA,
} from './contrast';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

/** Semantic pairs used across marketing, dashboard, auth, and demo. */
const LIGHT_PAIRS: Array<{
  name: string;
  fg: string;
  bg: string;
  largeText?: boolean;
  ui?: boolean;
}> = [
  { name: 'primary ink / bone', fg: '#232324', bg: '#fcf1e7' },
  { name: 'primary ink / paper', fg: '#232324', bg: '#ffffff' },
  { name: 'secondary smoke / bone', fg: HUME_COLORS.muted, bg: '#fcf1e7' },
  { name: 'secondary smoke / paper', fg: HUME_COLORS.muted, bg: '#ffffff' },
  { name: 'placeholder smoke / paper', fg: HUME_COLORS.muted, bg: '#ffffff' },
  { name: 'error text / paper', fg: '#b91c1c', bg: '#ffffff' },
  { name: 'error text / bone', fg: '#b91c1c', bg: '#fcf1e7' },
  { name: 'success text / success bg', fg: '#574853', bg: '#daf7ee' },
  { name: 'success text / paper', fg: '#574853', bg: '#ffffff' },
  { name: 'primary button text / ink', fg: '#ffffff', bg: '#232324' },
  { name: 'link ink / bone', fg: '#232324', bg: '#fcf1e7' },
  { name: 'focus ring ink / bone', fg: '#232324', bg: '#fcf1e7', ui: true },
  { name: 'focus ring ink / paper', fg: '#232324', bg: '#ffffff', ui: true },
  {
    name: 'form border-strong / paper',
    fg: compositeRgbaOverHex(34, 34, 34, 0.52, '#ffffff'),
    bg: '#ffffff',
    ui: true,
  },
  {
    name: 'form border-strong / bone',
    fg: compositeRgbaOverHex(34, 34, 34, 0.52, '#fcf1e7'),
    bg: '#fcf1e7',
    ui: true,
  },
  { name: 'overlay white / black backing', fg: '#ffffff', bg: '#000000' },
];

const DARK_PAIRS: Array<{
  name: string;
  fg: string;
  bg: string;
  ui?: boolean;
}> = [
  { name: 'dark ink / bone', fg: '#efedeb', bg: '#121114' },
  { name: 'dark ink / paper', fg: '#efedeb', bg: '#1a191c' },
  { name: 'dark smoke / bone', fg: '#b5b1b6', bg: '#121114' },
  { name: 'dark smoke / paper', fg: '#b5b1b6', bg: '#1a191c' },
  { name: 'dark focus iris / paper', fg: '#c094e4', bg: '#1a191c', ui: true },
  { name: 'dark error / paper', fg: '#f87171', bg: '#1a191c' },
];

describe('WS12-T005 color contrast', () => {
  it('computes known WCAG sample ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('passes AA for light semantic text and control pairs', () => {
    for (const pair of LIGHT_PAIRS) {
      const ok = meetsContrastAA(pair.fg, pair.bg, {
        largeText: pair.largeText,
        uiComponent: pair.ui,
      });
      expect(ok, `${pair.name} (${contrastRatio(pair.fg, pair.bg).toFixed(2)}:1)`).toBe(
        true,
      );
    }
  });

  it('passes AA for dark semantic pairs', () => {
    for (const pair of DARK_PAIRS) {
      const ok = meetsContrastAA(pair.fg, pair.bg, { uiComponent: pair.ui });
      expect(ok, `${pair.name} (${contrastRatio(pair.fg, pair.bg).toFixed(2)}:1)`).toBe(
        true,
      );
    }
  });

  it('keeps muted token AA on cream and white', () => {
    expect(HUME_COLORS.muted.toLowerCase()).toBe('#5c5856');
    expect(meetsContrastAA(HUME_COLORS.muted, HUME_COLORS.cream)).toBe(true);
    expect(meetsContrastAA(HUME_COLORS.muted, HUME_COLORS.paper)).toBe(true);
  });

  it('wires AA smoke and error tokens into CSS sources', () => {
    const globals = read('app/globals.css');
    const app = read('styles/codecard-app-system.css');
    expect(globals).toContain('--smoke: #5c5856');
    expect(globals).toContain('--text-secondary: #5c5856');
    expect(globals).toContain('--muted-foreground: #5c5856');
    expect(globals).toContain('--error-text: #b91c1c');
    expect(globals).toContain('::placeholder');
    expect(globals).toContain('.cc-media-text-backed');
    expect(globals).toContain('--cc-focus-ring: #232324');
    expect(app).toContain('--app-smoke: #5c5856');
    expect(app).toContain('--app-error: #b91c1c');
    expect(app).toContain('--app-border-strong: rgba(34, 34, 34, 0.52)');
  });

  it('does not rely on color alone for critical admin status copy', () => {
    const dashboard = read('components/admin/moderation-dashboard.tsx');
    const actions = read('components/admin/report-actions.tsx');
    expect(dashboard).toMatch(/Status:|status/i);
    expect(actions).toMatch(/Hide|Suspend|Resolve|Dismiss/);
  });

  it('documents image-overlay text with a guaranteed backing layer utility', () => {
    const globals = read('app/globals.css');
    expect(globals).toMatch(/\.cc-media-text-backed[\s\S]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.55\)/);
    const project = read('components/featured-work/project-detail-view.tsx');
    expect(project).toMatch(/bg-black\/(?:48|55)|rgba\(0,\s*0,\s*0/);
  });
});

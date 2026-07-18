/**
 * WS12-T005 — WCAG relative-luminance / contrast-ratio helpers (test + token audit).
 * Relative luminance per WCAG 2.x relative luminance definition.
 */

export function srgbChannelToLinear(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected #RRGGBB color, received: ${hex}`);
  }
  const value = Number.parseInt(normalized, 16);
  const r = srgbChannelToLinear((value >> 16) & 255);
  const g = srgbChannelToLinear((value >> 8) & 255);
  const b = srgbChannelToLinear(value & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque #RRGGBB colors. */
export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const L1 = relativeLuminance(foregroundHex);
  const L2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastAA(
  foregroundHex: string,
  backgroundHex: string,
  options: { largeText?: boolean; uiComponent?: boolean } = {},
): boolean {
  const ratio = contrastRatio(foregroundHex, backgroundHex);
  if (options.uiComponent || options.largeText) return ratio >= 3;
  return ratio >= 4.5;
}

/** Composite a semi-transparent sRGB color over an opaque background. */
export function compositeRgbaOverHex(
  r: number,
  g: number,
  b: number,
  alpha: number,
  backgroundHex: string,
): string {
  const bg = backgroundHex.replace('#', '');
  const br = Number.parseInt(bg.slice(0, 2), 16);
  const bgG = Number.parseInt(bg.slice(2, 4), 16);
  const bb = Number.parseInt(bg.slice(4, 6), 16);
  const cr = Math.round(r * alpha + br * (1 - alpha));
  const cg = Math.round(g * alpha + bgG * (1 - alpha));
  const cb = Math.round(b * alpha + bb * (1 - alpha));
  return `#${[cr, cg, cb].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

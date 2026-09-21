/**
 * Landing fixed chrome (CC mark + nav pill) ink.
 * `dark` = black ink on light/cream surfaces
 * `light` = cream/white ink on dark cinema surfaces
 *
 * Logo and nav are sampled independently so each stays readable on the mesh.
 */

export type LandingChromeInk = 'light' | 'dark';

const SAMPLE_Y_FALLBACK = 36;
const LUMA_LIGHT_BG = 0.58;
const LUMA_DARK_BG = 0.42;

let lastLogoInk: LandingChromeInk | null = null;
let lastNavInk: LandingChromeInk | null = null;

function navToneForInk(ink: LandingChromeInk): 'light' | 'dark' {
  /* navTone names the surface: cream surface → light, dark cinema → dark */
  return ink === 'dark' ? 'light' : 'dark';
}

export function applyLogoInk(ink: LandingChromeInk): void {
  const html = document.documentElement;
  if (html.dataset.logoTone === ink) return;
  html.dataset.logoTone = ink;
  lastLogoInk = ink;
}

export function applyNavInk(ink: LandingChromeInk): void {
  const html = document.documentElement;
  const nextNav = navToneForInk(ink);
  if (html.dataset.navTone === nextNav) return;
  html.dataset.navTone = nextNav;
  lastNavInk = ink;
}

/** Apply logo + nav together. Used for chapter/footer fallbacks. */
export function applyLandingChromeInk(ink: LandingChromeInk): void {
  applyLogoInk(ink);
  applyNavInk(ink);
}

function tokenToPx(token: string, axisSize: number): number {
  const n = parseFloat(token);
  if (Number.isNaN(n)) return 0;
  if (token.endsWith('%')) return (n / 100) * axisSize;
  return n;
}

function parseRoundRadius(clipPath: string, box: { width: number; height: number }): number {
  const roundMatch = clipPath.match(/round\s+([^)]+?)\s*\)?\s*$/i);
  if (!roundMatch) return 0;
  const first = roundMatch[1].trim().split(/\s+/)[0];
  if (!first) return 0;
  return tokenToPx(first, Math.min(box.width, box.height));
}

/** Point-in-rounded-rect (CSS border-radius style). */
function pointInRoundedRect(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
): boolean {
  if (x < left || x > right || y < top || y > bottom) return false;
  const r = Math.max(
    0,
    Math.min(radius, (right - left) / 2, (bottom - top) / 2),
  );
  if (r <= 0) return true;

  const inLeft = x < left + r;
  const inRight = x > right - r;
  const inTop = y < top + r;
  const inBottom = y > bottom - r;
  if (!(inLeft || inRight) || !(inTop || inBottom)) return true;

  const cx = inLeft ? left + r : right - r;
  const cy = inTop ? top + r : bottom - r;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Parse CSS `inset(...)` against a box. Returns null if unparseable. */
export function parseClipInset(
  clipPath: string,
  box: { width: number; height: number },
): { top: number; right: number; bottom: number; left: number; radius: number } | null {
  if (!clipPath || clipPath === 'none') {
    return { top: 0, right: 0, bottom: 0, left: 0, radius: 0 };
  }
  const match = clipPath.match(/inset\(\s*([^)]+?)\s*(?:round|$)/i);
  if (!match) return null;
  const raw = match[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (raw.length === 0) return { top: 0, right: 0, bottom: 0, left: 0, radius: parseRoundRadius(clipPath, box) };

  const v = (t: string) => tokenToPx(t, box.height);
  const h = (t: string) => tokenToPx(t, box.width);
  const radius = parseRoundRadius(clipPath, box);

  if (raw.length === 1) {
    const a = v(raw[0]);
    const b = h(raw[0]);
    return { top: a, right: b, bottom: a, left: b, radius };
  }
  if (raw.length === 2) {
    return { top: v(raw[0]), right: h(raw[1]), bottom: v(raw[0]), left: h(raw[1]), radius };
  }
  if (raw.length === 3) {
    return { top: v(raw[0]), right: h(raw[1]), bottom: v(raw[2]), left: h(raw[1]), radius };
  }
  return {
    top: v(raw[0]),
    right: h(raw[1]),
    bottom: v(raw[2]),
    left: h(raw[3]),
    radius,
  };
}

function logoEl() {
  return document.querySelector<HTMLElement>(
    '.cc-marketing-shell:has(.cc-ed) .cc-ed-mark-logo:not(.cc-auth-mark)',
  );
}

function navEl() {
  return document.querySelector<HTMLElement>(
    '.cc-marketing-shell:has(.cc-ed) .cc-nav-veil',
  );
}

function centerOf(el: HTMLElement | null, fallback: { x: number; y: number }) {
  if (!el) return fallback;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return fallback;
  return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.45 };
}

function inkFromLuma(luma: number, previous: LandingChromeInk | null): LandingChromeInk {
  if (previous === 'light') return luma > LUMA_LIGHT_BG ? 'dark' : 'light';
  if (previous === 'dark') return luma < LUMA_DARK_BG ? 'light' : 'dark';
  return luma < 0.5 ? 'light' : 'dark';
}

function sampleCanvasLuma(x: number, y: number): number | null {
  const canvas = document.querySelector<HTMLCanvasElement>('.cc-shader-hero canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return null;
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;

  const sx = Math.round(((x - rect.left) / rect.width) * canvas.width);
  const sy = Math.round(((y - rect.top) / rect.height) * canvas.height);
  const px = Math.min(Math.max(sx, 0), Math.max(canvas.width - 1, 0));
  const py = Math.min(Math.max(sy, 0), Math.max(canvas.height - 1, 0));

  try {
    const gl =
      canvas.getContext('webgl2', { preserveDrawingBuffer: true }) ||
      canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (gl) {
      const pixels = new Uint8Array(4);
      gl.readPixels(px, canvas.height - py - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      if (pixels[3] === 0 && pixels[0] === 0 && pixels[1] === 0 && pixels[2] === 0) {
        return null;
      }
      return (0.2126 * pixels[0] + 0.7152 * pixels[1] + 0.0722 * pixels[2]) / 255;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const data = ctx.getImageData(px, py, 1, 1).data;
    return (0.2126 * data[0] + 0.7152 * data[1] + 0.0722 * data[2]) / 255;
  } catch {
    return null;
  }
}

function fieldClipState() {
  const scene = document.querySelector<HTMLElement>('.cc-ed-hero-scene');
  const field = document.querySelector<HTMLElement>(
    '.cc-ed-hero-scene__field-inner',
  );
  if (!scene || !field) return null;

  const box = field.getBoundingClientRect();
  if (box.height < 8 || box.bottom <= 0 || box.top >= window.innerHeight) {
    return null;
  }

  const style = getComputedStyle(field);
  const clip =
    style.clipPath && style.clipPath !== 'none'
      ? style.clipPath
      : (style as CSSStyleDeclaration & { webkitClipPath?: string })
          .webkitClipPath || 'none';

  const inset = parseClipInset(clip, box);
  if (!inset) return null;

  return {
    box,
    darkTop: box.top + inset.top,
    darkBottom: box.bottom - inset.bottom,
    darkLeft: box.left + inset.left,
    darkRight: box.right - inset.right,
    radius: inset.radius,
  };
}

function inkAtPoint(
  x: number,
  y: number,
  previous: LandingChromeInk | null,
): LandingChromeInk | null {
  const clip = fieldClipState();
  if (!clip) return null;

  const overCinema = pointInRoundedRect(
    x,
    y,
    clip.darkLeft,
    clip.darkTop,
    clip.darkRight,
    clip.darkBottom,
    clip.radius,
  );

  if (!overCinema) return 'dark';

  const luma = sampleCanvasLuma(x, y);
  if (luma == null) return 'light';
  return inkFromLuma(luma, previous);
}

function pointInRect(x: number, y: number, el: Element | null): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return (
    r.width > 0 &&
    r.height > 0 &&
    x >= r.left &&
    x <= r.right &&
    y >= r.top &&
    y <= r.bottom
  );
}

function parseCssRgba(
  color: string,
): { r: number; g: number; b: number; a: number } | null {
  if (!color || color === 'transparent') return null;
  const comma = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  );
  if (comma) {
    return {
      r: Number(comma[1]),
      g: Number(comma[2]),
      b: Number(comma[3]),
      a: comma[4] == null ? 1 : Number(comma[4]),
    };
  }
  const space = color.match(
    /rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i,
  );
  if (space) {
    const aRaw = space[4];
    const a = aRaw
      ? aRaw.endsWith('%')
        ? Number(aRaw.slice(0, -1)) / 100
        : Number(aRaw)
      : 1;
    return { r: Number(space[1]), g: Number(space[2]), b: Number(space[3]), a };
  }
  return null;
}

function isChromeOverlay(node: Element): boolean {
  return Boolean(
    node.closest(
      '.cc-ed-mark-logo, .cc-ed-home-control, .cc-nav-veil, .cc-marketing-nav-shell, .cc-nav-mobile-trigger',
    ),
  );
}

/**
 * Ink from the page under a chrome point: crash pin, declared surfaces,
 * then the first opaque CSS background.
 */
function inkFromPageAt(
  x: number,
  y: number,
  previous: LandingChromeInk | null,
): LandingChromeInk | null {
  if (pointInRect(x, y, document.querySelector('.cc-ed-crash__pin'))) {
    return 'light';
  }

  const stack =
    typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(x, y)
      : [];

  for (const node of stack) {
    if (!(node instanceof HTMLElement)) continue;
    if (isChromeOverlay(node)) continue;

    const declared = node.closest('[data-chrome-surface]');
    if (declared instanceof HTMLElement) {
      const kind = declared.dataset.chromeSurface;
      if (kind === 'dark') return 'light';
      if (kind === 'light') return 'dark';
    }

    if (node.closest('.cc-ed-crash')) return 'light';

    const bg = parseCssRgba(getComputedStyle(node).backgroundColor);
    if (!bg || bg.a < 0.18) continue;
    const luma = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;
    return inkFromLuma(luma, previous);
  }

  return null;
}

function resolveInkAt(
  x: number,
  y: number,
  previous: LandingChromeInk | null,
): LandingChromeInk | null {
  const clip = fieldClipState();
  if (
    clip &&
    x >= clip.box.left &&
    x <= clip.box.right &&
    y >= clip.box.top &&
    y <= clip.box.bottom
  ) {
    return inkAtPoint(x, y, previous);
  }
  return inkFromPageAt(x, y, previous);
}

/**
 * Sync chrome from the live hero field. Logo and nav can disagree when the
 * mesh is bright under one and dark under the other.
 */
export function syncLandingChromeFromCinema(): boolean {
  const clip = fieldClipState();
  if (!clip) return false;

  const logoInk = inkAtPoint(
    centerOf(logoEl(), { x: 48, y: SAMPLE_Y_FALLBACK }).x,
    centerOf(logoEl(), { x: 48, y: SAMPLE_Y_FALLBACK }).y,
    lastLogoInk,
  );
  const navInk = inkAtPoint(
    centerOf(navEl(), { x: window.innerWidth * 0.5, y: SAMPLE_Y_FALLBACK }).x,
    centerOf(navEl(), { x: window.innerWidth * 0.5, y: SAMPLE_Y_FALLBACK }).y,
    lastNavInk,
  );

  if (!logoInk && !navInk) return false;
  if (logoInk) applyLogoInk(logoInk);
  if (navInk) applyNavInk(navInk);
  return true;
}

/**
 * Cinema first, then crash / CSS surfaces, so the mark and pill stay readable
 * after the hero leaves the viewport.
 */
export function syncLandingChromeFromPage(): boolean {
  const logoPt = centerOf(logoEl(), { x: 48, y: SAMPLE_Y_FALLBACK });
  const navPt = centerOf(navEl(), {
    x: window.innerWidth * 0.5,
    y: SAMPLE_Y_FALLBACK,
  });
  const logoInk = resolveInkAt(logoPt.x, logoPt.y, lastLogoInk);
  const navInk = resolveInkAt(navPt.x, navPt.y, lastNavInk);
  if (!logoInk && !navInk) return false;
  if (logoInk) applyLogoInk(logoInk);
  if (navInk) applyNavInk(navInk);
  return true;
}

/** Coalesce scroll/timeline updates to one paint per frame (mobile-friendly). */
export function createChromeToneRafScheduler(run: () => void): {
  request: () => void;
  cancel: () => void;
} {
  let raf = 0;
  return {
    request: () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        run();
      });
    },
    cancel: () => {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

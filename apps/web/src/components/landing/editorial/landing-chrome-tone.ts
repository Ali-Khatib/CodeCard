/**
 * Landing fixed chrome (CC mark + nav pill) ink.
 * `dark` = black ink on light/cream surfaces
 * `light` = cream/white ink on dark cinema surfaces
 *
 * Geometry from the hero field clip-path — no canvas sampling, rAF-safe on phones.
 */

export type LandingChromeInk = 'light' | 'dark';

const SAMPLE_Y_FALLBACK = 36;

function navToneForInk(ink: LandingChromeInk): 'light' | 'dark' {
  /* navTone names the surface: cream surface → light, dark cinema → dark */
  return ink === 'dark' ? 'light' : 'dark';
}

/** Apply logo + nav together so they never diverge. No-ops when unchanged. */
export function applyLandingChromeInk(ink: LandingChromeInk): void {
  const html = document.documentElement;
  const nextNav = navToneForInk(ink);
  if (html.dataset.logoTone === ink && html.dataset.navTone === nextNav) return;
  html.dataset.logoTone = ink;
  html.dataset.navTone = nextNav;
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
  /* Radius % is relative to the corresponding dimension; use the smaller side. */
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

function samplePoints(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const logo = document.querySelector<HTMLElement>(
    '.cc-marketing-shell:has(.cc-ed) .cc-ed-mark-logo:not(.cc-auth-mark)',
  );
  if (logo) {
    const r = logo.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      points.push({ x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 });
    }
  }
  const nav = document.querySelector<HTMLElement>(
    '.cc-marketing-shell:has(.cc-ed) .cc-nav-veil',
  );
  if (nav) {
    const r = nav.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      points.push({ x: r.left + r.width * 0.5, y: r.top + r.height * 0.45 });
    }
  }
  if (points.length === 0) {
    points.push({ x: 48, y: SAMPLE_Y_FALLBACK });
    points.push({ x: window.innerWidth * 0.5, y: SAMPLE_Y_FALLBACK });
  }
  return points;
}

/**
 * Ink implied by the hero cinema clip under the fixed chrome.
 * Returns null when the hero field is not the active surface (use chapter/footer).
 */
export function chromeInkFromHeroCinema(): LandingChromeInk | null {
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
      : // Safari
        (style as CSSStyleDeclaration & { webkitClipPath?: string })
          .webkitClipPath || 'none';

  const inset = parseClipInset(clip, box);
  if (!inset) return null;

  const darkTop = box.top + inset.top;
  const darkBottom = box.bottom - inset.bottom;
  const darkLeft = box.left + inset.left;
  const darkRight = box.right - inset.right;
  const radius = inset.radius;

  /* Tiny shut clip (intro) — cream owns the chrome band. */
  if (darkBottom - darkTop < 48 || darkRight - darkLeft < 48) {
    return 'dark';
  }

  /*
   * Any visible cream letterbox / rounded frame under the fixed chrome → black ink.
   * Only flip to white once the cinema is effectively full-bleed (no pad).
   * Avoids white CC/nav sitting in the cream strip during the closed/expand states.
   */
  const creamPad =
    inset.top > 1 || inset.right > 1 || inset.bottom > 1 || inset.left > 1 || radius > 1;
  if (creamPad) return 'dark';

  const overDark = (p: { x: number; y: number }) =>
    pointInRoundedRect(
      p.x,
      p.y,
      darkLeft,
      darkTop,
      darkRight,
      darkBottom,
      radius,
    );

  const points = samplePoints();
  if (points.some((p) => !overDark(p))) return 'dark';
  return 'light';
}

/** Sync chrome from cinema when present; returns true if cinema owned the decision. */
export function syncLandingChromeFromCinema(): boolean {
  const ink = chromeInkFromHeroCinema();
  if (!ink) return false;
  applyLandingChromeInk(ink);
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

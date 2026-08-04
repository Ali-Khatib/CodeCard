import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let pluginsRegistered = false;

/** Register GSAP plugins once per JS runtime. Safe to call repeatedly. */
export function ensureGsapPlugins(): typeof gsap {
  if (!pluginsRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
  }
  return gsap;
}

/** Development-only ScrollTrigger markers. Never enable in production builds. */
export function gsapMarkersEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_GSAP_MARKERS === '1'
  );
}

/** Kill every ScrollTrigger — used on route teardown / provider unmount. */
export function killAllScrollTriggers(): void {
  if (typeof window === 'undefined') return;
  ensureGsapPlugins();
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

export function refreshScrollTrigger(options?: { safe?: boolean }): void {
  if (typeof window === 'undefined') return;
  ensureGsapPlugins();
  if (options?.safe) {
    ScrollTrigger.refresh(true);
  } else {
    ScrollTrigger.refresh();
  }
}

export { gsap, ScrollTrigger };

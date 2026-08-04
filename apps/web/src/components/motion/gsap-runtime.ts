import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let pluginsRegistered = false;

/** Register GSAP plugins once per JS runtime. Safe to call repeatedly. */
export function ensureGsapPlugins(): typeof gsap {
  if (!pluginsRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
    installMotionDebugHooks();
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

/**
 * @deprecated Do not call from marketing providers — kills unrelated triggers.
 * Kept only for isolated diagnostics / emergency recovery.
 */
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

export function getScrollTriggerCount(): number {
  if (typeof window === 'undefined') return 0;
  ensureGsapPlugins();
  return ScrollTrigger.getAll().length;
}

type MotionDebugWindow = Window & {
  __CODECARD_E2E_ALLOW_MOTION_DEBUG__?: boolean;
  __codecardMotionDebug?: {
    getScrollTriggerCount: () => number;
    getLenisActive: () => boolean;
    /** Creates a ScrollTrigger not owned by marketing components (cleanup audit). */
    createOrphanTrigger: () => string;
    hasTriggerId: (id: string) => boolean;
    /** Destructive diagnostic — used only to prove orphans are real ScrollTriggers. */
    killAllScrollTriggers: () => void;
  };
};

function installMotionDebugHooks() {
  if (typeof window === 'undefined') return;
  const w = window as MotionDebugWindow;
  if (!w.__CODECARD_E2E_ALLOW_MOTION_DEBUG__ && process.env.NODE_ENV === 'production') {
    return;
  }
  w.__codecardMotionDebug = {
    getScrollTriggerCount: () => ScrollTrigger.getAll().length,
    getLenisActive: () => document.documentElement.classList.contains('lenis'),
    createOrphanTrigger: () => {
      const id = `codecard-orphan-${Date.now()}`;
      // Parked off-activation so it is not auto-killed by once/start.
      ScrollTrigger.create({
        id,
        trigger: document.documentElement,
        start: 'top+=99999 top',
        end: '+=1',
        once: false,
      });
      return id;
    },
    hasTriggerId: (id: string) => ScrollTrigger.getById(id) != null,
    killAllScrollTriggers: () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    },
  };
}

export { gsap, ScrollTrigger };

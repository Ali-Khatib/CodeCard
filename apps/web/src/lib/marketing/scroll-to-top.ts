/** Scroll the marketing page to the top, using Lenis when it is attached. */
export function scrollMarketingToTop(durationMs = 1400) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement as HTMLElement & {
    lenis?: {
      scrollTo: (
        v: number,
        opts?: { duration?: number; easing?: (t: number) => number },
      ) => void;
    };
  };
  const lenis =
    root.lenis ??
    (window as unknown as { lenis?: NonNullable<typeof root.lenis> }).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(0, {
      duration: durationMs / 1000,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    });
    return;
  }
  window.scrollTo({ top: 0, behavior: durationMs > 0 ? 'smooth' : 'auto' });
}

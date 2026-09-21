'use client';

import { CodeCardMark } from '@/components/brand/codecard-mark';

export const OPEN_LIVE_PEEK_EVENT = 'codecard:open-live-peek';

function lenisScrollTo(top: number) {
  const root = document.documentElement as HTMLElement & {
    lenis?: { scrollTo: (v: number, opts?: { duration?: number }) => void };
  };
  const lenis =
    root.lenis ??
    (window as unknown as { lenis?: NonNullable<typeof root.lenis> }).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(top, { duration: 0.9 });
    return true;
  }
  return false;
}

export function scrollToLandingLiveDemo() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_LIVE_PEEK_EVENT));
  const el = document.getElementById('live-demo');
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 24;
  if (!lenisScrollTo(Math.max(0, top))) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

type EditorialLivePeekButtonProps = {
  className?: string;
  onActivate?: () => void;
  /** Jump the page to the in-landing live workspace. Default true. */
  scrollToDemo?: boolean;
};

export function EditorialLivePeekButton({
  className,
  onActivate,
  scrollToDemo = true,
}: EditorialLivePeekButtonProps) {
  return (
    <button
      type="button"
      className={
        className
          ? `cc-ed-live-peek ${className}`
          : 'cc-ed-live-peek'
      }
      onClick={() => {
        onActivate?.();
        if (scrollToDemo) scrollToLandingLiveDemo();
        else window.dispatchEvent(new Event(OPEN_LIVE_PEEK_EVENT));
      }}
    >
      <CodeCardMark className="cc-ed-live-peek__mark" />
      <span className="cc-ed-live-peek__label">Take a quick peek at CodeCard</span>
    </button>
  );
}

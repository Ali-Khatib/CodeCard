'use client';

import { useEffect, useRef } from 'react';
import { ACTIVE_TIME_HEARTBEAT_MS } from '@/lib/analytics/active-time';
import { createActiveTimeTracker } from '@/lib/analytics/active-time-tracker';

type UseActiveTimeTrackingOptions = {
  /** When false, tracking is idle (drafts, handoff, missing ids). */
  enabled: boolean;
  /** Changes reset attribution so time is never applied to another resource. */
  targetKey: string;
  onFlush: (seconds: number) => void;
};

/**
 * Counts visible-document time for public project/research detail pages.
 * Pauses while `document.visibilityState !== 'visible'`.
 *
 * Limitation: visibility ≠ reading; idle visible tabs still count.
 * Unload/`pagehide` delivery is best-effort; heartbeats are primary.
 */
export function useActiveTimeTracking({
  enabled,
  targetKey,
  onFlush,
}: UseActiveTimeTrackingOptions): void {
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const tracker = createActiveTimeTracker({
      now: () => {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
          return performance.now();
        }
        return Date.now();
      },
      visibilityState: () => document.visibilityState,
    });

    const emit = (forceFinal: boolean) => {
      const seconds = tracker.flush(forceFinal);
      if (seconds != null) {
        onFlushRef.current(seconds);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tracker.resume();
      } else {
        tracker.pause();
        emit(false);
      }
    };

    const onPageHide = () => {
      emit(true);
    };

    if (document.visibilityState === 'visible') {
      tracker.resume();
    }

    const heartbeat = window.setInterval(() => {
      if (tracker.isCapped()) return;
      emit(false);
    }, ACTIVE_TIME_HEARTBEAT_MS);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      emit(true);
    };
  }, [enabled, targetKey]);
}

/**
 * Visibility-aware active-time accumulator (unit: ms / flush seconds).
 * Used by `useActiveTimeTracking`; kept free of React for deterministic tests.
 */

import {
  ACTIVE_TIME_MAX_SECONDS,
  ACTIVE_TIME_MIN_SECONDS,
} from '@/lib/analytics/active-time';

export type ActiveTimeClock = {
  now: () => number;
  visibilityState: () => DocumentVisibilityState;
};

export type ActiveTimeTracker = {
  resume: () => void;
  pause: () => void;
  /** Returns seconds flushed, or null when nothing should be sent. */
  flush: (forceFinal: boolean) => number | null;
  getTotalSentSeconds: () => number;
  isCapped: () => boolean;
};

export function createActiveTimeTracker(clock: ActiveTimeClock): ActiveTimeTracker {
  let visibleStartedAt: number | null = null;
  let unsentMs = 0;
  let totalSentSeconds = 0;
  let reachedCap = false;
  let finalized = false;

  const remainingCapSeconds = () => Math.max(0, ACTIVE_TIME_MAX_SECONDS - totalSentSeconds);

  const pause = () => {
    if (visibleStartedAt == null) return;
    unsentMs += Math.max(0, clock.now() - visibleStartedAt);
    visibleStartedAt = null;
  };

  const resume = () => {
    if (reachedCap || finalized) return;
    if (clock.visibilityState() !== 'visible') return;
    if (visibleStartedAt != null) return;
    visibleStartedAt = clock.now();
  };

  const flush = (forceFinal: boolean): number | null => {
    if (reachedCap || (finalized && forceFinal)) return null;
    pause();

    const availableSeconds = Math.floor(unsentMs / 1000);
    const cap = remainingCapSeconds();
    if (cap <= 0) {
      reachedCap = true;
      unsentMs = 0;
      return null;
    }

    const seconds = Math.min(availableSeconds, cap);
    if (seconds <= 0) {
      resume();
      return null;
    }

    if (totalSentSeconds === 0 && seconds < ACTIVE_TIME_MIN_SECONDS) {
      if (!forceFinal) {
        resume();
        return null;
      }
      return null;
    }

    if (!forceFinal && seconds < ACTIVE_TIME_MIN_SECONDS) {
      resume();
      return null;
    }

    if (forceFinal && totalSentSeconds > 0 && seconds < 1) {
      return null;
    }

    totalSentSeconds += seconds;
    unsentMs = Math.max(0, unsentMs - seconds * 1000);
    if (totalSentSeconds >= ACTIVE_TIME_MAX_SECONDS) {
      reachedCap = true;
      unsentMs = 0;
      visibleStartedAt = null;
    }

    if (forceFinal) {
      finalized = true;
    } else if (!reachedCap) {
      resume();
    }

    return seconds;
  };

  return {
    resume,
    pause,
    flush,
    getTotalSentSeconds: () => totalSentSeconds,
    isCapped: () => reachedCap,
  };
}

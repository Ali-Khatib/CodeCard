import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TIME_HEARTBEAT_MS,
  ACTIVE_TIME_MAX_SECONDS,
  ACTIVE_TIME_MIN_SECONDS,
} from './active-time';
import { createActiveTimeTracker } from './active-time-tracker';

describe('WS08-T009 createActiveTimeTracker', () => {
  it('does not emit below the three-second minimum', () => {
    let now = 0;
    const visibility: DocumentVisibilityState = 'visible';
    const tracker = createActiveTimeTracker({
      now: () => now,
      visibilityState: () => visibility,
    });

    tracker.resume();
    now = 2_900;
    expect(tracker.flush(true)).toBeNull();
    expect(tracker.getTotalSentSeconds()).toBe(0);
  });

  it('emits at the three-second boundary on final flush', () => {
    let now = 0;
    const tracker = createActiveTimeTracker({
      now: () => now,
      visibilityState: () => 'visible',
    });
    tracker.resume();
    now = ACTIVE_TIME_MIN_SECONDS * 1000;
    expect(tracker.flush(true)).toBe(ACTIVE_TIME_MIN_SECONDS);
  });

  it('excludes hidden intervals from accumulated time', () => {
    let now = 0;
    let visibility: DocumentVisibilityState = 'visible';
    const tracker = createActiveTimeTracker({
      now: () => now,
      visibilityState: () => visibility,
    });

    tracker.resume();
    now = 5_000;
    visibility = 'hidden';
    tracker.pause();
    expect(tracker.flush(false)).toBe(5);

    now = 20_000;
    visibility = 'visible';
    tracker.resume();
    now = 20_000 + ACTIVE_TIME_HEARTBEAT_MS;
    expect(tracker.flush(false)).toBe(15);
    expect(tracker.getTotalSentSeconds()).toBe(20);
  });

  it('caps total countable time at thirty minutes', () => {
    let now = 0;
    const tracker = createActiveTimeTracker({
      now: () => now,
      visibilityState: () => 'visible',
    });
    tracker.resume();

    let emitted = 0;
    while (!tracker.isCapped()) {
      now += ACTIVE_TIME_HEARTBEAT_MS;
      const seconds = tracker.flush(false);
      if (seconds != null) emitted += seconds;
      if (emitted > ACTIVE_TIME_MAX_SECONDS + 60) break;
    }

    expect(tracker.getTotalSentSeconds()).toBe(ACTIVE_TIME_MAX_SECONDS);
    expect(tracker.isCapped()).toBe(true);
    now += ACTIVE_TIME_HEARTBEAT_MS;
    expect(tracker.flush(false)).toBeNull();
  });
});

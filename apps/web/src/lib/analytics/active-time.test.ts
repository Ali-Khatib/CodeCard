import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TIME_HEARTBEAT_MS,
  ACTIVE_TIME_MAX_SECONDS,
  ACTIVE_TIME_MIN_SECONDS,
  parseActiveTimeSeconds,
} from './active-time';

describe('WS08-T009 active time contract', () => {
  it('documents min, max, and heartbeat constants', () => {
    expect(ACTIVE_TIME_MIN_SECONDS).toBe(3);
    expect(ACTIVE_TIME_MAX_SECONDS).toBe(1800);
    expect(ACTIVE_TIME_HEARTBEAT_MS).toBe(15_000);
  });

  it('accepts integer seconds within bounds', () => {
    expect(parseActiveTimeSeconds(3)).toBe(3);
    expect(parseActiveTimeSeconds(15)).toBe(15);
    expect(parseActiveTimeSeconds(1800)).toBe(1800);
  });

  it('rejects invalid durations', () => {
    expect(parseActiveTimeSeconds(2)).toBeNull();
    expect(parseActiveTimeSeconds(0)).toBeNull();
    expect(parseActiveTimeSeconds(-5)).toBeNull();
    expect(parseActiveTimeSeconds(1801)).toBeNull();
    expect(parseActiveTimeSeconds(3.5)).toBeNull();
    expect(parseActiveTimeSeconds(NaN)).toBeNull();
    expect(parseActiveTimeSeconds(Infinity)).toBeNull();
    expect(parseActiveTimeSeconds('12')).toBeNull();
  });
});

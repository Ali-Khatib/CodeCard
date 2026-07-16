/**
 * WS08-T009 — Active (visibility-aware) time tracking contract.
 *
 * Unit: integer seconds of visible-tab time.
 * Limitation: a visible tab counts as active; this is not human-presence detection
 * (no mouse/keystroke/camera idle checks).
 */

export const ACTIVE_TIME_MIN_SECONDS = 3;
export const ACTIVE_TIME_MAX_SECONDS = 30 * 60;
/** Primary reliability path: flush accumulated visible time on this interval. */
export const ACTIVE_TIME_HEARTBEAT_MS = 15_000;
/** Max seconds accepted in a single heartbeat/exit payload. */
export const ACTIVE_TIME_PER_FLUSH_MAX_SECONDS = ACTIVE_TIME_MAX_SECONDS;

export function parseActiveTimeSeconds(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (!Number.isInteger(value)) return null;
  if (value < ACTIVE_TIME_MIN_SECONDS) return null;
  if (value > ACTIVE_TIME_PER_FLUSH_MAX_SECONDS) return null;
  return value;
}

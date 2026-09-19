import { describe, expect, it } from 'vitest';
import { coerceIsoDateTime } from './datetime';

describe('schedule datetime', () => {
  it('accepts date-only, ISO, and empty values', () => {
    expect(coerceIsoDateTime(null)).toEqual({ ok: true, iso: null });
    expect(coerceIsoDateTime('')).toEqual({ ok: true, iso: null });
    expect(coerceIsoDateTime('2026-09-22')).toEqual({
      ok: true,
      iso: '2026-09-22T12:00:00.000Z',
    });
    expect(coerceIsoDateTime('2026-09-22T16:00:00.000Z')).toEqual({
      ok: true,
      iso: '2026-09-22T16:00:00.000Z',
    });
    expect(coerceIsoDateTime('not-a-date').ok).toBe(false);
  });
});

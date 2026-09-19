import { describe, expect, it } from 'vitest';
import {
  formatDateKey,
  isoFromLocalParts,
  localDateKeyFromIso,
  middayUtcIso,
  monthCells,
  shiftMonth,
  timePartsFromIso,
  WEEKDAY_LABELS,
} from './calendar-month';

describe('home month calendar', () => {
  it('builds a Monday-first grid that includes the first of the month', () => {
    expect(WEEKDAY_LABELS[0]).toBe('Mon');
    const cells = monthCells(2026, 8);
    expect(cells).toHaveLength(42);
    const first = cells.find((cell) => cell.dateKey === '2026-09-01');
    expect(first?.inMonth).toBe(true);
    expect(cells[0]?.dateKey).toBe('2026-08-31');
  });

  it('round-trips local date and 12-hour time', () => {
    const iso = isoFromLocalParts('2026-09-04', 12, 0, 'AM');
    expect(iso).toBeTruthy();
    expect(localDateKeyFromIso(iso!)).toBe('2026-09-04');
    expect(timePartsFromIso(iso!)).toEqual({
      hour12: 12,
      minute: 0,
      meridiem: 'AM',
    });
    expect(formatDateKey(new Date(2026, 8, 22))).toBe('2026-09-22');
  });

  it('pins demo event instants to the intended calendar day in UTC+3', () => {
    const iso = middayUtcIso('2026-09-22', 17, 0);
    expect(iso).toBe('2026-09-22T17:00:00.000Z');
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Helsinki',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso!));
    expect(parts).toBe('2026-09-22');
  });

  it('shifts months across year boundaries', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import {
  addUtcDays,
  buildTrendSeries,
  buildUtcRangeWindow,
  isAnalyticsTrendRange,
  toUtcDayKey,
} from './analytics-trends';

describe('WS08-T007 UTC analytics trends', () => {
  it('builds seven and thirty day windows including today', () => {
    const now = new Date('2026-07-15T15:30:00.000Z');
    const seven = buildUtcRangeWindow(7, now);
    expect(seven.dayKeys).toHaveLength(7);
    expect(seven.endDay).toBe('2026-07-15');
    expect(seven.startDay).toBe('2026-07-09');
    expect(seven.rangeStart).toBe('2026-07-09T00:00:00.000Z');
    expect(seven.rangeEndExclusive).toBe('2026-07-16T00:00:00.000Z');

    const thirty = buildUtcRangeWindow(30, now);
    expect(thirty.dayKeys).toHaveLength(30);
    expect(thirty.startDay).toBe('2026-06-16');
    expect(thirty.endDay).toBe('2026-07-15');
  });

  it('uses half-open boundaries for event inclusion', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    const series = buildTrendSeries({
      range: 7,
      now,
      events: [
        { event_type: 'profile_view', created_at: '2026-07-09T00:00:00.000Z' }, // included
        { event_type: 'profile_view', created_at: '2026-07-08T23:59:59.999Z' }, // excluded
        { event_type: 'profile_view', created_at: '2026-07-16T00:00:00.000Z' }, // excluded
        { event_type: 'profile_view', created_at: '2026-07-15T23:59:59.999Z' }, // included
        { event_type: 'project_view', created_at: '2026-07-12T10:00:00.000Z' },
        { event_type: 'link_click', created_at: '2026-07-12T11:00:00.000Z' },
      ],
    });

    expect(series.buckets).toHaveLength(7);
    expect(series.totals.profileViews).toBe(2);
    expect(series.totals.projectViews).toBe(1);
    expect(series.totals.linkClicks).toBe(1);
    const jul12 = series.buckets.find((b) => b.day === '2026-07-12');
    expect(jul12?.projectViews).toBe(1);
    expect(jul12?.linkClicks).toBe(1);
    const empty = series.buckets.find((b) => b.day === '2026-07-10');
    expect(empty?.profileViews).toBe(0);
  });

  it('zero-fills missing days in chronological order', () => {
    const now = new Date('2026-03-01T08:00:00.000Z');
    const series = buildTrendSeries({
      range: 7,
      now,
      events: [{ event_type: 'qr_download', created_at: '2026-03-01T01:00:00.000Z' }],
    });
    expect(series.buckets.map((b) => b.day)).toEqual([
      '2026-02-23',
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
    expect(series.buckets.filter((b) => b.qrDownloads === 0)).toHaveLength(6);
    expect(series.totals.qrDownloads).toBe(1);
    const sum = series.buckets.reduce((n, b) => n + b.qrDownloads, 0);
    expect(sum).toBe(series.totals.qrDownloads);
  });

  it('handles year and leap-day boundaries', () => {
    expect(addUtcDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addUtcDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(toUtcDayKey(new Date('2024-02-29T23:30:00.000Z'))).toBe('2024-02-29');
  });

  it('accepts only approved range values', () => {
    expect(isAnalyticsTrendRange(7)).toBe(true);
    expect(isAnalyticsTrendRange(30)).toBe(true);
    expect(isAnalyticsTrendRange(14)).toBe(false);
    expect(isAnalyticsTrendRange('7')).toBe(false);
  });

  it('bucket totals equal series totals for each metric', () => {
    const now = new Date('2026-07-15T00:00:00.000Z');
    const series = buildTrendSeries({
      range: 30,
      now,
      events: [
        { event_type: 'profile_view', created_at: '2026-07-01T00:00:00.000Z' },
        { event_type: 'profile_view', created_at: '2026-07-14T12:00:00.000Z' },
        { event_type: 'profile_share', created_at: '2026-06-20T12:00:00.000Z' },
        { event_type: 'qr_download', created_at: '2026-06-16T00:00:00.000Z' },
      ],
    });
    expect(series.buckets).toHaveLength(30);
    expect(series.buckets.reduce((n, b) => n + b.profileViews, 0)).toBe(
      series.totals.profileViews,
    );
    expect(series.buckets.reduce((n, b) => n + b.profileShares, 0)).toBe(
      series.totals.profileShares,
    );
    expect(series.buckets.reduce((n, b) => n + b.qrDownloads, 0)).toBe(
      series.totals.qrDownloads,
    );
  });
});

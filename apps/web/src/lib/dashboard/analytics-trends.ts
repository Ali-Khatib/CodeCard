/**
 * WS08-T007 — UTC analytics range contract.
 *
 * Ranges include today (UTC) and the previous N-1 UTC calendar days.
 * Half-open query window: created_at >= rangeStart AND created_at < rangeEndExclusive.
 */

export type AnalyticsTrendRange = 7 | 30;

export type UtcDayKey = string; // YYYY-MM-DD

export type DailyTrendBucket = {
  /** UTC calendar day key (YYYY-MM-DD). */
  day: UtcDayKey;
  /** Short UTC label for charts (e.g. 07-15). */
  label: string;
  profileViews: number;
  projectViews: number;
  linkClicks: number;
  profileShares: number;
  qrDownloads: number;
};

export type AnalyticsTrendSeries = {
  range: AnalyticsTrendRange;
  /** Inclusive first UTC day (YYYY-MM-DD). */
  startDay: UtcDayKey;
  /** Inclusive last UTC day (YYYY-MM-DD) — today. */
  endDay: UtcDayKey;
  /** Instant of startDay 00:00:00.000Z */
  rangeStart: string;
  /** Instant of day after endDay 00:00:00.000Z (exclusive). */
  rangeEndExclusive: string;
  buckets: DailyTrendBucket[];
  totals: {
    profileViews: number;
    projectViews: number;
    linkClicks: number;
    profileShares: number;
    qrDownloads: number;
  };
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toUtcDayKey(date: Date): UtcDayKey {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function parseUtcDayKey(day: UtcDayKey): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) {
    throw new Error(`Invalid UTC day key: ${day}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, date));
}

export function addUtcDays(day: UtcDayKey, delta: number): UtcDayKey {
  const d = parseUtcDayKey(day);
  d.setUTCDate(d.getUTCDate() + delta);
  return toUtcDayKey(d);
}

/** Today in UTC as YYYY-MM-DD. */
export function utcTodayKey(now: Date = new Date()): UtcDayKey {
  return toUtcDayKey(now);
}

/**
 * Build range boundaries for the last `days` UTC calendar days including today.
 * Example: days=7 → today + previous 6 days.
 */
export function buildUtcRangeWindow(
  days: AnalyticsTrendRange,
  now: Date = new Date(),
): {
  startDay: UtcDayKey;
  endDay: UtcDayKey;
  rangeStart: string;
  rangeEndExclusive: string;
  dayKeys: UtcDayKey[];
} {
  const endDay = utcTodayKey(now);
  const startDay = addUtcDays(endDay, -(days - 1));
  const dayKeys: UtcDayKey[] = [];
  for (let i = 0; i < days; i += 1) {
    dayKeys.push(addUtcDays(startDay, i));
  }
  const rangeStart = `${startDay}T00:00:00.000Z`;
  const rangeEndExclusive = `${addUtcDays(endDay, 1)}T00:00:00.000Z`;
  return { startDay, endDay, rangeStart, rangeEndExclusive, dayKeys };
}

export function emptyBucket(day: UtcDayKey): DailyTrendBucket {
  return {
    day,
    label: day.slice(5),
    profileViews: 0,
    projectViews: 0,
    linkClicks: 0,
    profileShares: 0,
    qrDownloads: 0,
  };
}

const TREND_EVENT_TYPES = new Set([
  'profile_view',
  'project_view',
  'link_click',
  'profile_share',
  'qr_download',
]);

export function buildTrendSeries(input: {
  range: AnalyticsTrendRange;
  now?: Date;
  events: { event_type: string; created_at: string }[];
}): AnalyticsTrendSeries {
  const window = buildUtcRangeWindow(input.range, input.now ?? new Date());
  const byDay = new Map<UtcDayKey, DailyTrendBucket>();
  for (const day of window.dayKeys) {
    byDay.set(day, emptyBucket(day));
  }

  const startMs = Date.parse(window.rangeStart);
  const endMs = Date.parse(window.rangeEndExclusive);

  for (const event of input.events) {
    if (!TREND_EVENT_TYPES.has(event.event_type)) continue;
    const ts = Date.parse(event.created_at);
    if (!Number.isFinite(ts)) continue;
    // Half-open: include start, exclude end.
    if (ts < startMs || ts >= endMs) continue;
    const day = toUtcDayKey(new Date(ts));
    const bucket = byDay.get(day);
    if (!bucket) continue;
    switch (event.event_type) {
      case 'profile_view':
        bucket.profileViews += 1;
        break;
      case 'project_view':
        bucket.projectViews += 1;
        break;
      case 'link_click':
        bucket.linkClicks += 1;
        break;
      case 'profile_share':
        bucket.profileShares += 1;
        break;
      case 'qr_download':
        bucket.qrDownloads += 1;
        break;
      default:
        break;
    }
  }

  const buckets = window.dayKeys.map((day) => byDay.get(day)!);
  const totals = buckets.reduce(
    (acc, b) => ({
      profileViews: acc.profileViews + b.profileViews,
      projectViews: acc.projectViews + b.projectViews,
      linkClicks: acc.linkClicks + b.linkClicks,
      profileShares: acc.profileShares + b.profileShares,
      qrDownloads: acc.qrDownloads + b.qrDownloads,
    }),
    {
      profileViews: 0,
      projectViews: 0,
      linkClicks: 0,
      profileShares: 0,
      qrDownloads: 0,
    },
  );

  return {
    range: input.range,
    startDay: window.startDay,
    endDay: window.endDay,
    rangeStart: window.rangeStart,
    rangeEndExclusive: window.rangeEndExclusive,
    buckets,
    totals,
  };
}

export function isAnalyticsTrendRange(value: unknown): value is AnalyticsTrendRange {
  return value === 7 || value === 30;
}

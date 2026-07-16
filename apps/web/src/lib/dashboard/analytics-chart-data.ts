import type { TimeRange } from './analytics-data';

/**
 * Preview/demo chart fixtures only — not used by authenticated analytics.
 */

export type EngagementRow = { id: string; label: string; value: number };

/** Real action counts — sorted by value when built */
const ENGAGEMENT: EngagementRow[] = [
  { id: 'qr', label: 'QR scans', value: 128 },
  { id: 'devflow-saves', label: 'DevFlow saves', value: 47 },
  { id: 'linkedin', label: 'LinkedIn clicks', value: 38 },
  { id: 'github', label: 'GitHub clicks', value: 29 },
  { id: 'schemasync-saves', label: 'SchemaSync saves', value: 22 },
  { id: 'nfc', label: 'NFC taps', value: 18 },
];

const RANGE_SCALE: Record<TimeRange, number> = {
  today: 0.35,
  '7d': 0.65,
  '30d': 1,
  '90d': 1.15,
  '1y': 1.28,
  lifetime: 1.35,
};

export const ENGAGEMENT_BAR_COLOR = '#C094E4';

export function buildEngagementRows(range: TimeRange = '30d'): EngagementRow[] {
  const scale = RANGE_SCALE[range] ?? 1;
  return ENGAGEMENT.map((row) => ({
    ...row,
    value: Math.max(1, Math.round(row.value * scale)),
  })).sort((a, b) => b.value - a.value);
}

export function formatEngagementValue(value: number): string {
  return value.toLocaleString();
}

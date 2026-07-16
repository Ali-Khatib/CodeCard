import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildUtcRangeWindow, isAnalyticsTrendRange } from './analytics-trends';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T006 real analytics tab', () => {
  it('authenticated Analytics uses only owner query helpers', () => {
    const page = read('src/app/dashboard/(authenticated)/analytics/page.tsx');
    const view = read('src/components/dashboard/dashboard-analytics-view.tsx');
    const chart = read('src/components/dashboard/analytics/analytics-trend-chart.tsx');
    const queries = read('src/lib/dashboard/analytics-queries.ts');

    expect(page).toContain('loadOwnerAnalytics');
    expect(page).toContain('loadOwnerAnalyticsTrends');
    expect(page).toContain('isAnalyticsTrendRange');
    expect(page).not.toContain('buildAnalyticsData');
    expect(page).not.toContain('preview-analytics-view');
    expect(page).not.toContain("from '@/lib/dashboard/analytics-data'");
    expect(page).toContain('Analytics failed to load');
    expect(page).toContain("reason === 'no_profile'");

    expect(view).toContain('OwnerAnalyticsSummary');
    expect(view).toContain('AnalyticsTrendChart');
    expect(view).toContain('hasAnyEvents');
    expect(view).not.toContain('buildAnalyticsData');
    expect(view).not.toContain('1284');
    expect(view).not.toContain('reachChange');
    expect(view).not.toContain('Math.random');

    expect(chart).toContain('range=7');
    expect(chart).toContain('range=30');
    expect(queries).toContain("eq('owner_user_id', userId)");
    expect(queries).toContain("eq('profile_id', profile.id)");
  });

  it('keeps UTC 7/30 day contracts and preview isolation', () => {
    expect(isAnalyticsTrendRange(7)).toBe(true);
    expect(isAnalyticsTrendRange(30)).toBe(true);
    expect(isAnalyticsTrendRange(14)).toBe(false);

    const now = new Date('2026-07-15T12:00:00.000Z');
    expect(buildUtcRangeWindow(7, now).dayKeys).toHaveLength(7);
    expect(buildUtcRangeWindow(30, now).dayKeys).toHaveLength(30);

    expect(existsSync(resolve(process.cwd(), 'src/app/dashboard/preview/analytics/page.tsx'))).toBe(
      true,
    );
    const preview = read('src/app/dashboard/preview/analytics/page.tsx');
    expect(preview).toContain('PreviewAnalyticsView');
    expect(preview).not.toContain('loadOwnerAnalytics');
  });
});

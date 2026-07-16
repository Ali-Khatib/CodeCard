import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS08-T010 analytics empty states', () => {
  it('distinguishes zero, private, range-empty, and query-error states', () => {
    const page = read('src/app/dashboard/(authenticated)/analytics/page.tsx');
    const view = read('src/components/dashboard/dashboard-analytics-view.tsx');
    const chart = read('src/components/dashboard/analytics/analytics-trend-chart.tsx');

    expect(page).toContain("reason === 'no_profile'");
    expect(page).toContain('Analytics failed to load');
    expect(page).toContain('Trend queries failed');
    expect(page).not.toContain('buildAnalyticsData');

    expect(view).toContain('No audience activity yet');
    expect(view).toContain('not sample data');
    expect(view).toContain('Profile is private');
    expect(view).toContain('hasAnyEvents');
    expect(view).toContain('View public profile');
    expect(view).not.toContain('buildAnalyticsData');
    expect(view).not.toContain('1284');

    expect(chart).toContain('hasLifetimeEvents');
    expect(chart).toContain('No recorded activity in the last');
    expect(chart).toContain('Lifetime totals above are unchanged');
  });
});

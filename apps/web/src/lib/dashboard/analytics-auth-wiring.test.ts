import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS08-T006/T007 authenticated analytics wiring', () => {
  it('uses owner query aggregates and not synthetic builders', () => {
    const page = read('src/app/dashboard/(authenticated)/analytics/page.tsx');
    const view = read('src/components/dashboard/dashboard-analytics-view.tsx');
    const previewPage = read('src/app/dashboard/preview/analytics/page.tsx');

    expect(page).toContain('loadOwnerAnalytics');
    expect(page).toContain('loadOwnerAnalyticsTrends');
    expect(page).toContain('isAnalyticsTrendRange');
    expect(page).not.toContain('buildAnalyticsData');
    expect(view).not.toContain('buildAnalyticsData');
    expect(view).toContain('OwnerAnalyticsSummary');
    expect(view).toContain('AnalyticsTrendChart');
    expect(view).not.toContain('1284');
    expect(view).not.toContain('reachChange');

    expect(previewPage).toContain('PreviewAnalyticsView');
    expect(previewPage).not.toContain('loadOwnerAnalytics');
    expect(previewPage).not.toContain('loadOwnerAnalyticsTrends');
  });
});

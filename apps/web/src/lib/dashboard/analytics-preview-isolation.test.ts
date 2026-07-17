import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const AUTH_ANALYTICS_PAGE = 'src/app/dashboard/(authenticated)/analytics/page.tsx';
const AUTH_HOME_PAGE = 'src/app/dashboard/(authenticated)/page.tsx';
const AUTH_VIEW = 'src/components/dashboard/dashboard-analytics-view.tsx';
const AUTH_QUERIES = 'src/lib/dashboard/analytics-queries.ts';
const PREVIEW_PAGE = 'src/app/dashboard/preview/analytics/page.tsx';
const PREVIEW_VIEW = 'src/components/dashboard/preview-analytics-view.tsx';
const DEMO_DATA = 'src/lib/dashboard/analytics-data.ts';

describe('WS08-T011 preview analytics isolation', () => {
  it('keeps demo builders out of authenticated analytics and home', () => {
    const authPage = read(AUTH_ANALYTICS_PAGE);
    const homePage = read(AUTH_HOME_PAGE);
    const authView = read(AUTH_VIEW);
    const queries = read(AUTH_QUERIES);

    for (const source of [authPage, homePage, authView, queries]) {
      expect(source).not.toMatch(/from ['"]@\/lib\/dashboard\/analytics-data['"]/);
      expect(source).not.toMatch(/from ['"]@\/lib\/dashboard\/analytics-chart-data['"]/);
      expect(source).not.toMatch(/from ['"]@\/components\/dashboard\/preview-analytics-view['"]/);
      expect(source).not.toContain('buildAnalyticsData');
    }

    expect(authPage).toContain('loadOwnerAnalytics');
    expect(homePage).toContain('loadOwnerAnalytics');
  });

  it('keeps preview sample analytics labeled and off real query helpers', () => {
    const previewPage = read(PREVIEW_PAGE);
    const previewView = read(PREVIEW_VIEW);
    const demoData = read(DEMO_DATA);

    expect(previewPage).toContain('PreviewAnalyticsView');
    expect(previewPage).toContain('Preview demo sample analytics');
    expect(previewPage).not.toContain('loadOwnerAnalytics');
    expect(previewPage).not.toContain('loadOwnerAnalyticsTrends');

    expect(previewView).toContain('buildAnalyticsData');
    expect(previewView).toContain('preview workspace');
    expect(previewView).not.toContain('Preview · Demo sample');
    expect(previewView).not.toContain('fictional layout samples');
    expect(previewView).not.toContain('loadOwnerAnalytics');

    expect(demoData).toContain('Preview/demo sample analytics only');
    expect(demoData).toContain('Do not import `buildAnalyticsData` into authenticated');
  });
});

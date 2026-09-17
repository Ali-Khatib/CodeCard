import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EMPTY_STATE_COPY } from './empty-state-copy';
import { isAnalyticsTrendRange } from './analytics-trends';
import { PRO_ANALYTICS_SECTIONS } from './analytics-entitlement';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const AUTH_PAGE = 'src/app/dashboard/(authenticated)/analytics/page.tsx';
const AUTH_VIEW = 'src/components/dashboard/dashboard-analytics-view.tsx';
const TREND_CHART = 'src/components/dashboard/analytics/analytics-trend-chart.tsx';
const QUERIES = 'src/lib/dashboard/analytics-queries.ts';
const PREVIEW_PAGE = 'src/app/demo/(workspace)/analytics/page.tsx';
const PREVIEW_VIEW = 'src/components/dashboard/preview-analytics-view.tsx';
const DEMO_DATA = 'src/lib/dashboard/analytics-data.ts';

describe('Analytics product contract', () => {
  it('uses owner-scoped analytics_events aggregates, not demo builders', () => {
    const page = read(AUTH_PAGE);
    const view = read(AUTH_VIEW);
    const queries = read(QUERIES);

    expect(page).toContain('loadOwnerAnalytics');
    expect(page).toContain('loadOwnerAnalyticsTrends');
    expect(queries).toContain("from('analytics_events')");
    expect(queries).toContain("eq('owner_user_id', userId)");
    expect(queries).toContain("eq('profile_id', profile.id)");

    for (const source of [page, view, queries]) {
      expect(source).not.toContain('buildAnalyticsData');
      expect(source).not.toMatch(/from ['"]@\/lib\/dashboard\/analytics-data['"]/);
      expect(source).not.toContain('preview-analytics-view');
    }
  });

  it('empty state explains the product without a fake zero dashboard', () => {
    expect(EMPTY_STATE_COPY.analytics.title).toBe(
      'Your analytics will appear here once people start viewing your CodeCard.',
    );
    expect(EMPTY_STATE_COPY.analytics.description).toContain('Share your CodeCard');
    expect(EMPTY_STATE_COPY.analytics.viewCta).toBe('View CodeCard');
    expect(EMPTY_STATE_COPY.analytics.shareCta).toBe('Share CodeCard');

    const view = read(AUTH_VIEW);
    expect(view).toContain('EMPTY_STATE_COPY.analytics');
    expect(view).toContain('href="/dashboard#share"');
    expect(view).not.toContain('Lifetime public profile views');
    expect(view).toContain('!isZeroState');
    expect(view).toContain('AnalyticsTrendChart');

    const chart = read(TREND_CHART);
    expect(chart).toContain('rangeEmpty');
    expect(chart).toContain('!rangeEmpty');
  });

  it('surfaces verified attention metrics and withholds unsupported ones', () => {
    const view = read(AUTH_VIEW);
    expect(view).toContain('summary.profileViews');
    expect(view).toContain('summary.projectViews');
    expect(view).toContain('summary.researchViews');
    expect(view).toContain('summary.topProjects');
    expect(view).toContain('summary.sources');
    expect(view).toContain('entitlement.visitorInsights');
    expect(view).not.toContain('unique visitors');
    expect(view).not.toContain('AnalyticsGeoPanel');
    expect(view).not.toContain('AnalyticsAiInsights');
    expect(view).not.toContain('AnalyticsGuestStats');
  });

  it('keeps Pro gating truthful for visitor insights and per-paper rows', () => {
    expect(PRO_ANALYTICS_SECTIONS).toEqual(['visitorInsights', 'perResearchPaper']);
    const view = read(AUTH_VIEW);
    expect(view).toContain('data-analytics-pro-locked');
    expect(view).toContain('How people reach you');
    expect(view).toContain('Per research paper analytics');
  });

  it('keeps trend ranges to query-backed 7 and 30 UTC days', () => {
    expect(isAnalyticsTrendRange(7)).toBe(true);
    expect(isAnalyticsTrendRange(30)).toBe(true);
    expect(isAnalyticsTrendRange(90)).toBe(false);
    const chart = read(TREND_CHART);
    expect(chart).toContain('range=7');
    expect(chart).toContain('range=30');
    expect(chart).not.toContain('range=90');
  });

  it('keeps demo analytics labeled as sample and off the owner query path', () => {
    expect(existsSync(resolve(process.cwd(), PREVIEW_PAGE))).toBe(true);
    const previewPage = read(PREVIEW_PAGE);
    const previewView = read(PREVIEW_VIEW);
    const demoData = read(DEMO_DATA);

    expect(previewPage).toContain('Preview demo sample analytics');
    expect(previewPage).not.toContain('loadOwnerAnalytics');
    expect(previewView).toContain('Sample analytics');
    expect(previewView).toContain('not live visitor data');
    expect(previewView).toContain('buildAnalyticsData');
    expect(demoData).toContain('Preview/demo sample analytics only');
  });
});

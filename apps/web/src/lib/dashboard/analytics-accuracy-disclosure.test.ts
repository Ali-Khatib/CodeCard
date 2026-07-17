import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ANALYTICS_ACCURACY_DISCLOSURE_BODY,
  ANALYTICS_ACCURACY_DISCLOSURE_DETAILS,
  ANALYTICS_ACCURACY_DISCLOSURE_HEADLINE,
} from './analytics-accuracy-disclosure';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS10-T010 analytics accuracy disclosure', () => {
  it('exports concise approximate language aligned with implemented filtering', () => {
    expect(ANALYTICS_ACCURACY_DISCLOSURE_HEADLINE).toBe('Views are approximate.');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).toContain('approximate');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).toContain('owner activity');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).toContain('suspected bots');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).toContain('duplicate events');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).toContain('retention window');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).toContain('directional');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_BODY).not.toMatch(/perfectly accurate|real-time guaranteed|unique humans|legally auditable/i);

    expect(ANALYTICS_ACCURACY_DISCLOSURE_DETAILS).toContain('Owner self-views are excluded');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_DETAILS).toContain('Suspected bots may be filtered');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_DETAILS).toContain('Duplicate events may be suppressed');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_DETAILS).toContain('while the page is visible');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_DETAILS).not.toContain('WS08');
    expect(ANALYTICS_ACCURACY_DISCLOSURE_DETAILS).not.toContain('Redis');
  });

  it('renders disclosure on the authenticated analytics view for empty and populated states', () => {
    const view = read('src/components/dashboard/dashboard-analytics-view.tsx');
    const page = read('src/app/dashboard/(authenticated)/analytics/page.tsx');
    const queries = read('src/lib/dashboard/analytics-queries.ts');
    const preview = read('src/app/dashboard/preview/analytics/page.tsx');

    expect(view).toContain('ANALYTICS_ACCURACY_DISCLOSURE_HEADLINE');
    expect(view).toContain('ANALYTICS_ACCURACY_DISCLOSURE_BODY');
    expect(view).toContain('ANALYTICS_ACCURACY_DISCLOSURE_DETAILS');
    expect(view).toContain('aria-label="Analytics accuracy"');
    expect(view).toContain('<footer');
    expect(view).toContain('hasAnyEvents');
    expect(view).toContain('No audience activity yet');

    expect(page).toContain('DashboardAnalyticsView');
    expect(page).not.toContain('ANALYTICS_ACCURACY_DISCLOSURE');

    // Disclosure only — queries and preview demo charts unchanged.
    expect(queries).not.toContain('ANALYTICS_ACCURACY_DISCLOSURE');
    expect(preview).not.toContain('ANALYTICS_ACCURACY_DISCLOSURE');
    expect(view).not.toContain('buildAnalyticsData');
  });

  it('does not introduce a broken learn-more link or change collection code', () => {
    const view = read('src/components/dashboard/dashboard-analytics-view.tsx');
    const api = read('src/app/api/analytics/route.ts');
    const bot = read('src/lib/analytics/bot-filter.ts');
    const owner = read('src/lib/analytics/owner-exclusion.ts');

    expect(view).not.toMatch(/Learn more|href=.*ANALYTICS_RETENTION/i);
    expect(api).not.toContain('ANALYTICS_ACCURACY_DISCLOSURE');
    expect(bot).not.toContain('ANALYTICS_ACCURACY_DISCLOSURE');
    expect(owner).not.toContain('ANALYTICS_ACCURACY_DISCLOSURE');
  });
});

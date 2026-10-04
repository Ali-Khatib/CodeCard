import { describe, expect, it } from 'vitest';
import { PLANS } from '@codecard/config';
import type { OwnerAnalyticsSummary } from './analytics-aggregate';
import {
  ANALYTICS_REVIEW_FEATURE,
  buildOwnerAnalyticsReview,
  buildSampleAnalyticsReview,
} from './analytics-review';

function summary(overrides: Partial<OwnerAnalyticsSummary> = {}): OwnerAnalyticsSummary {
  return {
    profileId: 'p1',
    displayName: 'Alex',
    profileSlug: 'alex',
    isPublic: true,
    profileViews: 40,
    projectViews: 20,
    linkClicks: 4,
    profileShares: 1,
    qrDownloads: 1,
    researchViews: 0,
    pdfDownloads: 0,
    citationCopies: 0,
    projectTimeSpentSec: 120,
    researchTimeSpentSec: 0,
    sources: [],
    topProjects: [
      { id: 'a', title: 'DevFlow', views: 16, linkClicks: 3, timeSpentSec: 40 },
      { id: 'b', title: 'Pulse', views: 4, linkClicks: 1, timeSpentSec: 90 },
    ],
    topResearch: [],
    hasAnyEvents: true,
    viewerRoles: [],
    viewerRoleSampleSize: 0,
    ...overrides,
  };
}

describe('analytics review', () => {
  it('recommends the project people stay with when it is not the most opened', () => {
    const review = buildOwnerAnalyticsReview(summary());
    expect(review.moveUp?.title).toBe('Pulse');
    expect(review.highlight).toContain('Pulse');
    expect(review.moveUp?.reason).toContain('DevFlow');
    expect(review.trafficMeaning).toMatch(/opening work|tap a link/i);
  });

  it('keeps the most-opened project first when stay time agrees', () => {
    const review = buildOwnerAnalyticsReview(
      summary({
        topProjects: [
          { id: 'a', title: 'DevFlow', views: 20, linkClicks: 3, timeSpentSec: 120 },
          { id: 'b', title: 'Pulse', views: 4, linkClicks: 1, timeSpentSec: 20 },
        ],
      }),
    );
    expect(review.moveUp?.title).toBe('DevFlow');
    expect(review.lines.some((line) => line.includes('Pulse') && line.includes('quieter'))).toBe(
      true,
    );
  });

  it('explains card views with no project opens in plain language', () => {
    const review = buildOwnerAnalyticsReview(
      summary({
        profileViews: 30,
        projectViews: 0,
        topProjects: [],
      }),
    );
    expect(review.trafficMeaning).toContain('did not open a project');
    expect(review.highlight).toMatch(/looks|Share the card/);
    expect(review.moveUp).toBeNull();
  });

  it('mentions a recorded source when one is present', () => {
    const review = buildOwnerAnalyticsReview(
      summary({
        sources: [{ label: 'QR scan', value: 12, pct: 60 }],
        researchViews: 5,
      }),
    );
    expect(review.lines.join(' ')).toContain('QR scan');
    expect(review.lines.join(' ')).toContain('Research was opened 5 times');
  });

  it('keeps the sample review human and specific to demo projects', () => {
    const sample = buildSampleAnalyticsReview();
    expect(sample.highlight).toContain('DevFlow');
    expect(sample.moveUp?.title).toBe('DevFlow');
    expect(sample.trafficMeaning).toMatch(/GitHub|QR|LinkedIn/);
    expect(sample.lines.join(' ')).toContain('SchemaSync');
    expect(sample.highlight + sample.trafficMeaning + sample.lines.join(' ')).not.toMatch(/\bPro\b/);
    expect(sample.trafficMeaning).not.toMatch(/intent|click through|CTR/i);
  });

  it('lists the review on the paid plan', () => {
    expect(PLANS.pro.features).toContain(ANALYTICS_REVIEW_FEATURE);
    expect(PLANS.free.features).not.toContain(ANALYTICS_REVIEW_FEATURE);
  });
});

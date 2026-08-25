import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  analyticsEntitlementFor,
  applyAnalyticsEntitlement,
} from './analytics-entitlement';
import { loadOwnerAnalytics } from './analytics-queries';
import type { OwnerAnalyticsSummary } from './analytics-aggregate';

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_ID = '22222222-2222-4222-8222-222222222222';
const PRO_PRICE_ID = 'price_test_pro_entitlement';

function summaryFixture(): OwnerAnalyticsSummary {
  return {
    profileId: PROFILE_ID,
    displayName: 'Alex',
    profileSlug: 'alex',
    isPublic: true,
    profileViews: 10,
    projectViews: 4,
    linkClicks: 2,
    profileShares: 1,
    qrDownloads: 1,
    researchViews: 3,
    pdfDownloads: 2,
    citationCopies: 1,
    projectTimeSpentSec: 120,
    researchTimeSpentSec: 90,
    sources: [{ label: 'Search', value: 6, pct: 60 }],
    topProjects: [
      { id: 'p1', title: 'Proj', views: 4, linkClicks: 2, timeSpentSec: 120 },
    ],
    topResearch: [
      {
        id: 'r1',
        title: 'Paper',
        views: 3,
        pdfDownloads: 2,
        citationCopies: 1,
        timeSpentSec: 90,
        avgReadTimeSec: 30,
      },
    ],
    hasAnyEvents: true,
  } as OwnerAnalyticsSummary;
}

describe('analyticsEntitlementFor', () => {
  it('grants no Pro analytics sections on the free plan', () => {
    expect(analyticsEntitlementFor('free')).toEqual({
      planId: 'free',
      visitorInsights: false,
      perResearchPaper: false,
    });
  });

  it('grants every Pro analytics section on the pro plan', () => {
    expect(analyticsEntitlementFor('pro')).toEqual({
      planId: 'pro',
      visitorInsights: true,
      perResearchPaper: true,
    });
  });
});

describe('applyAnalyticsEntitlement', () => {
  it('strips visitor insights and per-paper rows on free', () => {
    const gated = applyAnalyticsEntitlement(
      summaryFixture(),
      analyticsEntitlementFor('free'),
    );
    expect(gated.sources).toEqual([]);
    expect(gated.topResearch).toEqual([]);
  });

  it('keeps free-tier basic analytics intact', () => {
    const gated = applyAnalyticsEntitlement(
      summaryFixture(),
      analyticsEntitlementFor('free'),
    );
    expect(gated.profileViews).toBe(10);
    expect(gated.projectViews).toBe(4);
    expect(gated.researchViews).toBe(3);
    expect(gated.topProjects).toHaveLength(1);
  });

  it('preserves Pro sections on pro', () => {
    const gated = applyAnalyticsEntitlement(
      summaryFixture(),
      analyticsEntitlementFor('pro'),
    );
    expect(gated.sources).toHaveLength(1);
    expect(gated.topResearch).toHaveLength(1);
  });

  it('does not mutate the input summary', () => {
    const original = summaryFixture();
    applyAnalyticsEntitlement(original, analyticsEntitlementFor('free'));
    expect(original.sources).toHaveLength(1);
    expect(original.topResearch).toHaveLength(1);
  });
});

/* ---- Loader integration: the gate must be applied server-side ---- */

type QueryResult = { data: unknown; error?: unknown | null };

function makeBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {
    maybeSingle: vi.fn(async () => ({
      data: result.data,
      error: result.error ?? null,
    })),
    then(onFulfilled: (value: QueryResult) => unknown) {
      return Promise.resolve(onFulfilled({ data: result.data, error: result.error ?? null }));
    },
  };
  for (const method of ['select', 'eq', 'in', 'gte', 'lt', 'order']) {
    builder[method] = vi.fn(() => builder);
  }
  return builder;
}

function supabaseFor(subscription: unknown) {
  const profile = makeBuilder({
    data: {
      id: PROFILE_ID,
      display_name: 'Alex',
      is_public: true,
      slug: 'alex',
      tenant_id: TENANT_ID,
    },
  });
  const sources = makeBuilder({ data: [{ source: 'search' }] });
  const subs = makeBuilder({ data: subscription });
  const empty = makeBuilder({ data: [] });

  const from = vi.fn((table: string) => {
    if (table === 'profiles') return profile;
    if (table === 'subscriptions') return subs;
    if (table === 'public_profile_events') return sources;
    return empty;
  });
  return { from } as unknown as Parameters<typeof loadOwnerAnalytics>[0];
}

describe('loadOwnerAnalytics plan gating', () => {
  const previous = process.env.STRIPE_PRO_PRICE_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRO_PRICE_ID = PRO_PRICE_ID;
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.STRIPE_PRO_PRICE_ID;
    else process.env.STRIPE_PRO_PRICE_ID = previous;
  });

  it('withholds visitor insights from a free tenant', async () => {
    const result = await loadOwnerAnalytics(supabaseFor(null), OWNER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entitlement.planId).toBe('free');
    expect(result.entitlement.visitorInsights).toBe(false);
    expect(result.summary.sources).toEqual([]);
  });

  it('serves visitor insights to an active Pro tenant', async () => {
    const supabase = supabaseFor({ status: 'active', stripe_price_id: PRO_PRICE_ID });
    const result = await loadOwnerAnalytics(supabase, OWNER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entitlement.planId).toBe('pro');
    expect(result.summary.sources.length).toBeGreaterThan(0);
  });

  it('does not grant Pro for an active subscription on a non-allowlisted price', async () => {
    const supabase = supabaseFor({ status: 'active', stripe_price_id: 'price_someone_elses' });
    const result = await loadOwnerAnalytics(supabase, OWNER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entitlement.planId).toBe('free');
    expect(result.summary.sources).toEqual([]);
  });

  it('does not grant Pro for a canceled subscription on the allowlisted price', async () => {
    const supabase = supabaseFor({ status: 'canceled', stripe_price_id: PRO_PRICE_ID });
    const result = await loadOwnerAnalytics(supabase, OWNER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entitlement.planId).toBe('free');
  });

  it('exposes full data when the gate is explicitly disabled for data export', async () => {
    const result = await loadOwnerAnalytics(supabaseFor(null), OWNER_ID, {
      applyPlanGate: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entitlement.planId).toBe('free');
    expect(result.summary.sources.length).toBeGreaterThan(0);
  });
});

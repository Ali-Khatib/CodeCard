import { createClient } from '@/lib/supabase/server';
import { DashboardAnalyticsView } from '@/components/dashboard/dashboard-analytics-view';
import {
  loadOwnerAnalytics,
  loadOwnerAnalyticsTrends,
} from '@/lib/dashboard/analytics-queries';
import { isAnalyticsTrendRange, type AnalyticsTrendRange } from '@/lib/dashboard/analytics-trends';
import { AppCard, PageHeader } from '@/components/dashboard/ui/dashboard-ui';
import Link from 'next/link';

type SearchParams = Promise<{ range?: string }>;

function parseRange(raw: string | undefined): AnalyticsTrendRange {
  const n = raw ? Number(raw) : 30;
  return isAnalyticsTrendRange(n) ? n : 30;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const range = parseRange(params.range);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [result, trendsResult] = await Promise.all([
    loadOwnerAnalytics(supabase, user?.id),
    loadOwnerAnalyticsTrends(supabase, user?.id, range),
  ]);

  if (!result.ok) {
    if (result.reason === 'no_profile') {
      return (
        <div className="cc-app-page cc-app-page--1040 space-y-6">
          <PageHeader
            title="Analytics"
            description="Audience engagement appears after you create and publish a CodeCard."
          />
          <AppCard className="!p-6">
            <p className="text-[15px] text-[var(--app-smoke)]">
              Set up your profile first, then share it to start collecting analytics.
            </p>
            <Link
              href="/dashboard/profile"
              className="mt-4 inline-flex text-[14px] font-medium text-[var(--app-iris)] underline-offset-2 hover:underline"
            >
              Go to profile
            </Link>
          </AppCard>
        </div>
      );
    }

    return (
      <div className="cc-app-page cc-app-page--1040 space-y-6">
        <PageHeader
          title="Analytics"
          description="We could not load your analytics right now."
        />
        <AppCard tone="rose" className="!p-6">
          <p className="text-[15px] text-[var(--app-ink)]">
            Analytics failed to load. Try again in a moment — other dashboard pages remain available.
          </p>
        </AppCard>
      </div>
    );
  }

  if (!trendsResult.ok) {
    return (
      <div className="cc-app-page cc-app-page--1040 space-y-6">
        <PageHeader
          title="Analytics"
          description="We could not load your trend data right now."
        />
        <AppCard tone="rose" className="!p-6">
          <p className="text-[15px] text-[var(--app-ink)]">
            Trend queries failed. Lifetime totals were not shown to avoid mixing incomplete data.
          </p>
        </AppCard>
      </div>
    );
  }

  return (
    <DashboardAnalyticsView
      summary={result.summary}
      trends={trendsResult.trends}
      profileSlug={result.summary.profileSlug}
    />
  );
}

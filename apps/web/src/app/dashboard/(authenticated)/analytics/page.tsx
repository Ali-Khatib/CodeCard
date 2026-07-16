import { createClient } from '@/lib/supabase/server';
import { DashboardAnalyticsView } from '@/components/dashboard/dashboard-analytics-view';
import { loadOwnerAnalytics } from '@/lib/dashboard/analytics-queries';
import { AppCard, PageHeader } from '@/components/dashboard/ui/dashboard-ui';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await loadOwnerAnalytics(supabase, user?.id);

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

  return (
    <DashboardAnalyticsView
      summary={result.summary}
      profileSlug={result.summary.profileSlug}
    />
  );
}

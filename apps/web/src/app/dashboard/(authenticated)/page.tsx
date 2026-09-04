import { createClient } from '@/lib/supabase/server';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { DashboardOverviewView } from '@/components/dashboard/dashboard-overview-view';
import {
  DashboardOverviewLoadErrorState,
  DashboardOverviewMissingState,
} from '@/components/dashboard/dashboard-overview-route-states';
import { loadOwnerAnalytics } from '@/lib/dashboard/analytics-queries';
import { loadOwnerOverviewContent } from '@/lib/dashboard/overview-queries';
import { overviewCircleWorksFromAuthFeed } from '@/lib/dashboard/overview-circle-works';
import type { OverviewCircleWorksEmpty } from '@/lib/dashboard/overview-circle-works';
import { listCircleFeed } from '@/lib/circle/circle-feed-core';
import { getProfileCompletionNextStep } from '@/lib/profile/completion';
import { loadProfileCompletion } from '@/lib/profile/completion-data';

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, tenant_id, owner_user_id, slug, display_name, headline, bio, avatar_url, location, skills, is_public, created_at, updated_at',
    )
    .eq('owner_user_id', user!.id)
    .single();

  if (profileError) {
    return <DashboardOverviewLoadErrorState />;
  }

  if (!profile) {
    return <DashboardOverviewMissingState />;
  }

  const [completionResult, analyticsResult, contentResult, circleFeed] = await Promise.all([
    loadProfileCompletion(supabase, profile),
    loadOwnerAnalytics(supabase, user!.id),
    loadOwnerOverviewContent(supabase, user!.id),
    listCircleFeed(supabase, { limit: 3, filter: 'all' }),
  ]);

  if (!completionResult.ok) {
    return <DashboardOverviewLoadErrorState />;
  }

  const { data: linkRows } = await supabase
    .from('profile_links')
    .select('id, type, label, url, sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  const profileLinks = linkRows ?? [];
  const links = profileLinks.map((l) => ({
    type: l.type,
    label: l.label,
    url: l.url,
  }));

  const completion = completionResult.completion;
  const suggested = getProfileCompletionNextStep(completion, {
    hasAnyProject: completionResult.hasAnyProject,
  });
  const displayName = profile.display_name ?? user?.email?.split('@')[0] ?? 'there';

  const statsError = !analyticsResult.ok;
  const stats = analyticsResult.ok
    ? {
        profileViews: analyticsResult.summary.profileViews,
        projectOpens: analyticsResult.summary.projectViews,
        linkClicks: analyticsResult.summary.linkClicks,
        qrDownloads: analyticsResult.summary.qrDownloads,
      }
    : null;

  const contentError = !contentResult.ok;
  const projectsSummary = contentResult.ok ? contentResult.projects : null;
  const researchSummary = contentResult.ok ? contentResult.research : null;

  let circleWorks = overviewCircleWorksFromAuthFeed(
    circleFeed.status === 'feed' ? circleFeed.items : [],
    3,
  );
  let circleWorksEmpty: OverviewCircleWorksEmpty = 'none';
  if (circleWorks.length === 0) {
    if (circleFeed.status === 'no_connections') {
      circleWorksEmpty = 'no_connections';
    } else if (
      circleFeed.status === 'temporary_failure' ||
      circleFeed.status === 'unauthenticated' ||
      circleFeed.status === 'invalid_cursor'
    ) {
      circleWorksEmpty = 'error';
    }
  }

  return (
    <DashboardOverviewView
      greeting={greetingForHour()}
      displayName={displayName}
      completion={completion}
      profileSlug={profile.slug}
      avatarUrl={profile.avatar_url}
      headline={profile.headline}
      bio={profile.bio}
      profileViews={stats?.profileViews}
      links={links}
      profileLinks={profileLinks}
      profile={profile}
      stats={stats}
      statsError={statsError}
      projectsSummary={projectsSummary}
      researchSummary={researchSummary}
      contentError={contentError}
      circleWorks={circleWorks}
      circleWorksEmpty={circleWorksEmpty}
      suggested={suggested}
    />
  );
}

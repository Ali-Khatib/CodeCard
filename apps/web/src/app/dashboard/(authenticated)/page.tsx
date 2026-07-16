import { createClient } from '@/lib/supabase/server';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { DashboardOverviewView } from '@/components/dashboard/dashboard-overview-view';
import {
  DashboardOverviewLoadErrorState,
  DashboardOverviewMissingState,
} from '@/components/dashboard/dashboard-overview-route-states';
import { loadOwnerAnalytics } from '@/lib/dashboard/analytics-queries';
import { loadOwnerOverviewContent } from '@/lib/dashboard/overview-queries';
import { getProfileCompletionNextStep } from '@/lib/profile/completion';
import { loadProfileCompletion } from '@/lib/profile/completion-data';

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('owner_user_id', user!.id)
    .single();

  if (profileError) {
    return <DashboardOverviewLoadErrorState />;
  }

  if (!profile) {
    return <DashboardOverviewMissingState />;
  }

  const [completionResult, analyticsResult, contentResult] = await Promise.all([
    loadProfileCompletion(supabase, profile),
    loadOwnerAnalytics(supabase, user!.id),
    loadOwnerOverviewContent(supabase, user!.id),
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
      profile={profile}
      stats={stats}
      statsError={statsError}
      projectsSummary={projectsSummary}
      researchSummary={researchSummary}
      contentError={contentError}
      activity={[]}
      suggested={suggested}
    />
  );
}

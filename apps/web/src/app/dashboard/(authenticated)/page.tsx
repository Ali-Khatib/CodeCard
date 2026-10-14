import { createClient } from '@/lib/supabase/server';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { DashboardOverviewView } from '@/components/dashboard/dashboard-overview-view';
import {
  DashboardOverviewLoadErrorState,
  DashboardOverviewMissingState,
} from '@/components/dashboard/dashboard-overview-route-states';
import { getHomeWorkspaceNextStep } from '@/lib/profile/completion';
import { loadProfileCompletion } from '@/lib/profile/completion-data';
import { loadHomeSchedule } from '@/lib/schedule/home-schedule-core';
import { loadOwnerProfile, OWNER_HOME_PROFILE_COLUMNS } from '@/lib/profile/owner-profile';
import type { Profile } from '@codecard/types';

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { profile, error: profileError } = await loadOwnerProfile<Profile>(
    supabase,
    user!.id,
    OWNER_HOME_PROFILE_COLUMNS,
  );

  if (profileError) {
    return <DashboardOverviewLoadErrorState />;
  }

  if (!profile) {
    return <DashboardOverviewMissingState />;
  }

  const [completionResult, schedule, linksResult, connectionsResult] = await Promise.all([
    loadProfileCompletion(supabase, profile),
    loadHomeSchedule(supabase, { user: user! }),
    supabase
      .from('profile_links')
      .select('id, type, label, url, sort_order')
      .eq('profile_id', profile.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('saved_connections')
      .select('saved_profile_id', { count: 'exact', head: true })
      .eq('owner_user_id', user!.id),
  ]);

  if (!completionResult.ok) {
    return <DashboardOverviewLoadErrorState />;
  }

  const linkRows = linksResult.data;

  const profileLinks = linkRows ?? [];
  const links = profileLinks.map((l) => ({
    type: l.type,
    label: l.label,
    url: l.url,
  }));

  const completion = completionResult.completion;
  const suggested = getHomeWorkspaceNextStep(completion, {
    hasAnyProject: completionResult.hasAnyProject,
    isPublic: profile.is_public === true,
  });
  const displayName = profile.display_name ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <DashboardOverviewView
      greeting={greetingForHour()}
      displayName={displayName}
      completion={completion}
      profileSlug={profile.slug}
      avatarUrl={profile.avatar_url}
      headline={profile.headline}
      bio={profile.bio}
      links={links}
      profileLinks={profileLinks}
      profile={profile}
      stats={null}
      projectsSummary={null}
      researchSummary={null}
      suggested={suggested}
      hasAnyProject={completionResult.hasAnyProject}
      events={schedule.events}
      followUps={schedule.followUps}
      scheduleError={Boolean(schedule.code)}
      connectionCount={connectionsResult.error ? null : (connectionsResult.count ?? 0)}
    />
  );
}

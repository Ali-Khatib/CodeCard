import { createClient } from '@/lib/supabase/server';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { DashboardOverviewView } from '@/components/dashboard/dashboard-overview-view';
import {
  DashboardOverviewLoadErrorState,
  DashboardOverviewMissingState,
} from '@/components/dashboard/dashboard-overview-route-states';
import { DEMO_OVERVIEW_ACTIVITY } from '@/lib/dashboard/workspace-demo';
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

  const completionResult = await loadProfileCompletion(supabase, profile);
  if (!completionResult.ok) {
    return <DashboardOverviewLoadErrorState />;
  }

  const { count: profileViews } = await supabase
    .from('public_profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  const { count: projectViews } = await supabase
    .from('project_view_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

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

  return (
    <DashboardOverviewView
      greeting={greetingForHour()}
      displayName={displayName}
      completion={completion}
      profileSlug={profile.slug}
      avatarUrl={profile.avatar_url}
      headline={profile.headline}
      bio={profile.bio}
      profileViews={profileViews ?? 0}
      links={links}
      profile={profile}
      stats={{
        profileViews: profileViews || 1284,
        projectOpens: projectViews || 342,
        saves: 47,
        qrScans: 128,
      }}
      activity={DEMO_OVERVIEW_ACTIVITY}
      suggested={suggested}
    />
  );
}

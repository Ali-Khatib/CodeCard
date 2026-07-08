import { createClient } from '@/lib/supabase/server';
import { DashboardAnalyticsView } from '@/components/dashboard/dashboard-analytics-view';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('owner_user_id', user!.id)
    .single();

  const { count: profileViews } = await supabase
    .from('public_profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '');

  const { count: projectViews } = await supabase
    .from('project_view_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '');

  const displayName =
    profile?.display_name ?? user!.email?.split('@')[0] ?? 'there';

  return (
    <DashboardAnalyticsView
      displayName={displayName}
      profileViews={profileViews ?? undefined}
      projectViews={projectViews ?? undefined}
    />
  );
}

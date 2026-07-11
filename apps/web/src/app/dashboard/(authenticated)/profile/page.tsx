import { createClient } from '@/lib/supabase/server';
import { profileCompletion } from '@/lib/dashboard/profile-completion';
import { DashboardProfileView } from '@/components/dashboard/dashboard-profile-view';
import {
  ProfileEditorLoadErrorState,
  ProfileEditorMissingState,
} from '@/components/profile/profile-editor-route-states';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

export default async function DashboardProfilePage() {
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
    return <ProfileEditorLoadErrorState />;
  }

  if (!profile) {
    return <ProfileEditorMissingState />;
  }

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  const { count: profileViews } = await supabase
    .from('public_profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  const { data: linkRows, error: linksError } = await supabase
    .from('profile_links')
    .select('id, type, label, url, sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  if (linksError) {
    return <ProfileEditorLoadErrorState />;
  }

  const profileLinks = linkRows ?? [];
  const links: ProfileLinkItem[] = profileLinks.map((link) => ({
    type: link.type,
    label: link.label,
    url: link.url,
  }));

  const completion = profileCompletion(profile, projectCount ?? 0, profileLinks.length);

  return (
    <DashboardProfileView
      profile={profile}
      profileLinks={profileLinks}
      completion={completion}
      profileViews={profileViews ?? 0}
      links={links}
    />
  );
}

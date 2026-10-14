import { createClient } from '@/lib/supabase/server';
import { ProfileEditorScreen } from '@/components/dashboard/profile-editor-screen';
import {
  ProfileEditorLoadErrorState,
  ProfileEditorMissingState,
} from '@/components/profile/profile-editor-route-states';
import { loadOwnerProfile, OWNER_HOME_PROFILE_COLUMNS } from '@/lib/profile/owner-profile';
import type { Profile } from '@codecard/types';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { profile, error } = await loadOwnerProfile<Profile>(
    supabase,
    user!.id,
    OWNER_HOME_PROFILE_COLUMNS,
  );

  if (error) return <ProfileEditorLoadErrorState />;
  if (!profile) return <ProfileEditorMissingState />;

  const { data: links } = await supabase
    .from('profile_links')
    .select('id, type, label, url, sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  return <ProfileEditorScreen profile={profile} links={(links ?? []) as ProfileLinkRow[]} />;
}

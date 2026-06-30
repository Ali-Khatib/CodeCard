import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileEditor } from '@/components/profile-editor';

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('owner_user_id', user!.id)
    .single();

  if (!profile) redirect('/dashboard/projects');

  return (
    <div className="space-y-6">
      <div>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Profile</p>
        <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Edit profile</h1>
        <p className="mt-2 max-w-lg text-[15px] text-lichen">
          Name, headline, links, and the identity visitors see in the first 30 seconds.
        </p>
      </div>

      <div className="cc-workspace-tile rounded-[10px] border border-border/40 p-5 md:p-6">
        <ProfileEditor profile={profile} />
      </div>
    </div>
  );
}

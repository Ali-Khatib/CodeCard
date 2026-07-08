import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSettingsView } from '@/components/dashboard/dashboard-settings-view';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return <DashboardSettingsView email={user!.email ?? undefined} signOutAction={signOut} />;
}

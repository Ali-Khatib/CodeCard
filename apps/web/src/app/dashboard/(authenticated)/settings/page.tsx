import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSettingsView } from '@/components/dashboard/dashboard-settings-view';
import type { AccountDeletionAuthMode } from '@/components/dashboard/account-deletion-dialog';

const OAUTH_PROVIDERS = new Set(['github', 'google']);

function resolveDeletionAuth(user: {
  identities?: { provider?: string }[] | null;
  app_metadata?: Record<string, unknown> | null;
}): AccountDeletionAuthMode {
  const identities = user.identities ?? [];
  const hasPassword = identities.some((identity) => identity.provider === 'email');
  const oauthFromIdentities = identities
    .map((identity) => identity.provider)
    .find((provider): provider is 'github' | 'google' =>
      provider === 'github' || provider === 'google',
    );

  if (oauthFromIdentities) {
    return { hasPassword, oauthProvider: oauthFromIdentities };
  }

  const metaProvider = String(user.app_metadata?.provider ?? '');
  if (OAUTH_PROVIDERS.has(metaProvider)) {
    return {
      hasPassword,
      oauthProvider: metaProvider as 'github' | 'google',
    };
  }

  return { hasPassword, oauthProvider: null };
}

type SettingsPageProps = {
  searchParams?: Promise<{ delete?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
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

  const params = searchParams ? await searchParams : {};
  const openDeletion = params.delete === '1';

  return (
    <DashboardSettingsView
      email={user!.email ?? undefined}
      signOutAction={signOut}
      accountControls="live"
      deletionAuth={resolveDeletionAuth(user!)}
      openDeletionOnMount={openDeletion}
    />
  );
}

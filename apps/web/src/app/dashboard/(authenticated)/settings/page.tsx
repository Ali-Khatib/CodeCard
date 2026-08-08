import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSettingsView } from '@/components/dashboard/dashboard-settings-view';
import type { AccountDeletionAuthMode } from '@/components/dashboard/account-deletion-dialog';
import { resolveAccountPlanId } from '@/lib/billing/current-plan';

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

function resolveProviders(user: {
  identities?: { provider?: string }[] | null;
}): { hasPassword: boolean; googleConnected: boolean; githubConnected: boolean } {
  const identities = user.identities ?? [];
  const providers = new Set(identities.map((identity) => identity.provider));
  return {
    hasPassword: providers.has('email'),
    googleConnected: providers.has('google'),
    githubConnected: providers.has('github'),
  };
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
  const providers = resolveProviders(user!);

  const [{ data: subscription }, { data: profile }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user!.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('slug, is_public')
      .eq('owner_user_id', user!.id)
      .maybeSingle(),
  ]);

  return (
    <DashboardSettingsView
      email={user!.email ?? undefined}
      plan={resolveAccountPlanId(subscription?.status)}
      profileSlug={profile?.slug}
      isPublic={Boolean(profile?.is_public)}
      hasPassword={providers.hasPassword}
      googleConnected={providers.googleConnected}
      githubConnected={providers.githubConnected}
      signOutAction={signOut}
      accountControls="live"
      deletionAuth={resolveDeletionAuth(user!)}
      openDeletionOnMount={openDeletion}
    />
  );
}

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { userNeedsEmailVerification } from '@/lib/auth/email-verification';
import { userHasPasswordRecoveryPrivilege } from '@/lib/auth/recovery-session';
import { buildSignInHref } from '@/lib/auth/session-expiry';
import { getCircleUnreadSummary } from '@/lib/circle/circle-read-state-core';
import { getHomeLoopState } from '@/lib/profile/completion';
import { loadProfileCompletion } from '@/lib/profile/completion-data';

export default async function AuthenticatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const pathname = (await headers()).get('x-pathname') ?? '/dashboard';
    redirect(buildSignInHref(pathname));
  }

  if (userHasPasswordRecoveryPrivilege(user)) {
    redirect('/reset-password');
  }

  const [{ data: profile }, circleUnread] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, slug, display_name, avatar_url, headline, bio, is_public')
      .eq('owner_user_id', user.id)
      .single(),
    getCircleUnreadSummary(supabase),
  ]);

  const completionResult = profile
    ? await loadProfileCompletion(supabase, profile)
    : { ok: false as const, error: 'missing' };

  const homeLoopState =
    completionResult.ok && profile
      ? getHomeLoopState(completionResult.completion, {
          hasAnyProject: completionResult.hasAnyProject,
          isPublic: profile.is_public === true,
        })
      : null;

  return (
    <DashboardShell
      profileSlug={profile?.slug}
      displayName={profile?.display_name ?? user.email?.split('@')[0]}
      email={user.email}
      avatarUrl={profile?.avatar_url}
      emailVerificationRequired={userNeedsEmailVerification(user)}
      circleUnreadBadge={circleUnread.badgeLabel}
      homeLoopState={homeLoopState}
    >
      {children}
    </DashboardShell>
  );
}

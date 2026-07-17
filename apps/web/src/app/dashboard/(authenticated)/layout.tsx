import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { userNeedsEmailVerification } from '@/lib/auth/email-verification';
import { buildSignInHref } from '@/lib/auth/session-expiry';
import { getCircleUnreadSummary } from '@/lib/circle/circle-read-state-core';

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

  const [{ data: profile }, circleUnread] = await Promise.all([
    supabase
      .from('profiles')
      .select('slug, display_name, avatar_url')
      .eq('owner_user_id', user.id)
      .single(),
    getCircleUnreadSummary(supabase),
  ]);

  return (
    <DashboardShell
      profileSlug={profile?.slug}
      displayName={profile?.display_name ?? user.email?.split('@')[0]}
      email={user.email}
      avatarUrl={profile?.avatar_url}
      emailVerificationRequired={userNeedsEmailVerification(user)}
      circleUnreadBadge={circleUnread.badgeLabel}
    >
      {children}
    </DashboardShell>
  );
}

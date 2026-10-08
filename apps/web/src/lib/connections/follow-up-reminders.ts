import type { SupabaseClient } from '@supabase/supabase-js';
import { CONNECTIONS_TABLE } from '@/lib/connections/connections-contract';
import {
  getAuthenticatedUser,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';
import type { DashboardNotification } from '@/lib/dashboard/notifications-demo';
import { formatNotificationTime } from '@/lib/dashboard/live-notifications';

export type FollowUpReminder = {
  connectionId: string;
  displayName: string;
  followUpAt: string;
};

export async function listDueFollowUpReminders(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null; now?: Date },
): Promise<{ reminders: FollowUpReminder[]; error?: string }> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return { reminders: [], error: 'UNAUTHENTICATED' };

  const now = options?.now ?? new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 7);

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select(
      `
      id,
      follow_up_at,
      saved_profile:saved_profile_id ( display_name )
    `,
    )
    .eq('owner_user_id', user.id)
    .not('follow_up_at', 'is', null)
    .lte('follow_up_at', horizon.toISOString())
    .order('follow_up_at', { ascending: true })
    .limit(12);

  if (error) return { reminders: [], error: 'TEMPORARY_FAILURE' };

  const reminders: FollowUpReminder[] = [];
  for (const row of data ?? []) {
    const followUpAt = row.follow_up_at as string | null;
    if (!followUpAt) continue;
    const profile = row.saved_profile as { display_name?: string | null } | null;
    reminders.push({
      connectionId: row.id as string,
      displayName: profile?.display_name?.trim() || 'Connection',
      followUpAt,
    });
  }

  return { reminders };
}

/** Accepted QR connections that still have no place, time, or later-reminder. */
export async function listConnectionDetailNudges(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null; now?: Date },
): Promise<{ reminders: FollowUpReminder[]; error?: string }> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return { reminders: [], error: 'UNAUTHENTICATED' };

  const now = options?.now ?? new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 14);

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select(
      `
      id,
      connected_at,
      saved_profile:saved_profile_id ( display_name )
    `,
    )
    .eq('owner_user_id', user.id)
    .eq('source', 'qr')
    .is('context', null)
    .is('met_at', null)
    .is('follow_up_at', null)
    .gte('connected_at', since.toISOString())
    .order('connected_at', { ascending: false })
    .limit(8);

  if (error) return { reminders: [], error: 'TEMPORARY_FAILURE' };

  const reminders: FollowUpReminder[] = [];
  for (const row of data ?? []) {
    const connectedAt = row.connected_at as string | null;
    if (!connectedAt) continue;
    const profile = row.saved_profile as { display_name?: string | null } | null;
    reminders.push({
      connectionId: row.id as string,
      displayName: profile?.display_name?.trim() || 'Connection',
      followUpAt: connectedAt,
    });
  }

  return { reminders };
}

export function detailNudgesToNotifications(
  reminders: FollowUpReminder[],
  now = Date.now(),
): DashboardNotification[] {
  return reminders.map((item) => ({
    id: `details-${item.connectionId}`,
    type: 'save' as const,
    title: `You connected with ${item.displayName}`,
    body: 'Add where you met, when, and a note. It stays here until you do.',
    time: formatNotificationTime(item.followUpAt, now),
    unread: true,
    href: `details:${item.connectionId}:${encodeURIComponent(item.displayName)}`,
  }));
}

export function followUpsToNotifications(
  reminders: FollowUpReminder[],
  _basePath: string,
  now = Date.now(),
): DashboardNotification[] {
  return reminders.map((item) => {
    const due = new Date(item.followUpAt).getTime() <= now;
    return {
      id: `followup-${item.connectionId}`,
      type: 'activity' as const,
      title: due
        ? `Follow up with ${item.displayName}`
        : `Reminder: ${item.displayName}`,
      body: 'You chose “Do later” — finish where you met, when, and a note.',
      time: formatNotificationTime(item.followUpAt, now),
      unread: true,
      href: `details:${item.connectionId}:${encodeURIComponent(item.displayName)}`,
    };
  });
}

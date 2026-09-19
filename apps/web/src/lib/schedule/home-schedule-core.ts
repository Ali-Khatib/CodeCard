import type { SupabaseClient } from '@supabase/supabase-js';
import { CONNECTIONS_TABLE } from '@/lib/connections/connections-contract';
import {
  getAuthenticatedUser,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';
import {
  listOwnerUpcomingEvents,
  type OwnerEvent,
  type OwnerEventErrorCode,
  ownerEventErrorMessage,
} from '@/lib/schedule/owner-events-core';

export type HomeFollowUp = {
  connectionId: string;
  personName: string;
  context: string | null;
  followUpAt: string;
};

export type HomeScheduleResult = {
  events: OwnerEvent[];
  followUps: HomeFollowUp[];
  error?: string;
  code?: OwnerEventErrorCode;
};

type FollowUpProfile = {
  display_name: string | null;
  slug: string | null;
};

export async function loadHomeSchedule(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<HomeScheduleResult> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      events: [],
      followUps: [],
      error: ownerEventErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const eventsResult = await listOwnerUpcomingEvents(supabase, { user });
  if (eventsResult.code) {
    return {
      events: [],
      followUps: [],
      error: eventsResult.error,
      code: eventsResult.code,
    };
  }

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select(
      `
      id,
      follow_up_at,
      context,
      saved_profile:saved_profile_id (
        display_name,
        slug
      )
    `,
    )
    .eq('owner_user_id', user.id)
    .not('follow_up_at', 'is', null)
    .order('follow_up_at', { ascending: true })
    .limit(20);

  if (error) {
    return {
      events: eventsResult.events,
      followUps: [],
      error: ownerEventErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }

  const followUps: HomeFollowUp[] = (data ?? []).flatMap((row) => {
    const followUpAt = row.follow_up_at as string | null;
    if (!followUpAt) return [];
    const saved = row.saved_profile as FollowUpProfile | FollowUpProfile[] | null;
    const profile = Array.isArray(saved) ? saved[0] : saved;
    const personName = profile?.display_name?.trim() || 'Connection';
    return [
      {
        connectionId: row.id as string,
        personName,
        context: (row.context as string | null) ?? null,
        followUpAt,
      },
    ];
  });

  return { events: eventsResult.events, followUps };
}

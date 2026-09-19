import { LIMITS } from '@codecard/config';
import {
  createOwnerEventInputSchema,
  ownerEventIdInputSchema,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizePlainTextNote } from '@/lib/connections/connection-metadata-core';
import {
  getAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';
import { coerceIsoDateTime } from '@/lib/schedule/datetime';

export const OWNER_EVENTS_TABLE = 'owner_events' as const;

export type OwnerEventErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'LIMIT_REACHED'
  | 'TEMPORARY_FAILURE';

export type OwnerEvent = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
};

export type OwnerEventMutationState = {
  success?: boolean;
  error?: string;
  code?: OwnerEventErrorCode;
  event?: OwnerEvent;
};

export type ListOwnerEventsResult = {
  events: OwnerEvent[];
  error?: string;
  code?: OwnerEventErrorCode;
};

const ERROR_MESSAGES: Record<OwnerEventErrorCode, string> = {
  UNAUTHENTICATED: 'You must be signed in to manage your calendar.',
  INVALID_INPUT: 'That event is not valid.',
  NOT_FOUND: 'Event not found.',
  LIMIT_REACHED: 'You have reached the maximum number of events.',
  TEMPORARY_FAILURE: 'Could not update your calendar. Please try again.',
};

export function ownerEventErrorMessage(code: OwnerEventErrorCode): string {
  return ERROR_MESSAGES[code];
}

function fail(code: OwnerEventErrorCode): OwnerEventMutationState {
  return { error: ownerEventErrorMessage(code), code };
}

function mapEventRow(row: {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  notes: string | null;
}): OwnerEvent {
  return {
    id: row.id,
    title: row.title,
    location: row.location ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? null,
    notes: row.notes ?? null,
  };
}

export async function listOwnerUpcomingEvents(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null; fromIso?: string; limit?: number },
): Promise<ListOwnerEventsResult> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      events: [],
      error: ownerEventErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const fromIso =
    options?.fromIso ??
    new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);

  const { data, error } = await supabase
    .from(OWNER_EVENTS_TABLE)
    .select('id, title, location, starts_at, ends_at, notes')
    .eq('owner_user_id', user.id)
    .gte('starts_at', fromIso)
    .order('starts_at', { ascending: true })
    .limit(limit);

  if (error) {
    return {
      events: [],
      error: ownerEventErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }

  return { events: (data ?? []).map(mapEventRow) };
}

export async function executeCreateOwnerEvent(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<OwnerEventMutationState> {
  const parsed = createOwnerEventInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const starts = coerceIsoDateTime(parsed.data.startsAt);
  if (!starts.ok || !starts.iso) return fail('INVALID_INPUT');

  let endsIso: string | null = null;
  if (parsed.data.endsAt !== undefined && parsed.data.endsAt !== null) {
    const ends = coerceIsoDateTime(parsed.data.endsAt);
    if (!ends.ok) return fail('INVALID_INPUT');
    endsIso = ends.iso;
    if (endsIso && Date.parse(endsIso) < Date.parse(starts.iso)) {
      return fail('INVALID_INPUT');
    }
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const owned = await resolveOwnedProfile(supabase, user);
  if ('error' in owned) return fail('UNAUTHENTICATED');

  const { count } = await supabase
    .from(OWNER_EVENTS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', user.id);

  if ((count ?? 0) >= LIMITS.ownerEvents.max) {
    return fail('LIMIT_REACHED');
  }

  const title = sanitizePlainTextNote(parsed.data.title);
  if (!title) return fail('INVALID_INPUT');

  const location =
    parsed.data.location == null ? null : sanitizePlainTextNote(parsed.data.location) || null;
  const notes =
    parsed.data.notes == null ? null : sanitizePlainTextNote(parsed.data.notes) || null;

  const { data, error } = await supabase
    .from(OWNER_EVENTS_TABLE)
    .insert({
      tenant_id: owned.profile.tenant_id,
      owner_user_id: user.id,
      title,
      location,
      starts_at: starts.iso,
      ends_at: endsIso,
      notes,
    })
    .select('id, title, location, starts_at, ends_at, notes')
    .single();

  if (error || !data) return fail('TEMPORARY_FAILURE');
  return { success: true, event: mapEventRow(data) };
}

export async function executeDeleteOwnerEvent(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<OwnerEventMutationState> {
  const parsed = ownerEventIdInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const { data, error } = await supabase
    .from(OWNER_EVENTS_TABLE)
    .delete()
    .eq('id', parsed.data.eventId)
    .eq('owner_user_id', user.id)
    .select('id, title, location, starts_at, ends_at, notes')
    .maybeSingle();

  if (error) return fail('TEMPORARY_FAILURE');
  if (!data) return fail('NOT_FOUND');
  return { success: true, event: mapEventRow(data) };
}

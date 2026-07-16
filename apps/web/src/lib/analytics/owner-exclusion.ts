/**
 * WS08-T003 — Owner self-view exclusion
 *
 * Audience engagement events are ignored when the authenticated request user
 * matches the server-resolved content owner (`owner_user_id`).
 *
 * Excluded (do not inflate public audience totals):
 * - profile_view, project_view, research_view
 * - project_time_spent, project_section_time_spent, time_spent_on_research
 *
 * Not excluded (owner/dashboard actions or deliberate public clicks):
 * - link_click
 * - profile_share, qr_download
 * - other research interaction events (citation_copy, etc.)
 *
 * Client flags such as isOwner / viewerId / ownerUserId are never trusted.
 * Historical anonymous rows cannot be reclassified without stored viewer identity.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const OWNER_EXCLUDED_AUDIENCE_EVENTS = [
  'profile_view',
  'project_view',
  'research_view',
  'project_time_spent',
  'project_section_time_spent',
  'time_spent_on_research',
] as const;

export type OwnerExcludedAudienceEvent = (typeof OWNER_EXCLUDED_AUDIENCE_EVENTS)[number];

export function isOwnerExcludedAudienceEvent(eventType: string): eventType is OwnerExcludedAudienceEvent {
  return (OWNER_EXCLUDED_AUDIENCE_EVENTS as readonly string[]).includes(eventType);
}

type OwnershipLookup = {
  profile_id?: string | null;
  project_id?: string | null;
  research_paper_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
};

/**
 * Returns true when the authenticated user owns the event target.
 * Anonymous viewers always return false (record normally).
 */
export async function isAuthenticatedContentOwner(
  supabase: SupabaseClient,
  lookup: OwnershipLookup,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const researchId =
    lookup.research_paper_id ??
    (lookup.target_type === 'research' ? lookup.target_id : null) ??
    null;
  if (researchId) {
    const { data: paper } = await supabase
      .from('research_papers')
      .select('owner_user_id')
      .eq('id', researchId)
      .maybeSingle();
    return paper?.owner_user_id === user.id;
  }

  const projectId =
    lookup.project_id ?? (lookup.target_type === 'project' ? lookup.target_id : null) ?? null;
  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('owner_user_id')
      .eq('id', projectId)
      .maybeSingle();
    return project?.owner_user_id === user.id;
  }

  const profileId =
    lookup.profile_id ?? (lookup.target_type === 'profile' ? lookup.target_id : null) ?? null;
  if (profileId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('owner_user_id')
      .eq('id', profileId)
      .maybeSingle();
    return profile?.owner_user_id === user.id;
  }

  return false;
}

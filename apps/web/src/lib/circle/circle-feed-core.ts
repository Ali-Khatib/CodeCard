import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CIRCLE_ACTIVITY_TABLE,
  CIRCLE_FEED_PAGE_SIZE,
  activitySentenceFor,
  isCircleActivityEventType,
  type CircleFeedCursor,
  type CircleFeedItem,
  type CircleFeedState,
  type CircleActivityEventType,
  type CircleActivityTargetType,
} from '@/lib/circle/circle-activity-contract';
import { resolveProjectMediaDisplayUrl } from '@/lib/projects/project-media-url';

type ActivityRow = {
  id: string;
  actor_profile_id: string;
  event_type: string;
  target_type: string;
  target_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  is_public: boolean;
  owner_user_id: string;
};

type ProjectRow = {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  technologies: string[] | null;
  is_published: boolean;
  profile_id: string;
};

type ResearchRow = {
  id: string;
  slug: string;
  title: string;
  abstract: string | null;
  authors: string[] | null;
  venue: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  profile_id: string;
};

function circleFeedErrorMessage(): string {
  return 'Could not load Circle right now. Please try again.';
}

function encodeCursor(item: CircleFeedItem): CircleFeedCursor {
  return { createdAt: item.createdAt, id: item.eventId };
}

/**
 * Trusted authenticated Circle feed query.
 * Enforces Connections membership, public actor, published target, and excludes self.
 */
export async function listCircleFeed(
  supabase: SupabaseClient,
  options?: {
    limit?: number;
    cursor?: CircleFeedCursor | null;
  },
): Promise<CircleFeedState> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: 'unauthenticated' };
  }

  const limit = Math.min(
    Math.max(options?.limit ?? CIRCLE_FEED_PAGE_SIZE, 1),
    CIRCLE_FEED_PAGE_SIZE,
  );

  const { data: viewerProfile, error: viewerProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (viewerProfileError) {
    return { status: 'temporary_failure', error: circleFeedErrorMessage() };
  }

  const viewerProfileId = viewerProfile?.id ?? null;

  const { data: connections, error: connectionsError } = await supabase
    .from('saved_connections')
    .select('saved_profile_id')
    .eq('owner_user_id', user.id);

  if (connectionsError) {
    return { status: 'temporary_failure', error: circleFeedErrorMessage() };
  }

  const connectionIds = (connections ?? [])
    .map((row) => row.saved_profile_id as string)
    .filter((id) => id && id !== viewerProfileId);

  if (connectionIds.length === 0) {
    return { status: 'no_connections' };
  }

  let query = supabase
    .from(CIRCLE_ACTIVITY_TABLE)
    .select('id, actor_profile_id, event_type, target_type, target_id, created_at')
    .in('actor_profile_id', connectionIds)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (options?.cursor?.createdAt && options.cursor.id) {
    // Keyset: (created_at, id) < (cursor.createdAt, cursor.id)
    query = query.or(
      `created_at.lt.${options.cursor.createdAt},and(created_at.eq.${options.cursor.createdAt},id.lt.${options.cursor.id})`,
    );
  }

  const { data: activityRows, error: activityError } = await query;
  if (activityError) {
    return { status: 'temporary_failure', error: circleFeedErrorMessage() };
  }

  const rows = (activityRows ?? []) as ActivityRow[];
  if (rows.length === 0) {
    return { status: 'no_activity', connectionCount: connectionIds.length };
  }

  const actorIds = [...new Set(rows.map((r) => r.actor_profile_id))];
  const projectIds = rows.filter((r) => r.target_type === 'project').map((r) => r.target_id);
  const researchIds = rows.filter((r) => r.target_type === 'research').map((r) => r.target_id);

  const [profilesRes, projectsRes, researchRes, mediaRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, slug, display_name, headline, avatar_url, is_public, owner_user_id')
      .in('id', actorIds)
      .eq('is_public', true),
    projectIds.length
      ? supabase
          .from('projects')
          .select('id, title, tagline, description, technologies, is_published, profile_id')
          .in('id', projectIds)
          .eq('is_published', true)
      : Promise.resolve({ data: [] as ProjectRow[], error: null }),
    researchIds.length
      ? supabase
          .from('research_papers')
          .select(
            'id, slug, title, abstract, authors, venue, cover_image_url, is_published, profile_id',
          )
          .in('id', researchIds)
          .eq('is_published', true)
      : Promise.resolve({ data: [] as ResearchRow[], error: null }),
    projectIds.length
      ? supabase
          .from('project_media_assets')
          .select('project_id, storage_path, type')
          .in('project_id', projectIds)
          .eq('type', 'poster')
      : Promise.resolve({ data: [] as Array<{ project_id: string; storage_path: string }>, error: null }),
  ]);

  if (profilesRes.error || projectsRes.error || researchRes.error || mediaRes.error) {
    return { status: 'temporary_failure', error: circleFeedErrorMessage() };
  }

  const profiles = new Map(
    ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p] as const),
  );
  const projects = new Map(
    ((projectsRes.data ?? []) as ProjectRow[]).map((p) => [p.id, p] as const),
  );
  const research = new Map(
    ((researchRes.data ?? []) as ResearchRow[]).map((p) => [p.id, p] as const),
  );
  const posters = new Map<string, string>();
  for (const asset of mediaRes.data ?? []) {
    if (!posters.has(asset.project_id) && asset.storage_path) {
      posters.set(asset.project_id, resolveProjectMediaDisplayUrl(supabase, asset.storage_path));
    }
  }

  const items: CircleFeedItem[] = [];
  for (const row of rows) {
    if (!isCircleActivityEventType(row.event_type)) continue;
    const eventType = row.event_type as CircleActivityEventType;
    const actor = profiles.get(row.actor_profile_id);
    if (!actor || !actor.is_public || actor.owner_user_id === user.id) continue;

    if (row.target_type === 'project') {
      const project = projects.get(row.target_id);
      if (!project || !project.is_published || project.profile_id !== actor.id) continue;
      items.push({
        eventId: row.id,
        eventType,
        createdAt: row.created_at,
        actor: {
          profileId: actor.id,
          slug: actor.slug,
          displayName: actor.display_name,
          headline: actor.headline,
          avatarPublicUrl: actor.avatar_url,
        },
        target: {
          targetType: 'project' as CircleActivityTargetType,
          targetId: project.id,
          title: project.title,
          summary: project.tagline ?? project.description,
          publicPathKey: project.id,
          previewImageUrl: posters.get(project.id) ?? null,
          technologies: project.technologies ?? [],
        },
        activitySentence: activitySentenceFor(eventType, actor.display_name),
      });
      continue;
    }

    if (row.target_type === 'research') {
      const paper = research.get(row.target_id);
      if (!paper || !paper.is_published || paper.profile_id !== actor.id) continue;
      items.push({
        eventId: row.id,
        eventType,
        createdAt: row.created_at,
        actor: {
          profileId: actor.id,
          slug: actor.slug,
          displayName: actor.display_name,
          headline: actor.headline,
          avatarPublicUrl: actor.avatar_url,
        },
        target: {
          targetType: 'research' as CircleActivityTargetType,
          targetId: paper.id,
          title: paper.title,
          summary: paper.abstract,
          publicPathKey: paper.slug,
          previewImageUrl: paper.cover_image_url,
          authors: paper.authors ?? [],
          venue: paper.venue,
        },
        activitySentence: activitySentenceFor(eventType, actor.display_name),
      });
    }
  }

  // After visibility filtering, we may have fewer than `limit` items even when
  // more raw activity exists. Cursor is based on raw page window when more raw
  // rows were fetched than `limit`.
  const hasMoreRaw = rows.length > limit;
  const pageItems = items.slice(0, limit);
  if (pageItems.length === 0) {
    return { status: 'no_activity', connectionCount: connectionIds.length };
  }

  const nextCursor =
    hasMoreRaw && pageItems.length > 0 ? encodeCursor(pageItems[pageItems.length - 1]!) : null;

  return {
    status: 'feed',
    connectionCount: connectionIds.length,
    items: pageItems,
    nextCursor,
  };
}

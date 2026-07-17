import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CIRCLE_ACTIVITY_TABLE,
  CIRCLE_FEED_MAX_PAGE_SIZE,
  CIRCLE_FEED_PAGE_SIZE,
  activitySentenceFor,
  eventTypesForFilter,
  isCircleActivityEventType,
  normalizeCircleFeedFilter,
  parseCircleFeedCursor,
  type CircleFeedCursor,
  type CircleFeedFilter,
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

function invalidCursorMessage(): string {
  return 'That page link is no longer valid. Showing the latest activity.';
}

/**
 * Trusted authenticated Circle feed query.
 * Enforces Connections membership, public actor, published target, and excludes self.
 * Viewer identity always comes from the session — never from the cursor.
 */
export async function listCircleFeed(
  supabase: SupabaseClient,
  options?: {
    limit?: number;
    cursor?: CircleFeedCursor | string | null;
    filter?: string | null;
  },
): Promise<CircleFeedState> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: 'unauthenticated' };
  }

  const filter = normalizeCircleFeedFilter(options?.filter);
  const limit = Math.min(
    Math.max(options?.limit ?? CIRCLE_FEED_PAGE_SIZE, 1),
    CIRCLE_FEED_MAX_PAGE_SIZE,
  );

  let cursor: CircleFeedCursor | null = null;
  if (options?.cursor != null && options.cursor !== '') {
    const parsed = parseCircleFeedCursor(options.cursor, filter);
    if (!parsed.ok) {
      return { status: 'invalid_cursor', error: invalidCursorMessage() };
    }
    cursor = parsed.cursor;
  }

  const { data: viewerProfile, error: viewerProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (viewerProfileError) {
    return { status: 'temporary_failure', error: circleFeedErrorMessage() };
  }

  const viewerProfileId = viewerProfile?.id ?? null;

  // Always re-resolve Connections for the authenticated viewer (cursor cannot override).
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

  const eventTypes = eventTypesForFilter(filter);

  let query = supabase
    .from(CIRCLE_ACTIVITY_TABLE)
    .select('id, actor_profile_id, event_type, target_type, target_id, created_at')
    .in('actor_profile_id', connectionIds)
    .in('event_type', eventTypes)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    // Keyset: (created_at, id) < (cursor.createdAt, cursor.id)
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data: activityRows, error: activityError } = await query;
  if (activityError) {
    return { status: 'temporary_failure', error: circleFeedErrorMessage() };
  }

  const rows = (activityRows ?? []) as ActivityRow[];
  if (rows.length === 0) {
    if (filter !== 'all' && !cursor) {
      return { status: 'filtered_empty', connectionCount: connectionIds.length, filter };
    }
    return { status: 'no_activity', connectionCount: connectionIds.length };
  }

  const hasMoreRaw = rows.length > limit;
  const windowRows = hasMoreRaw ? rows.slice(0, limit) : rows;

  const actorIds = [...new Set(windowRows.map((r) => r.actor_profile_id))];
  const projectIds = windowRows.filter((r) => r.target_type === 'project').map((r) => r.target_id);
  const researchIds = windowRows.filter((r) => r.target_type === 'research').map((r) => r.target_id);

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
      : Promise.resolve({
          data: [] as Array<{ project_id: string; storage_path: string }>,
          error: null,
        }),
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
  for (const row of windowRows) {
    if (!isCircleActivityEventType(row.event_type)) continue;
    if (!eventTypes.includes(row.event_type as CircleActivityEventType)) continue;
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

  // Cursor advances from the last raw window row so hidden items cannot cause skips/duplicates.
  const lastRaw = windowRows[windowRows.length - 1];
  const nextCursor: CircleFeedCursor | null =
    hasMoreRaw && lastRaw
      ? { createdAt: lastRaw.created_at, id: lastRaw.id, filter }
      : null;

  if (items.length === 0) {
    if (nextCursor) {
      // Visible page empty but more raw rows exist — advance once more via client Load more.
      return {
        status: 'feed',
        connectionCount: connectionIds.length,
        filter,
        items: [],
        nextCursor,
      };
    }
    if (filter !== 'all' && !cursor) {
      return { status: 'filtered_empty', connectionCount: connectionIds.length, filter };
    }
    return { status: 'no_activity', connectionCount: connectionIds.length };
  }

  return {
    status: 'feed',
    connectionCount: connectionIds.length,
    filter,
    items,
    nextCursor,
  };
}

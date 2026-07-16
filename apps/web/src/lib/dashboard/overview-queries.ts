import type { SupabaseClient } from '@supabase/supabase-js';

export type OverviewContentItem = {
  id: string;
  title: string;
  isPublished: boolean;
  href: string;
};

export type OverviewContentSummary = {
  total: number;
  published: number;
  recent: OverviewContentItem[];
};

export type LoadOwnerOverviewContentResult =
  | {
      ok: true;
      projects: OverviewContentSummary;
      research: OverviewContentSummary;
    }
  | { ok: false; reason: 'unauthenticated' | 'no_profile' | 'query_failed' };

const RECENT_LIMIT = 3;

/**
 * Owner-scoped project/research summaries for the authenticated dashboard home.
 * Ownership is resolved from `owner_user_id` — never from a client-supplied profile id.
 */
export async function loadOwnerOverviewContent(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<LoadOwnerOverviewContentResult> {
  if (!userId) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (profileError) return { ok: false, reason: 'query_failed' };
  if (!profile) return { ok: false, reason: 'no_profile' };

  const [projectsResult, researchResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, is_published, updated_at, created_at')
      .eq('profile_id', profile.id)
      .eq('owner_user_id', userId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('research_papers')
      .select('id, title, is_published, updated_at, created_at')
      .eq('profile_id', profile.id)
      .eq('owner_user_id', userId)
      .order('updated_at', { ascending: false }),
  ]);

  if (projectsResult.error || researchResult.error) {
    return { ok: false, reason: 'query_failed' };
  }

  const projects = projectsResult.data ?? [];
  const papers = researchResult.data ?? [];

  return {
    ok: true,
    projects: {
      total: projects.length,
      published: projects.filter((p) => p.is_published).length,
      recent: projects.slice(0, RECENT_LIMIT).map((p) => ({
        id: p.id,
        title: p.title,
        isPublished: Boolean(p.is_published),
        href: `/dashboard/projects/${p.id}/edit`,
      })),
    },
    research: {
      total: papers.length,
      published: papers.filter((p) => p.is_published).length,
      recent: papers.slice(0, RECENT_LIMIT).map((p) => ({
        id: p.id,
        title: p.title,
        isPublished: Boolean(p.is_published),
        href: `/dashboard/research/${p.id}/edit`,
      })),
    },
  };
}

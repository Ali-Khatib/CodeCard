import { reorderProjectsSchema } from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  resolveAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/projects/project-access-core';

export type ProjectOrderingRow = {
  project_id: string;
  sort_order: number;
};

export type OrderableProject = {
  id: string;
  sort_order: number;
  created_at: string;
};

export type ProjectReorderState = {
  success?: boolean;
  error?: string;
};

export function sortProjectsByEffectiveOrder<T extends OrderableProject>(
  projects: T[],
  orderings: ProjectOrderingRow[],
): T[] {
  const orderMap = new Map(orderings.map((row) => [row.project_id, row.sort_order]));

  return [...projects].sort((left, right) => {
    const leftKey = orderingSortKey(left, orderMap);
    const rightKey = orderingSortKey(right, orderMap);

    for (let index = 0; index < leftKey.length; index += 1) {
      const leftValue = leftKey[index]!;
      const rightValue = rightKey[index]!;
      if (leftValue === rightValue) continue;
      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return leftValue.localeCompare(rightValue);
      }
      return Number(leftValue) - Number(rightValue);
    }

    return 0;
  });
}

function orderingSortKey(
  project: OrderableProject,
  orderMap: Map<string, number>,
): [number, number, number, string] {
  if (orderMap.has(project.id)) {
    return [0, orderMap.get(project.id)!, 0, project.id];
  }

  const createdAt = Date.parse(project.created_at);
  return [1, project.sort_order, Number.isNaN(createdAt) ? 0 : createdAt, project.id];
}

export async function loadProfileProjectOrderings(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProjectOrderingRow[]> {
  const { data } = await supabase
    .from('project_orderings')
    .select('project_id, sort_order')
    .eq('profile_id', profileId);

  return (data ?? []) as ProjectOrderingRow[];
}

export async function executeReorderProjects(
  supabase: SupabaseClient,
  projectIds: string[],
  options?: { user?: AuthUser | null },
): Promise<ProjectReorderState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error };
  }

  const profileResult = await resolveOwnedProfile(supabase, auth.user.id);
  if ('error' in profileResult) {
    return { error: 'Could not reorder projects.' };
  }

  const parsed = reorderProjectsSchema.safeParse({ project_ids: projectIds });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid project order.' };
  }

  const unique = new Set(parsed.data.project_ids);
  if (unique.size !== parsed.data.project_ids.length) {
    return { error: 'Could not reorder projects.' };
  }

  const { data: ownedProjects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('profile_id', profileResult.profile.id)
    .eq('owner_user_id', auth.user.id)
    .eq('tenant_id', profileResult.profile.tenant_id);

  if (projectsError || !ownedProjects) {
    return { error: 'Could not reorder projects.' };
  }

  const ownedIds = new Set(ownedProjects.map((row) => row.id as string));
  if (parsed.data.project_ids.length !== ownedIds.size) {
    return { error: 'Could not reorder projects.' };
  }

  for (const projectId of parsed.data.project_ids) {
    if (!ownedIds.has(projectId)) {
      return { error: 'Could not reorder projects.' };
    }
  }

  const rows = parsed.data.project_ids.map((projectId, index) => ({
    tenant_id: profileResult.profile.tenant_id,
    profile_id: profileResult.profile.id,
    project_id: projectId,
    sort_order: index,
  }));

  const { error: upsertError } = await supabase
    .from('project_orderings')
    .upsert(rows, { onConflict: 'profile_id,project_id' });

  if (upsertError) {
    return { error: 'Could not reorder projects.' };
  }

  const sortUpdates = await Promise.all(
    parsed.data.project_ids.map((projectId, index) =>
      supabase
        .from('projects')
        .update({ sort_order: index })
        .eq('id', projectId)
        .eq('profile_id', profileResult.profile.id)
        .eq('owner_user_id', auth.user.id),
    ),
  );

  if (sortUpdates.some((result) => result.error)) {
    return { error: 'Could not reorder projects.' };
  }

  return { success: true };
}

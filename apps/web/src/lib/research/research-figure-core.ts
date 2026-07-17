import { STORAGE_BUCKETS } from '@codecard/config';
import {
  RESEARCH_FIGURE_MAX_COUNT,
  researchFigureCaptionSchema,
  researchFigureDeleteSchema,
  researchFigureFinalizeSchema,
  researchFigureReorderSchema,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedResearchPaper,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/research/research-access-core';
import { resolveResearchFigureDisplayUrl } from '@/lib/research/research-figure-url';
import {
  bucketForStorageResourceType,
  parseCanonicalStoragePath,
} from '@/lib/storage/path';
import { bestEffortRemoveTrustedStorageObject } from '@/lib/storage/storage-cleanup';
import {
  completeUploadIntentAfterFinalize,
  requireVerifiedRasterObjectForFinalize,
} from '@/lib/storage/finalize-raster-verification';

export type ResearchFigureRecord = {
  id: string;
  research_paper_id: string;
  storage_path: string | null;
  image_url: string;
  caption: string | null;
  sort_order: number;
  displayUrl: string | null;
};

export type ResearchFigureFinalizeState = {
  success?: boolean;
  error?: string;
  figure?: ResearchFigureRecord;
  researchPaperId?: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  isPublished?: boolean;
  profileIsPublic?: boolean;
  cleanupWarning?: boolean;
  replaced?: boolean;
};

export type ResearchFigureMutationState = {
  success?: boolean;
  error?: string;
  alreadyDeleted?: boolean;
  researchPaperId?: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  isPublished?: boolean;
  profileIsPublic?: boolean;
  cleanupWarning?: boolean;
  figures?: ResearchFigureRecord[];
};

const GENERIC_ERROR = 'Could not save research figure. Please try again.';
const GENERIC_DELETE_ERROR = 'Could not delete this figure. Please try again.';
const FIGURE_LIMIT_ERROR = `You can upload up to ${RESEARCH_FIGURE_MAX_COUNT} figures per paper.`;

const FIGURE_SELECT =
  'id, research_paper_id, storage_path, image_url, caption, sort_order';

export function assertOwnedResearchFigureStoragePath(
  path: string,
  paper: { id: string; tenant_id: string; owner_user_id: string },
  userId: string,
): { ok: true } | { ok: false } {
  if (path.includes('://') || path.startsWith('/') || path.includes('..')) {
    return { ok: false };
  }

  let segments;
  try {
    segments = parseCanonicalStoragePath(path);
  } catch {
    return { ok: false };
  }

  if (segments.resourceType !== 'research-figure') {
    return { ok: false };
  }
  if (segments.tenantId !== paper.tenant_id) {
    return { ok: false };
  }
  if (segments.ownerUserId !== paper.owner_user_id || segments.ownerUserId !== userId) {
    return { ok: false };
  }
  if (segments.resourceId !== paper.id) {
    return { ok: false };
  }

  const bucket = bucketForStorageResourceType('research-figure');
  if (bucket !== STORAGE_BUCKETS.projectMedia) {
    return { ok: false };
  }

  return { ok: true };
}

async function researchFigureObjectExists(
  supabase: SupabaseClient,
  path: string,
): Promise<boolean> {
  const slash = path.lastIndexOf('/');
  const folder = slash >= 0 ? path.slice(0, slash) : '';
  const filename = path.slice(slash + 1);
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.projectMedia)
    .list(folder, { limit: 1, search: filename });

  if (error) {
    return false;
  }

  return (data ?? []).some((item) => item.name === filename);
}

function toFigureRecord(
  supabase: SupabaseClient,
  row: {
    id: string;
    research_paper_id: string;
    storage_path?: string | null;
    image_url: string;
    caption?: string | null;
    sort_order?: number | null;
  },
): ResearchFigureRecord {
  return {
    id: row.id,
    research_paper_id: row.research_paper_id,
    storage_path: row.storage_path ?? null,
    image_url: row.image_url,
    caption: row.caption ?? null,
    sort_order: row.sort_order ?? 0,
    displayUrl: resolveResearchFigureDisplayUrl(supabase, row),
  };
}

export async function countResearchFigures(
  supabase: SupabaseClient,
  researchPaperId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('research_figures')
    .select('id', { count: 'exact', head: true })
    .eq('research_paper_id', researchPaperId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function assertResearchFigureUploadAllowed(
  supabase: SupabaseClient,
  input: {
    userId: string;
    researchPaperId: string;
    replaceFigureId?: string;
  },
): Promise<{ ok: true } | { ok: false; status: 403 | 409; message: string }> {
  const owned = await loadOwnedResearchPaper(supabase, {
    userId: input.userId,
    researchPaperId: input.researchPaperId,
  });
  if ('error' in owned) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to upload this file.',
    };
  }

  if (input.replaceFigureId) {
    const { data: existing } = await supabase
      .from('research_figures')
      .select('id')
      .eq('id', input.replaceFigureId)
      .eq('research_paper_id', owned.paper.id)
      .maybeSingle();
    if (!existing) {
      return {
        ok: false,
        status: 403,
        message: 'You do not have permission to upload this file.',
      };
    }
    return { ok: true };
  }

  const figureCount = await countResearchFigures(supabase, owned.paper.id);
  if (figureCount >= RESEARCH_FIGURE_MAX_COUNT) {
    return { ok: false, status: 409, message: FIGURE_LIMIT_ERROR };
  }

  return { ok: true };
}

export async function loadOwnedResearchFigures(
  supabase: SupabaseClient,
  input: { userId: string; researchPaperId: string },
): Promise<{ figures: ResearchFigureRecord[] } | { error: string }> {
  const owned = await loadOwnedResearchPaper(supabase, input);
  if ('error' in owned) {
    return { error: owned.error };
  }

  const { data, error } = await supabase
    .from('research_figures')
    .select(FIGURE_SELECT)
    .eq('research_paper_id', owned.paper.id)
    .order('sort_order', { ascending: true });

  if (error) {
    return { error: 'Could not load research figures.' };
  }

  return {
    figures: (data ?? []).map((row) => toFigureRecord(supabase, row)),
  };
}

async function researchFigurePathAlreadyFinalized(
  supabase: SupabaseClient,
  researchPaperId: string,
  path: string,
): Promise<ResearchFigureRecord | null> {
  const { data } = await supabase
    .from('research_figures')
    .select(FIGURE_SELECT)
    .eq('research_paper_id', researchPaperId)
    .eq('storage_path', path)
    .maybeSingle();

  return data ? toFigureRecord(supabase, data) : null;
}

export async function executeFinalizeResearchFigureUpload(
  supabase: SupabaseClient,
  input: {
    research_paper_id: string;
    path: string;
    replace_figure_id?: string;
  },
  options?: { user?: AuthUser | null },
): Promise<ResearchFigureFinalizeState> {
  const parsed = researchFigureFinalizeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: parsed.data.research_paper_id,
  });
  if ('error' in owned) {
    return { error: GENERIC_ERROR };
  }

  const { paper, profile } = owned;
  const pathCheck = assertOwnedResearchFigureStoragePath(
    parsed.data.path,
    paper,
    auth.user.id,
  );
  if (!pathCheck.ok) {
    return { error: GENERIC_ERROR };
  }

  const already = await researchFigurePathAlreadyFinalized(
    supabase,
    paper.id,
    parsed.data.path,
  );
  if (already) {
    await completeUploadIntentAfterFinalize(supabase, parsed.data.path);
    return {
      success: true,
      figure: already,
      researchPaperId: paper.id,
      paperSlug: paper.slug,
      profileSlug: profile.slug,
      isPublished: paper.is_published,
      profileIsPublic: profile.is_public,
    };
  }

  const exists = await researchFigureObjectExists(supabase, parsed.data.path);
  if (!exists) {
    return { error: GENERIC_ERROR };
  }

  const verified = await requireVerifiedRasterObjectForFinalize(supabase, {
    path: parsed.data.path,
    resourceType: 'research-figure',
  });
  if (!verified.ok) {
    return { error: GENERIC_ERROR };
  }

  if (parsed.data.replace_figure_id) {
    const { data: existing } = await supabase
      .from('research_figures')
      .select(FIGURE_SELECT)
      .eq('id', parsed.data.replace_figure_id)
      .eq('research_paper_id', paper.id)
      .maybeSingle();

    if (!existing) {
      await bestEffortRemoveTrustedStorageObject(supabase, {
        resourceType: 'research-figure',
        path: parsed.data.path,
      });
      return { error: GENERIC_ERROR };
    }

    const previousPath = existing.storage_path as string | null;
    const { data: updated, error: updateError } = await supabase
      .from('research_figures')
      .update({
        storage_path: parsed.data.path,
        image_url: parsed.data.path,
      })
      .eq('id', existing.id)
      .eq('research_paper_id', paper.id)
      .select(FIGURE_SELECT)
      .single();

    if (updateError || !updated) {
      await bestEffortRemoveTrustedStorageObject(supabase, {
        resourceType: 'research-figure',
        path: parsed.data.path,
      });
      return { error: GENERIC_ERROR };
    }

    await completeUploadIntentAfterFinalize(supabase, parsed.data.path);

    let cleanupWarning = false;
    if (previousPath && previousPath !== parsed.data.path) {
      const previousCheck = assertOwnedResearchFigureStoragePath(
        previousPath,
        paper,
        auth.user.id,
      );
      if (previousCheck.ok) {
        const cleanup = await bestEffortRemoveTrustedStorageObject(supabase, {
          resourceType: 'research-figure',
          path: previousPath,
        });
        cleanupWarning = !cleanup.cleaned;
      }
    }

    return {
      success: true,
      figure: toFigureRecord(supabase, updated),
      researchPaperId: paper.id,
      paperSlug: paper.slug,
      profileSlug: profile.slug,
      isPublished: paper.is_published,
      profileIsPublic: profile.is_public,
      replaced: true,
      cleanupWarning: cleanupWarning || undefined,
    };
  }

  const figureCount = await countResearchFigures(supabase, paper.id);
  if (figureCount >= RESEARCH_FIGURE_MAX_COUNT) {
    await bestEffortRemoveTrustedStorageObject(supabase, {
      resourceType: 'research-figure',
      path: parsed.data.path,
    });
    return { error: FIGURE_LIMIT_ERROR };
  }

  const { data: maxRows } = await supabase
    .from('research_figures')
    .select('sort_order')
    .eq('research_paper_id', paper.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const sortOrder = ((maxRows?.[0]?.sort_order as number | undefined) ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from('research_figures')
    .insert({
      tenant_id: paper.tenant_id,
      research_paper_id: paper.id,
      storage_path: parsed.data.path,
      image_url: parsed.data.path,
      caption: null,
      sort_order: sortOrder,
    })
    .select(FIGURE_SELECT)
    .single();

  if (insertError || !inserted) {
    await bestEffortRemoveTrustedStorageObject(supabase, {
      resourceType: 'research-figure',
      path: parsed.data.path,
    });
    return { error: GENERIC_ERROR };
  }

  await completeUploadIntentAfterFinalize(supabase, parsed.data.path);

  return {
    success: true,
    figure: toFigureRecord(supabase, inserted),
    researchPaperId: paper.id,
    paperSlug: paper.slug,
    profileSlug: profile.slug,
    isPublished: paper.is_published,
    profileIsPublic: profile.is_public,
  };
}

export async function executeUpdateResearchFigureCaption(
  supabase: SupabaseClient,
  input: {
    research_paper_id: string;
    figure_id: string;
    caption: string | null;
  },
  options?: { user?: AuthUser | null },
): Promise<ResearchFigureMutationState> {
  const parsed = researchFigureCaptionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: parsed.data.research_paper_id,
  });
  if ('error' in owned) {
    return { error: GENERIC_ERROR };
  }

  const { data: updated, error } = await supabase
    .from('research_figures')
    .update({ caption: parsed.data.caption })
    .eq('id', parsed.data.figure_id)
    .eq('research_paper_id', owned.paper.id)
    .select(FIGURE_SELECT)
    .maybeSingle();

  if (error || !updated) {
    return { error: GENERIC_ERROR };
  }

  return {
    success: true,
    researchPaperId: owned.paper.id,
    paperSlug: owned.paper.slug,
    profileSlug: owned.profile.slug,
    isPublished: owned.paper.is_published,
    profileIsPublic: owned.profile.is_public,
    figures: [toFigureRecord(supabase, updated)],
  };
}

export async function executeDeleteResearchFigure(
  supabase: SupabaseClient,
  input: { research_paper_id: string; figure_id: string },
  options?: { user?: AuthUser | null },
): Promise<ResearchFigureMutationState> {
  const parsed = researchFigureDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: GENERIC_DELETE_ERROR };
  }

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: parsed.data.research_paper_id,
  });
  if ('error' in owned) {
    if (owned.errorCode === 'not_found') {
      return {
        success: true,
        alreadyDeleted: true,
        researchPaperId: parsed.data.research_paper_id,
      };
    }
    return { error: owned.error };
  }

  const { data: existing } = await supabase
    .from('research_figures')
    .select(FIGURE_SELECT)
    .eq('id', parsed.data.figure_id)
    .eq('research_paper_id', owned.paper.id)
    .maybeSingle();

  if (!existing) {
    return {
      success: true,
      alreadyDeleted: true,
      researchPaperId: owned.paper.id,
      paperSlug: owned.paper.slug,
      profileSlug: owned.profile.slug,
      isPublished: owned.paper.is_published,
      profileIsPublic: owned.profile.is_public,
    };
  }

  const storagePath = existing.storage_path as string | null;

  const { error: deleteError } = await supabase
    .from('research_figures')
    .delete()
    .eq('id', existing.id)
    .eq('research_paper_id', owned.paper.id);

  if (deleteError) {
    return { error: GENERIC_DELETE_ERROR };
  }

  let cleanupWarning = false;
  if (storagePath) {
    const pathCheck = assertOwnedResearchFigureStoragePath(
      storagePath,
      owned.paper,
      auth.user.id,
    );
    if (pathCheck.ok) {
      const cleanup = await bestEffortRemoveTrustedStorageObject(supabase, {
        resourceType: 'research-figure',
        path: storagePath,
      });
      cleanupWarning = !cleanup.cleaned;
    }
  }

  await normalizeResearchFigureSortOrder(supabase, owned.paper.id);

  return {
    success: true,
    researchPaperId: owned.paper.id,
    paperSlug: owned.paper.slug,
    profileSlug: owned.profile.slug,
    isPublished: owned.paper.is_published,
    profileIsPublic: owned.profile.is_public,
    cleanupWarning: cleanupWarning || undefined,
  };
}

export async function executeReorderResearchFigures(
  supabase: SupabaseClient,
  input: { research_paper_id: string; ordered_figure_ids: string[] },
  options?: { user?: AuthUser | null },
): Promise<ResearchFigureMutationState> {
  const parsed = researchFigureReorderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid figure order.' };
  }

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: parsed.data.research_paper_id,
  });
  if ('error' in owned) {
    return { error: GENERIC_ERROR };
  }

  const { data: existingRows, error: loadError } = await supabase
    .from('research_figures')
    .select('id')
    .eq('research_paper_id', owned.paper.id);

  if (loadError) {
    return { error: GENERIC_ERROR };
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.id as string));
  if (existingIds.size !== parsed.data.ordered_figure_ids.length) {
    return { error: 'Invalid figure order.' };
  }
  for (const id of parsed.data.ordered_figure_ids) {
    if (!existingIds.has(id)) {
      return { error: 'Invalid figure order.' };
    }
  }

  for (let index = 0; index < parsed.data.ordered_figure_ids.length; index += 1) {
    const figureId = parsed.data.ordered_figure_ids[index]!;
    const { error } = await supabase
      .from('research_figures')
      .update({ sort_order: index })
      .eq('id', figureId)
      .eq('research_paper_id', owned.paper.id);
    if (error) {
      return { error: GENERIC_ERROR };
    }
  }

  const loaded = await loadOwnedResearchFigures(supabase, {
    userId: auth.user.id,
    researchPaperId: owned.paper.id,
  });
  if ('error' in loaded) {
    return {
      success: true,
      researchPaperId: owned.paper.id,
      paperSlug: owned.paper.slug,
      profileSlug: owned.profile.slug,
      isPublished: owned.paper.is_published,
      profileIsPublic: owned.profile.is_public,
    };
  }

  return {
    success: true,
    researchPaperId: owned.paper.id,
    paperSlug: owned.paper.slug,
    profileSlug: owned.profile.slug,
    isPublished: owned.paper.is_published,
    profileIsPublic: owned.profile.is_public,
    figures: loaded.figures,
  };
}

async function normalizeResearchFigureSortOrder(
  supabase: SupabaseClient,
  researchPaperId: string,
): Promise<void> {
  const { data } = await supabase
    .from('research_figures')
    .select('id')
    .eq('research_paper_id', researchPaperId)
    .order('sort_order', { ascending: true });

  for (let index = 0; index < (data ?? []).length; index += 1) {
    const row = data![index]!;
    await supabase
      .from('research_figures')
      .update({ sort_order: index })
      .eq('id', row.id)
      .eq('research_paper_id', researchPaperId);
  }
}

/**
 * Collect trusted CodeCard-owned figure storage paths before paper deletion.
 * External image_url values are ignored. Cleanup is best-effort (WS04-T010).
 */
export async function listTrustedResearchFigureStoragePaths(
  supabase: SupabaseClient,
  researchPaperId: string,
  paper: { id: string; tenant_id: string; owner_user_id: string },
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('research_figures')
    .select('storage_path')
    .eq('research_paper_id', researchPaperId);

  const paths: string[] = [];
  for (const row of data ?? []) {
    const path = row.storage_path as string | null;
    if (!path) continue;
    const check = assertOwnedResearchFigureStoragePath(path, paper, userId);
    if (check.ok) {
      paths.push(path);
    }
  }
  return paths;
}

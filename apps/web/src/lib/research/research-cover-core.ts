import { STORAGE_BUCKETS } from '@codecard/config';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedResearchPaper,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/research/research-access-core';
import { assertOwnedResearchFigureStoragePath } from '@/lib/research/research-figure-core';
import { getPublicResearchFigureUrl } from '@/lib/research/research-figure-url';
import { emitResearchUpdatedActivity } from '@/lib/circle/circle-emit-core';
import {
  completeUploadIntentAfterFinalize,
  requireVerifiedRasterObjectForFinalize,
} from '@/lib/storage/finalize-raster-verification';
import { bestEffortRemoveTrustedStorageObject } from '@/lib/storage/storage-cleanup';

const GENERIC_ERROR = 'Could not save the research banner. Please try again.';

const coverFinalizeSchema = z
  .object({
    research_paper_id: z.string().uuid(),
    path: z.string().trim().min(1).max(512),
  })
  .strict();

export type ResearchCoverFinalizeState = {
  success?: boolean;
  error?: string;
  coverImageUrl?: string;
  researchPaperId?: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  isPublished?: boolean;
  profileIsPublic?: boolean;
};

export async function assertResearchCoverUploadAllowed(
  supabase: SupabaseClient,
  input: { userId: string; researchPaperId: string },
): Promise<{ ok: true } | { ok: false; status: 403; message: string }> {
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
  return { ok: true };
}

function storagePathFromPublicCover(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKETS.projectMedia}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  try {
    return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '');
  } catch {
    return null;
  }
}

async function objectExists(supabase: SupabaseClient, path: string): Promise<boolean> {
  const slash = path.lastIndexOf('/');
  const folder = slash >= 0 ? path.slice(0, slash) : '';
  const filename = path.slice(slash + 1);
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.projectMedia)
    .list(folder, { limit: 1, search: filename });
  if (error) return false;
  return (data ?? []).some((item) => item.name === filename);
}

export async function executeFinalizeResearchCoverUpload(
  supabase: SupabaseClient,
  input: { research_paper_id: string; path: string },
  options?: { user?: AuthUser | null },
): Promise<ResearchCoverFinalizeState> {
  const parsed = coverFinalizeSchema.safeParse(input);
  if (!parsed.success) return { error: GENERIC_ERROR };

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) return { error: auth.error };

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: parsed.data.research_paper_id,
  });
  if ('error' in owned) return { error: GENERIC_ERROR };

  const { paper, profile } = owned;
  const pathCheck = assertOwnedResearchFigureStoragePath(parsed.data.path, paper, auth.user.id);
  if (!pathCheck.ok) return { error: GENERIC_ERROR };

  const exists = await objectExists(supabase, parsed.data.path);
  if (!exists) return { error: GENERIC_ERROR };

  const verified = await requireVerifiedRasterObjectForFinalize(supabase, {
    path: parsed.data.path,
    resourceType: 'research-figure',
  });
  if (!verified.ok) return { error: GENERIC_ERROR };

  const coverImageUrl = getPublicResearchFigureUrl(supabase, parsed.data.path);
  const previousUrl = paper.cover_image_url;
  const { error: updateError } = await supabase
    .from('research_papers')
    .update({ cover_image_url: coverImageUrl })
    .eq('id', paper.id)
    .eq('owner_user_id', auth.user.id);

  if (updateError) return { error: GENERIC_ERROR };

  await completeUploadIntentAfterFinalize(supabase, parsed.data.path);

  const previousPath = storagePathFromPublicCover(previousUrl);
  if (previousPath && previousPath !== parsed.data.path) {
    const previousOwned = assertOwnedResearchFigureStoragePath(previousPath, paper, auth.user.id);
    if (previousOwned.ok) {
      const { data: figure } = await supabase
        .from('research_figures')
        .select('id')
        .eq('research_paper_id', paper.id)
        .eq('storage_path', previousPath)
        .maybeSingle();
      if (!figure) {
        await bestEffortRemoveTrustedStorageObject(supabase, {
          resourceType: 'research-figure',
          path: previousPath,
        });
      }
    }
  }

  if (paper.is_published && previousUrl !== coverImageUrl) {
    try {
      await emitResearchUpdatedActivity(supabase, {
        tenantId: paper.tenant_id,
        actorProfileId: paper.profile_id,
        researchPaperId: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        slug: paper.slug,
        authors: paper.authors ?? [],
        venue: paper.venue,
        publication_status: paper.publication_status,
        pdf_url: paper.pdf_url,
        cover_image_url: coverImageUrl,
        year: paper.year,
      });
    } catch {
      // The banner is already saved.
    }
  }

  return {
    success: true,
    coverImageUrl,
    researchPaperId: paper.id,
    paperSlug: paper.slug,
    profileSlug: profile.slug,
    isPublished: paper.is_published,
    profileIsPublic: profile.is_public,
  };
}

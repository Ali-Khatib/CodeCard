import { STORAGE_BUCKETS } from '@codecard/config';
import {
  PROJECT_SCREENSHOT_MAX_COUNT,
  projectMediaFinalizeSchema,
  type ProjectMediaRole,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  bucketForStorageResourceType,
  parseCanonicalStoragePath,
} from '@/lib/storage/path';
import { loadOwnedProject } from '@/lib/projects/project-access-core';

export type ProjectMediaAssetRecord = {
  id: string;
  type: ProjectMediaRole;
  storage_path: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
};

export type ProjectMediaFinalizeState = {
  success?: boolean;
  error?: string;
  asset?: ProjectMediaAssetRecord;
  projectId?: string;
  slug?: string;
  isPublished?: boolean;
  profileIsPublic?: boolean;
};

const GENERIC_ERROR = 'Could not save project media. Please try again.';
const COVER_EXISTS_ERROR =
  'This project already has a cover image. Cover replacement is not available yet.';
const SCREENSHOT_LIMIT_ERROR = `You can upload up to ${PROJECT_SCREENSHOT_MAX_COUNT} screenshots per project.`;

export function assertOwnedProjectMediaStoragePath(
  path: string,
  project: { id: string; tenant_id: string; owner_user_id: string },
  userId: string,
  expectedRole: ProjectMediaRole,
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

  if (segments.resourceType !== 'project-media') {
    return { ok: false };
  }
  if (segments.tenantId !== project.tenant_id) {
    return { ok: false };
  }
  if (segments.ownerUserId !== project.owner_user_id || segments.ownerUserId !== userId) {
    return { ok: false };
  }
  if (segments.resourceId !== project.id) {
    return { ok: false };
  }

  const bucket = bucketForStorageResourceType('project-media');
  if (bucket !== STORAGE_BUCKETS.projectMedia) {
    return { ok: false };
  }

  void expectedRole;
  return { ok: true };
}

async function projectMediaObjectExists(
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

async function bestEffortRemoveUploadedObject(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  try {
    await supabase.storage.from(STORAGE_BUCKETS.projectMedia).remove([path]);
  } catch {
    // Orphan reconciliation deferred to WS04-T010.
  }
}

export async function countProjectMediaByRole(
  supabase: SupabaseClient,
  projectId: string,
  role: ProjectMediaRole,
): Promise<number> {
  const { count, error } = await supabase
    .from('project_media_assets')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('type', role);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function projectMediaPathAlreadyFinalized(
  supabase: SupabaseClient,
  projectId: string,
  path: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('project_media_assets')
    .select('id')
    .eq('project_id', projectId)
    .eq('storage_path', path)
    .maybeSingle();

  return Boolean(data);
}

export async function assertProjectMediaUploadAllowed(
  supabase: SupabaseClient,
  input: { userId: string; projectId: string; mediaRole: ProjectMediaRole },
): Promise<{ ok: true } | { ok: false; status: 403 | 409; message: string }> {
  const owned = await loadOwnedProject(supabase, {
    userId: input.userId,
    projectId: input.projectId,
  });
  if ('error' in owned) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to upload this file.',
    };
  }

  if (input.mediaRole === 'poster') {
    const coverCount = await countProjectMediaByRole(supabase, input.projectId, 'poster');
    if (coverCount > 0) {
      return { ok: false, status: 409, message: COVER_EXISTS_ERROR };
    }
  }

  if (input.mediaRole === 'screenshot') {
    const screenshotCount = await countProjectMediaByRole(
      supabase,
      input.projectId,
      'screenshot',
    );
    if (screenshotCount >= PROJECT_SCREENSHOT_MAX_COUNT) {
      return { ok: false, status: 409, message: SCREENSHOT_LIMIT_ERROR };
    }
  }

  return { ok: true };
}

export async function loadOwnedProjectMediaAssets(
  supabase: SupabaseClient,
  input: { userId: string; projectId: string },
): Promise<
  | { assets: ProjectMediaAssetRecord[] }
  | { error: string }
> {
  const owned = await loadOwnedProject(supabase, input);
  if ('error' in owned) {
    return { error: owned.error };
  }

  const { data, error } = await supabase
    .from('project_media_assets')
    .select('id, type, storage_path, mime_type, file_size, sort_order')
    .eq('project_id', owned.project.id)
    .order('sort_order', { ascending: true });

  if (error) {
    return { error: 'Could not load project media.' };
  }

  return { assets: (data ?? []) as ProjectMediaAssetRecord[] };
}

export async function executeFinalizeProjectMediaUpload(
  supabase: SupabaseClient,
  input: {
    project_id: string;
    media_role: ProjectMediaRole;
    path: string;
  },
): Promise<ProjectMediaFinalizeState> {
  const parsed = projectMediaFinalizeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const owned = await loadOwnedProject(supabase, {
    userId: user.id,
    projectId: parsed.data.project_id,
  });
  if ('error' in owned) {
    return { error: GENERIC_ERROR };
  }

  const { project, profile } = owned;

  const pathCheck = assertOwnedProjectMediaStoragePath(
    parsed.data.path,
    project,
    user.id,
    parsed.data.media_role,
  );
  if (!pathCheck.ok) {
    return { error: GENERIC_ERROR };
  }

  if (await projectMediaPathAlreadyFinalized(supabase, project.id, parsed.data.path)) {
    const { data: existing } = await supabase
      .from('project_media_assets')
      .select('id, type, storage_path, mime_type, file_size, sort_order')
      .eq('project_id', project.id)
      .eq('storage_path', parsed.data.path)
      .single();

    if (existing && existing.type === parsed.data.media_role) {
      return {
        success: true,
        asset: existing as ProjectMediaAssetRecord,
        projectId: project.id,
        slug: profile.slug ?? undefined,
        isPublished: project.is_published,
        profileIsPublic: profile.is_public,
      };
    }

    return { error: GENERIC_ERROR };
  }

  if (parsed.data.media_role === 'poster') {
    const coverCount = await countProjectMediaByRole(supabase, project.id, 'poster');
    if (coverCount > 0) {
      return { error: COVER_EXISTS_ERROR };
    }
  }

  if (parsed.data.media_role === 'screenshot') {
    const screenshotCount = await countProjectMediaByRole(supabase, project.id, 'screenshot');
    if (screenshotCount >= PROJECT_SCREENSHOT_MAX_COUNT) {
      return { error: SCREENSHOT_LIMIT_ERROR };
    }
  }

  const exists = await projectMediaObjectExists(supabase, parsed.data.path);
  if (!exists) {
    return { error: GENERIC_ERROR };
  }

  const slash = parsed.data.path.lastIndexOf('/');
  const folder = slash >= 0 ? parsed.data.path.slice(0, slash) : '';
  const filename = parsed.data.path.slice(slash + 1);
  const { data: listed } = await supabase.storage
    .from(STORAGE_BUCKETS.projectMedia)
    .list(folder, { limit: 1, search: filename });

  const objectMeta = (listed ?? []).find((item) => item.name === filename);
  const mimeType =
    typeof objectMeta?.metadata?.mimetype === 'string'
      ? objectMeta.metadata.mimetype
      : 'image/png';
  const fileSize =
    typeof objectMeta?.metadata?.size === 'number'
      ? objectMeta.metadata.size
      : typeof objectMeta?.metadata?.size === 'string'
        ? Number.parseInt(objectMeta.metadata.size, 10) || 0
        : 0;

  let sortOrder = 0;
  if (parsed.data.media_role === 'screenshot') {
    const { data: rows } = await supabase
      .from('project_media_assets')
      .select('sort_order')
      .eq('project_id', project.id)
      .eq('type', 'screenshot')
      .order('sort_order', { ascending: false })
      .limit(1);
    sortOrder = ((rows?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  }

  const insertRow = {
    tenant_id: project.tenant_id,
    project_id: project.id,
    type: parsed.data.media_role,
    storage_path: parsed.data.path,
    mime_type: mimeType,
    file_size: fileSize,
    sort_order: sortOrder,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('project_media_assets')
    .insert(insertRow)
    .select('id, type, storage_path, mime_type, file_size, sort_order')
    .single();

  if (insertError || !inserted) {
    await bestEffortRemoveUploadedObject(supabase, parsed.data.path);
    return { error: GENERIC_ERROR };
  }

  return {
    success: true,
    asset: inserted as ProjectMediaAssetRecord,
    projectId: project.id,
    slug: profile.slug ?? undefined,
    isPublished: project.is_published,
    profileIsPublic: profile.is_public,
  };
}

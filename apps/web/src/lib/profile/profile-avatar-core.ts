import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { bucketForStorageResourceType, parseCanonicalStoragePath } from '@/lib/storage/path';
import { getPublicAvatarUrl } from '@/lib/profile/avatar-url';
import { resolveOwnedProfile, type AuthUser } from '@/lib/profile/profile-auth-core';
import {
  bestEffortRemoveTrustedStorageObject,
  extractAvatarPathFromPublicUrl,
} from '@/lib/storage/storage-cleanup';
import {
  completeUploadIntentAfterFinalize,
  requireVerifiedRasterObjectForFinalize,
} from '@/lib/storage/finalize-raster-verification';

export type AvatarFinalizeState = {
  success?: boolean;
  error?: string;
  avatarUrl?: string;
  slug?: string;
  isPublic?: boolean;
  cleanupWarning?: boolean;
};

const GENERIC_ERROR = 'Could not save your avatar. Please try again.';

export function assertOwnedAvatarStoragePath(
  path: string,
  profile: { id: string; tenant_id: string; owner_user_id: string },
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

  if (segments.resourceType !== 'avatar') {
    return { ok: false };
  }
  if (segments.tenantId !== profile.tenant_id) {
    return { ok: false };
  }
  if (segments.ownerUserId !== profile.owner_user_id || segments.ownerUserId !== userId) {
    return { ok: false };
  }
  if (segments.resourceId !== profile.id) {
    return { ok: false };
  }

  const bucket = bucketForStorageResourceType('avatar');
  if (bucket !== STORAGE_BUCKETS.avatars) {
    return { ok: false };
  }

  return { ok: true };
}

async function avatarObjectExists(supabase: SupabaseClient, path: string): Promise<boolean> {
  const slash = path.lastIndexOf('/');
  const folder = slash >= 0 ? path.slice(0, slash) : '';
  const filename = path.slice(slash + 1);
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.avatars)
    .list(folder, { limit: 1, search: filename });

  if (error) {
    return false;
  }

  return (data ?? []).some((item) => item.name === filename);
}

export async function executeFinalizeAvatarUpload(
  supabase: SupabaseClient,
  input: { path: string },
  options?: { user?: AuthUser | null },
): Promise<AvatarFinalizeState> {
  if (typeof input.path !== 'string' || !input.path.trim() || input.path !== input.path.trim()) {
    return { error: GENERIC_ERROR };
  }

  if (/^https?:\/\//i.test(input.path)) {
    return { error: GENERIC_ERROR };
  }

  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) {
    return { error: resolved.error };
  }

  const profile = resolved.profile;
  const pathCheck = assertOwnedAvatarStoragePath(input.path, profile, user.id);
  if (!pathCheck.ok) {
    return { error: GENERIC_ERROR };
  }

  const exists = await avatarObjectExists(supabase, input.path);
  if (!exists) {
    return { error: GENERIC_ERROR };
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', profile.id)
    .single();

  const previousPath = extractAvatarPathFromPublicUrl(currentProfile?.avatar_url ?? null);
  if (previousPath && previousPath === input.path) {
    await completeUploadIntentAfterFinalize(supabase, input.path);
    return {
      success: true,
      avatarUrl: getPublicAvatarUrl(supabase, input.path),
      slug: profile.slug,
      isPublic: profile.is_public,
    };
  }

  const verified = await requireVerifiedRasterObjectForFinalize(supabase, {
    path: input.path,
    resourceType: 'avatar',
  });
  if (!verified.ok) {
    return { error: GENERIC_ERROR };
  }

  const avatarUrl = getPublicAvatarUrl(supabase, input.path);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', profile.id);

  if (updateError) {
    await bestEffortRemoveTrustedStorageObject(supabase, {
      resourceType: 'avatar',
      path: input.path,
    });
    return { error: GENERIC_ERROR };
  }

  await completeUploadIntentAfterFinalize(supabase, input.path);

  let cleanupWarning = false;
  if (previousPath && previousPath !== input.path) {
    const previousCheck = assertOwnedAvatarStoragePath(previousPath, profile, user.id);
    if (previousCheck.ok) {
      const cleanup = await bestEffortRemoveTrustedStorageObject(supabase, {
        resourceType: 'avatar',
        path: previousPath,
      });
      cleanupWarning = !cleanup.cleaned;
    }
  }

  return {
    success: true,
    avatarUrl,
    slug: profile.slug,
    isPublic: profile.is_public,
    cleanupWarning: cleanupWarning || undefined,
  };
}

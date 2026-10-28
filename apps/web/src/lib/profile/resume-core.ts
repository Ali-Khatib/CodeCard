import { FILE_LIMITS, STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { looksLikePdfMagic } from '@/lib/storage/content-signature';
import { getTrustedAppOrigin } from '@/lib/sharing/qr';
import { resolveOwnedProfile, type AuthUser } from '@/lib/profile/profile-auth-core';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';

export const RESUME_UPLOAD_BUCKET = STORAGE_BUCKETS.resumes;
export const RESUME_FILENAME = 'cv.pdf';
export const RESUME_MAX_BYTES = FILE_LIMITS.document.maxBytes;
export const RESUME_MIME = 'application/pdf';
/** Signed download lifetime for public resume links. */
export const RESUME_SIGNED_URL_SECONDS = 60 * 10;

export type ResumeFinalizeState = {
  success?: boolean;
  error?: string;
  resumeUrl?: string;
  slug?: string;
};

export type ResumeDownloadResult =
  | { ok: true; signedUrl: string; filename: string }
  | { ok: false; status: 404 | 403 | 500; message: string };

const GENERIC_ERROR = 'Could not save your CV. Please try again.';

export function buildResumeStoragePath(ownerUserId: string): string {
  return `${ownerUserId}/${RESUME_FILENAME}`;
}

export function buildPublicResumePath(slug: string): string | null {
  const normalized = normalizePublicProfileSlug(slug);
  return normalized ? `/${normalized}/resume` : null;
}

export function buildPublicResumeAbsoluteUrl(slug: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const path = buildPublicResumePath(slug);
  const origin = getTrustedAppOrigin(env);
  if (!path || !origin) return null;
  return `${origin}${path}`;
}

export function assertOwnedResumeStoragePath(
  path: string,
  ownerUserId: string,
): { ok: true } | { ok: false } {
  if (path.includes('://') || path.startsWith('/') || path.includes('..') || path.includes('\\')) {
    return { ok: false };
  }
  if (path !== buildResumeStoragePath(ownerUserId)) {
    return { ok: false };
  }
  return { ok: true };
}

export function validateResumeUploadMeta(input: {
  mimeType: string;
  size: number;
  contentPrefix: Uint8Array;
}): { ok: true } | { ok: false; status: 400 | 413 | 415; message: string } {
  if (input.mimeType !== RESUME_MIME) {
    return { ok: false, status: 415, message: 'Upload a PDF CV.' };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, status: 400, message: 'Invalid file.' };
  }
  if (input.size > RESUME_MAX_BYTES) {
    return { ok: false, status: 413, message: 'CV must be 10 MB or smaller.' };
  }
  if (!looksLikePdfMagic(input.contentPrefix)) {
    return { ok: false, status: 415, message: 'Upload a PDF CV.' };
  }
  return { ok: true };
}

async function resumeObjectExists(supabase: SupabaseClient, ownerUserId: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(RESUME_UPLOAD_BUCKET)
    .list(ownerUserId, { limit: 5, search: RESUME_FILENAME });
  if (error) return false;
  return (data ?? []).some((item) => item.name === RESUME_FILENAME);
}

async function upsertResumeProfileLink(
  supabase: SupabaseClient,
  profile: { id: string; tenant_id: string; slug: string },
): Promise<{ ok: true; resumeUrl: string } | { ok: false }> {
  const resumeUrl = buildPublicResumeAbsoluteUrl(profile.slug);
  if (!resumeUrl) return { ok: false };

  const { data: existing } = await supabase
    .from('profile_links')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('type', 'resume')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('profile_links')
      .update({ label: 'Resume', url: resumeUrl })
      .eq('id', existing.id)
      .eq('profile_id', profile.id);
    if (error) return { ok: false };
  } else {
    const { count } = await supabase
      .from('profile_links')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id);
    const { error } = await supabase.from('profile_links').insert({
      tenant_id: profile.tenant_id,
      profile_id: profile.id,
      type: 'resume',
      label: 'Resume',
      url: resumeUrl,
      sort_order: count ?? 0,
    });
    if (error) return { ok: false };
  }

  return { ok: true, resumeUrl };
}

export async function executeFinalizeResumeUpload(
  supabase: SupabaseClient,
  input: { path: string },
  options?: { user?: AuthUser | null },
): Promise<ResumeFinalizeState> {
  if (typeof input.path !== 'string' || !input.path.trim() || input.path !== input.path.trim()) {
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
  const { profile } = resolved;

  if (!assertOwnedResumeStoragePath(input.path, profile.owner_user_id).ok) {
    return { error: GENERIC_ERROR };
  }

  const exists = await resumeObjectExists(supabase, profile.owner_user_id);
  if (!exists) {
    return { error: GENERIC_ERROR };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ resume_url: input.path, hide_resume: false })
    .eq('id', profile.id)
    .eq('owner_user_id', user.id);

  if (profileError) {
    return { error: GENERIC_ERROR };
  }

  const linked = await upsertResumeProfileLink(supabase, {
    id: profile.id,
    tenant_id: profile.tenant_id,
    slug: profile.slug,
  });
  if (!linked.ok) {
    return { error: GENERIC_ERROR };
  }

  return {
    success: true,
    resumeUrl: linked.resumeUrl,
    slug: profile.slug,
  };
}

export async function executeRemoveResume(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<ResumeFinalizeState> {
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
  const { profile } = resolved;
  const path = buildResumeStoragePath(profile.owner_user_id);

  await supabase.storage.from(RESUME_UPLOAD_BUCKET).remove([path]);

  await supabase
    .from('profiles')
    .update({ resume_url: null })
    .eq('id', profile.id)
    .eq('owner_user_id', user.id);

  await supabase.from('profile_links').delete().eq('profile_id', profile.id).eq('type', 'resume');

  return { success: true, slug: profile.slug };
}

/**
 * Public CV download for a published profile. Uses the service client for signed URLs.
 */
export async function resolvePublicResumeDownload(
  anonOrServer: SupabaseClient,
  service: SupabaseClient,
  slug: string,
): Promise<ResumeDownloadResult> {
  const normalized = normalizePublicProfileSlug(slug);
  if (!normalized) {
    return { ok: false, status: 404, message: 'Not found.' };
  }

  const { data: profile, error } = await anonOrServer
    .from('profiles')
    .select('id, owner_user_id, resume_url, hide_resume, is_public, display_name, slug')
    .eq('slug', normalized)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, status: 404, message: 'Not found.' };
  }
  if (profile.hide_resume) {
    return { ok: false, status: 404, message: 'Not found.' };
  }

  const storagePath =
    typeof profile.resume_url === 'string' && profile.resume_url.trim()
      ? profile.resume_url.trim()
      : buildResumeStoragePath(profile.owner_user_id);

  if (!assertOwnedResumeStoragePath(storagePath, profile.owner_user_id).ok) {
    return { ok: false, status: 404, message: 'Not found.' };
  }

  const { data, error: signedError } = await service.storage
    .from(RESUME_UPLOAD_BUCKET)
    .createSignedUrl(storagePath, RESUME_SIGNED_URL_SECONDS, {
      download: `${profile.slug || normalized}-resume.pdf`,
    });

  if (signedError || !data?.signedUrl) {
    return { ok: false, status: 404, message: 'Not found.' };
  }

  return {
    ok: true,
    signedUrl: data.signedUrl,
    filename: `${profile.slug || normalized}-resume.pdf`,
  };
}

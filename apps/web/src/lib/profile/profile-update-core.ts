import {
  audienceRoleSchema,
  isReservedProfileSlug,
  normalizeProfileLocation,
  PROFILE_SLUG_TAKEN_MESSAGE,
  RESERVED_PROFILE_SLUG_MESSAGE,
  updateProfileSchema,
  parseCommaSeparatedSkills,
  type AudienceRole,
} from '@codecard/validation';
import type { CardHistory, Profile } from '@codecard/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { historyFieldFromPath } from '@/lib/profile/profile-form';

export type ProfileUpdateFieldErrors = Partial<
  Record<
    | 'display_name'
    | 'headline'
    | 'bio'
    | 'location'
    | 'history_working'
    | 'history_before'
    | 'history_studying'
    | 'history_studied'
    | 'skills'
    | 'slug'
    | 'audience_role',
    string
  >
>;

export type ProfileUpdateCode =
  | 'unauthenticated'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'database';

/** Server-only phase timings. Callers must not send this object to the browser. */
export type ProfileUpdateDiagnostics = {
  authMs: number;
  readMs: number;
  writeMs: number;
};

export const PROFILE_SAVE_CONFLICT_MESSAGE =
  'This profile was updated in another session. Reload the page, then save again.';

export type ProfileUpdateState = {
  success?: boolean;
  error?: string;
  code?: ProfileUpdateCode;
  fieldErrors?: ProfileUpdateFieldErrors;
  previousSlug?: string;
  nextSlug?: string;
  /** Present when the row was already stored. Lets the editor save again without a false conflict. */
  updatedAt?: string;
  /** True when the submitted fields already match the stored row, so no write ran. */
  unchanged?: boolean;
  diagnostics?: ProfileUpdateDiagnostics;
};

export type OwnedProfileRow = Pick<
  Profile,
  | 'id'
  | 'tenant_id'
  | 'owner_user_id'
  | 'slug'
  | 'display_name'
  | 'headline'
  | 'bio'
  | 'location'
  | 'card_history'
  | 'skills'
  | 'is_public'
  | 'audience_role'
  | 'updated_at'
>;

const PROFILE_UPDATE_COLUMNS =
  'id, tenant_id, owner_user_id, slug, display_name, headline, bio, location, card_history, skills, is_public, audience_role, updated_at';

const profileEditSchema = updateProfileSchema.omit({ is_public: true }).extend({
  audience_role: audienceRoleSchema,
});

export function parseTrustedProfileFormData(formData: FormData) {
  return {
    display_name: String(formData.get('display_name') ?? ''),
    headline: String(formData.get('headline') ?? '') || null,
    slug: String(formData.get('slug') ?? '').toLowerCase(),
    bio: String(formData.get('bio') ?? '') || null,
    location: String(formData.get('location') ?? ''),
    card_history: {
      working: String(formData.get('history_working') ?? ''),
      before: String(formData.get('history_before') ?? ''),
      studying: String(formData.get('history_studying') ?? ''),
      studied: String(formData.get('history_studied') ?? ''),
    },
    skills: parseCommaSeparatedSkills(String(formData.get('skills') ?? '')),
    audience_role: String(formData.get('audience_role') ?? ''),
  };
}

export function buildProfileFormData(form: {
  display_name: string;
  headline: string;
  slug: string;
  bio: string;
  location: string;
  skillsInput: string;
  audience_role: string;
  history_working?: string;
  history_before?: string;
  history_studying?: string;
  history_studied?: string;
  updatedAt?: string;
}): FormData {
  const fd = new FormData();
  fd.set('display_name', form.display_name);
  fd.set('headline', form.headline);
  fd.set('slug', form.slug);
  fd.set('bio', form.bio);
  fd.set('location', form.location);
  fd.set('history_working', form.history_working ?? '');
  fd.set('history_before', form.history_before ?? '');
  fd.set('history_studying', form.history_studying ?? '');
  fd.set('history_studied', form.history_studied ?? '');
  fd.set('skills', form.skillsInput);
  fd.set('audience_role', form.audience_role);
  if (form.updatedAt) fd.set('updated_at', form.updatedAt);
  return fd;
}

export function pickAllowedProfileUpdate(
  data: Record<string, unknown>,
): Omit<OwnedProfileRow, 'id' | 'tenant_id' | 'owner_user_id' | 'is_public' | 'updated_at'> & {
  audience_role: AudienceRole;
} {
  return {
    display_name: data.display_name as string,
    headline: (data.headline as string | null | undefined) ?? null,
    slug: data.slug as string,
    bio: (data.bio as string | null | undefined) ?? null,
    location: (data.location as string | null | undefined) ?? null,
    card_history: (data.card_history as CardHistory | null | undefined) ?? null,
    skills: (data.skills as string[]) ?? [],
    audience_role: data.audience_role as AudienceRole,
  };
}

export function validateProfileEditPayload(payload: ReturnType<typeof parseTrustedProfileFormData>) {
  return profileEditSchema.safeParse(payload);
}

export function mapProfileUpdateDbError(error: { code?: string; message?: string }): ProfileUpdateState {
  if (error.code === '23505') {
    return {
      code: 'validation',
      fieldErrors: { slug: PROFILE_SLUG_TAKEN_MESSAGE },
      error: PROFILE_SLUG_TAKEN_MESSAGE,
    };
  }
  return { code: 'database', error: 'Could not save your profile. Please try again.' };
}

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizedHistory(value: CardHistory | null | undefined) {
  const working = blankToNull(value?.working);
  const before = blankToNull(value?.before);
  const studying = blankToNull(value?.studying);
  const studied = blankToNull(value?.studied);
  if (!working && !before && !studying && !studied) return null;
  return { working, before, studying, studied };
}

function sameSkills(current: string[] | null | undefined, next: string[]): boolean {
  const left = current ?? [];
  if (left.length !== next.length) return false;
  return left.every((skill, index) => skill === next[index]);
}

/** True when a write would store the same public profile fields the row already has. */
export function profileUpdateIsNoop(
  current: Pick<
    OwnedProfileRow,
    'display_name' | 'headline' | 'slug' | 'bio' | 'location' | 'card_history' | 'skills' | 'audience_role'
  >,
  next: ReturnType<typeof pickAllowedProfileUpdate>,
): boolean {
  return (
    blankToNull(current.display_name) === blankToNull(next.display_name) &&
    blankToNull(current.headline) === blankToNull(next.headline) &&
    current.slug === next.slug &&
    blankToNull(current.bio) === blankToNull(next.bio) &&
    normalizeProfileLocation(current.location) === normalizeProfileLocation(next.location) &&
    (current.audience_role ?? null) === next.audience_role &&
    sameSkills(current.skills, next.skills) &&
    JSON.stringify(normalizedHistory(current.card_history)) ===
      JSON.stringify(normalizedHistory(next.card_history))
  );
}

export async function checkProfileSlugAvailability(
  supabase: SupabaseClient,
  slug: string,
  profile: { id: string; tenant_id: string },
): Promise<string | null> {
  if (isReservedProfileSlug(slug)) {
    return RESERVED_PROFILE_SLUG_MESSAGE;
  }

  const [{ data: otherProfile }, { data: otherTenant }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id')
      .eq('slug', slug)
      .neq('id', profile.id)
      .maybeSingle(),
    supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .neq('id', profile.tenant_id)
      .maybeSingle(),
  ]);

  if (otherProfile || otherTenant) {
    return PROFILE_SLUG_TAKEN_MESSAGE;
  }

  return null;
}

type AuthUser = { id: string };

export async function executeProfileUpdate(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProfileUpdateState> {
  const authStarted = performance.now();
  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }
  const authMs = Math.round(performance.now() - authStarted);
  const diagnostics = (readMs: number, writeMs: number): ProfileUpdateDiagnostics => ({
    authMs,
    readMs,
    writeMs,
  });

  if (!user) {
    return {
      code: 'unauthenticated',
      error: 'You must be signed in to update your profile.',
      diagnostics: diagnostics(0, 0),
    };
  }

  const readStarted = performance.now();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_UPDATE_COLUMNS)
    .eq('owner_user_id', user.id)
    .single();
  const readMs = Math.round(performance.now() - readStarted);

  if (profileError || !profile) {
    return {
      code: 'not_found',
      error: 'Profile not found.',
      diagnostics: diagnostics(readMs, 0),
    };
  }

  const parsed = validateProfileEditPayload(parseTrustedProfileFormData(formData));
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const path = first?.path ?? [];
    const field = historyFieldFromPath(path) ?? path[0];
    const message = first?.message ?? 'Invalid profile details.';
    if (typeof field === 'string') {
      return {
        code: 'validation',
        fieldErrors: { [field]: message } as ProfileUpdateFieldErrors,
        error: message,
        diagnostics: diagnostics(readMs, 0),
      };
    }
    return { code: 'validation', error: message, diagnostics: diagnostics(readMs, 0) };
  }

  const updatePayload = pickAllowedProfileUpdate(parsed.data);
  const previousSlug = profile.slug;
  const slugChanged = updatePayload.slug !== previousSlug;

  const slugIssue = slugChanged
    ? await checkProfileSlugAvailability(supabase, updatePayload.slug, profile)
    : null;
  if (slugIssue) {
    return {
      code: 'validation',
      fieldErrors: { slug: slugIssue },
      error: slugIssue,
      diagnostics: diagnostics(readMs, 0),
    };
  }

  const stored = profile as OwnedProfileRow;
  if (profileUpdateIsNoop(stored, updatePayload)) {
    return {
      success: true,
      unchanged: true,
      previousSlug,
      nextSlug: updatePayload.slug,
      updatedAt: stored.updated_at,
      diagnostics: diagnostics(readMs, 0),
    };
  }

  const expectedUpdatedAt = String(formData.get('updated_at') ?? '').trim();
  if (expectedUpdatedAt && stored.updated_at && expectedUpdatedAt !== stored.updated_at) {
    return {
      code: 'conflict',
      error: PROFILE_SAVE_CONFLICT_MESSAGE,
      diagnostics: diagnostics(readMs, 0),
    };
  }

  const writeStarted = performance.now();
  const write = supabase.from('profiles').update(updatePayload).eq('id', stored.id);
  const versioned =
    expectedUpdatedAt && stored.updated_at ? write.eq('updated_at', expectedUpdatedAt) : write;
  const { data: written, error: updateError } = await versioned.select('updated_at').maybeSingle();
  const writeMs = Math.round(performance.now() - writeStarted);

  if (updateError) {
    return { ...mapProfileUpdateDbError(updateError), diagnostics: diagnostics(readMs, writeMs) };
  }

  const writtenAt = (written as { updated_at?: string } | null)?.updated_at;
  if (!writtenAt) {
    return {
      code: 'conflict',
      error: PROFILE_SAVE_CONFLICT_MESSAGE,
      diagnostics: diagnostics(readMs, writeMs),
    };
  }

  return {
    success: true,
    previousSlug,
    nextSlug: updatePayload.slug,
    updatedAt: writtenAt,
    diagnostics: diagnostics(readMs, writeMs),
  };
}

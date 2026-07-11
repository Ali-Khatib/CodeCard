import { updateProfileSchema, parseCommaSeparatedSkills } from '@codecard/validation';
import type { Profile } from '@codecard/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfileUpdateFieldErrors = Partial<
  Record<'display_name' | 'headline' | 'bio' | 'location' | 'skills' | 'slug', string>
>;

export type ProfileUpdateState = {
  success?: boolean;
  error?: string;
  fieldErrors?: ProfileUpdateFieldErrors;
  previousSlug?: string;
  nextSlug?: string;
};

export type OwnedProfileRow = Pick<
  Profile,
  'id' | 'tenant_id' | 'owner_user_id' | 'slug' | 'display_name' | 'headline' | 'bio' | 'location' | 'skills' | 'is_public'
>;

const profileEditSchema = updateProfileSchema.omit({ is_public: true });

export function parseTrustedProfileFormData(formData: FormData) {
  return {
    display_name: String(formData.get('display_name') ?? ''),
    headline: String(formData.get('headline') ?? '') || null,
    slug: String(formData.get('slug') ?? '').toLowerCase(),
    bio: String(formData.get('bio') ?? '') || null,
    location: String(formData.get('location') ?? ''),
    skills: parseCommaSeparatedSkills(String(formData.get('skills') ?? '')),
  };
}

export function buildProfileFormData(form: {
  display_name: string;
  headline: string;
  slug: string;
  bio: string;
  location: string;
  skillsInput: string;
}): FormData {
  const fd = new FormData();
  fd.set('display_name', form.display_name);
  fd.set('headline', form.headline);
  fd.set('slug', form.slug);
  fd.set('bio', form.bio);
  fd.set('location', form.location);
  fd.set('skills', form.skillsInput);
  return fd;
}

export function pickAllowedProfileUpdate(
  data: Record<string, unknown>,
): Omit<OwnedProfileRow, 'id' | 'tenant_id' | 'owner_user_id' | 'is_public'> {
  return {
    display_name: data.display_name as string,
    headline: (data.headline as string | null | undefined) ?? null,
    slug: data.slug as string,
    bio: (data.bio as string | null | undefined) ?? null,
    location: (data.location as string | null | undefined) ?? null,
    skills: (data.skills as string[]) ?? [],
  };
}

export function validateProfileEditPayload(payload: ReturnType<typeof parseTrustedProfileFormData>) {
  return profileEditSchema.safeParse(payload);
}

export function mapProfileUpdateDbError(_error: { code?: string; message?: string }): ProfileUpdateState {
  return { error: 'Could not save your profile. Please try again.' };
}

type AuthUser = { id: string };

export async function executeProfileUpdate(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProfileUpdateState> {
  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  if (!user) {
    return { error: 'You must be signed in to update your profile.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id, slug, display_name, headline, bio, location, skills, is_public')
    .eq('owner_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Profile not found.' };
  }

  const parsed = validateProfileEditPayload(parseTrustedProfileFormData(formData));
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    const message = first?.message ?? 'Invalid profile details.';
    if (typeof field === 'string') {
      return {
        fieldErrors: { [field]: message } as ProfileUpdateFieldErrors,
        error: message,
      };
    }
    return { error: message };
  }

  const updatePayload = pickAllowedProfileUpdate(parsed.data);
  const previousSlug = profile.slug;

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', profile.id);

  if (updateError) {
    return mapProfileUpdateDbError(updateError);
  }

  return {
    success: true,
    previousSlug,
    nextSlug: updatePayload.slug,
  };
}

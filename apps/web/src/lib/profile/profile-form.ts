import type { Profile } from '@codecard/types';
import {
  parseCommaSeparatedSkills,
  updateProfileSchema,
} from '@codecard/validation';
import type { z } from 'zod';

export type ProfileFormState = {
  display_name: string;
  headline: string;
  slug: string;
  bio: string;
  location: string;
  skillsInput: string;
  is_public: boolean;
  audience_role: string;
};

export function profileToFormState(profile: Profile): ProfileFormState {
  return {
    display_name: profile.display_name,
    headline: profile.headline ?? '',
    slug: profile.slug,
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    skillsInput: (profile.skills ?? []).join(', '),
    is_public: profile.is_public,
    audience_role: profile.audience_role ?? '',
  };
}

export function formStateToUpdatePayload(form: ProfileFormState) {
  return {
    display_name: form.display_name,
    headline: form.headline || null,
    slug: form.slug,
    bio: form.bio || null,
    location: form.location,
    skills: parseCommaSeparatedSkills(form.skillsInput),
    is_public: form.is_public,
    // Keep the raw role so updateProfileSchema can reject values outside the enum.
    audience_role: form.audience_role || null,
  };
}

export function parseProfileUpdate(
  form: ProfileFormState,
):
  | { success: true; data: z.infer<typeof updateProfileSchema> }
  | { success: false; message: string; field?: string } {
  const payload = formStateToUpdatePayload(form);
  const parsed = updateProfileSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    return {
      success: false,
      message: first?.message ?? 'Invalid input',
      field: typeof field === 'string' ? field : undefined,
    };
  }
  return { success: true, data: parsed.data };
}

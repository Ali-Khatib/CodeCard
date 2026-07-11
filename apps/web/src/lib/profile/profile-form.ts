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
  };
}

export function formStateToUpdatePayload(
  form: ProfileFormState,
): z.infer<typeof updateProfileSchema> {
  return {
    display_name: form.display_name,
    headline: form.headline || null,
    slug: form.slug,
    bio: form.bio || null,
    location: form.location,
    skills: parseCommaSeparatedSkills(form.skillsInput),
    is_public: form.is_public,
  };
}

export function parseProfileUpdate(
  form: ProfileFormState,
):
  | { success: true; data: z.infer<typeof updateProfileSchema> }
  | { success: false; message: string } {
  const payload = formStateToUpdatePayload(form);
  const parsed = updateProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors[0]?.message ?? 'Invalid input',
    };
  }
  return { success: true, data: parsed.data };
}

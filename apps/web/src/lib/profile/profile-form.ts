import type { Profile } from '@codecard/types';
import {
  isAudienceRole,
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
  history_working: string;
  history_before: string;
  history_studying: string;
  history_studied: string;
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
    history_working: profile.card_history?.working ?? '',
    history_before: profile.card_history?.before ?? '',
    history_studying: profile.card_history?.studying ?? '',
    history_studied: profile.card_history?.studied ?? '',
    skillsInput: (profile.skills ?? []).join(', '),
    is_public: profile.is_public,
    audience_role: profile.audience_role ?? '',
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
    card_history: {
      working: form.history_working,
      before: form.history_before,
      studying: form.history_studying,
      studied: form.history_studied,
    },
    skills: parseCommaSeparatedSkills(form.skillsInput),
    is_public: form.is_public,
    audience_role: isAudienceRole(form.audience_role) ? form.audience_role : null,
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
    const path = first?.path ?? [];
    const field = historyFieldFromPath(path) ?? path[0];
    return {
      success: false,
      message: first?.message ?? 'Invalid input',
      field: typeof field === 'string' ? field : undefined,
    };
  }
  return { success: true, data: parsed.data };
}

export function historyFieldFromPath(path: ReadonlyArray<PropertyKey>): string | undefined {
  if (path.includes('working')) return 'history_working';
  if (path.includes('before')) return 'history_before';
  if (path.includes('studying')) return 'history_studying';
  if (path.includes('studied')) return 'history_studied';
  return undefined;
}

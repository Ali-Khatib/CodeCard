import type { ProfileUpdateState } from '@/lib/profile/profile-update-core';

type ProfileSaveResponse = {
  success?: boolean;
  error?: string;
  fieldErrors?: ProfileUpdateState['fieldErrors'];
  updatedAt?: string;
};

/**
 * Confirmed persistence only. A network failure or non-success status never
 * reports success, and this request does not wait for a dashboard re-render.
 */
export async function postProfileSave(formData: FormData): Promise<ProfileUpdateState> {
  let response: Response;
  try {
    response = await fetch('/api/profile', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch {
    return { error: 'Could not save your profile. Please try again.' };
  }

  let body: ProfileSaveResponse | null = null;
  try {
    body = (await response.json()) as ProfileSaveResponse;
  } catch {
    body = null;
  }

  if (!response.ok || body?.success !== true) {
    return {
      error: body?.error || 'Could not save your profile. Please try again.',
      fieldErrors: body?.fieldErrors,
    };
  }

  return { success: true, updatedAt: body.updatedAt };
}

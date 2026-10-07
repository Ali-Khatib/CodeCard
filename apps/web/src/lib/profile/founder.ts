/**
 * Hard-gated founder flex — only this account gets the elite public treatment.
 * Do not infer from audience_role (that is a viewer taxonomy, not an honorific).
 */
export const FOUNDER_PROFILE_ID = 'f0aeb4f9-b5e3-4805-b1ec-22c413922b78' as const;
export const FOUNDER_PROFILE_SLUG = 'ali-the-founder' as const;

export function isFounderProfile(input: {
  profileId?: string | null;
  profileSlug?: string | null;
}): boolean {
  if (input.profileId === FOUNDER_PROFILE_ID) return true;
  if (input.profileSlug?.trim().toLowerCase() === FOUNDER_PROFILE_SLUG) return true;
  return false;
}

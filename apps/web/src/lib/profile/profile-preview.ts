export function getSavedProfilePreviewHref(profile: {
  slug: string;
  is_public: boolean;
}): string {
  if (profile.is_public) {
    return `/${profile.slug}`;
  }
  return '/dashboard/profile/preview';
}

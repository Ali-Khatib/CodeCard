import { publicDemoProfileBasePath } from '@/lib/marketing/demo-url';

export function getSavedProfilePreviewHref(profile: {
  slug: string;
  is_public: boolean;
}): string {
  if (profile.is_public) {
    return publicDemoProfileBasePath(profile.slug);
  }
  return '/dashboard/profile/preview';
}

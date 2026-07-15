import { createClient } from '@/lib/supabase/server';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';
import {
  PUBLIC_OG_IMAGE_ALT,
  PUBLIC_OG_IMAGE_CONTENT_TYPE,
  PUBLIC_OG_IMAGE_SIZE,
  renderGenericPublicOgImage,
  renderPublicProjectOgImage,
} from '@/lib/profile/public-og-image-response';

export const alt = PUBLIC_OG_IMAGE_ALT;
export const size = PUBLIC_OG_IMAGE_SIZE;
export const contentType = PUBLIC_OG_IMAGE_CONTENT_TYPE;

interface ImageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function PublicProjectOpengraphImage({ params }: ImageProps) {
  const { slug: rawSlug, id } = await params;
  const slug = normalizePublicProfileSlug(rawSlug);
  if (!slug || !id?.trim()) {
    return renderGenericPublicOgImage();
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (!profile) {
    return renderGenericPublicOgImage();
  }

  const { data: project } = await supabase
    .from('projects')
    .select('title')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .eq('is_published', true)
    .maybeSingle();

  if (!project) {
    return renderGenericPublicOgImage();
  }

  return renderPublicProjectOgImage({
    projectTitle: project.title,
    profileDisplayName: profile.display_name,
  });
}

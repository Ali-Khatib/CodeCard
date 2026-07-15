import { createClient } from '@/lib/supabase/server';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';
import {
  PUBLIC_OG_IMAGE_ALT,
  PUBLIC_OG_IMAGE_CONTENT_TYPE,
  PUBLIC_OG_IMAGE_SIZE,
  renderGenericPublicOgImage,
  renderPublicProfileOgImage,
} from '@/lib/profile/public-og-image-response';

export const alt = PUBLIC_OG_IMAGE_ALT;
export const size = PUBLIC_OG_IMAGE_SIZE;
export const contentType = PUBLIC_OG_IMAGE_CONTENT_TYPE;

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicProfileOpengraphImage({ params }: ImageProps) {
  const { slug: rawSlug } = await params;
  const slug = normalizePublicProfileSlug(rawSlug);
  if (!slug) {
    return renderGenericPublicOgImage();
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('slug, display_name, headline')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (!profile) {
    return renderGenericPublicOgImage();
  }

  return renderPublicProfileOgImage({
    displayName: profile.display_name,
    headline: profile.headline,
    handle: profile.slug,
  });
}

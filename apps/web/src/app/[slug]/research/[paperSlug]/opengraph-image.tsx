import { normalizeResearchSlug } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';
import {
  PUBLIC_OG_IMAGE_ALT,
  PUBLIC_OG_IMAGE_CONTENT_TYPE,
  PUBLIC_OG_IMAGE_SIZE,
  renderGenericPublicOgImage,
  renderPublicResearchOgImage,
} from '@/lib/profile/public-og-image-response';

export const alt = PUBLIC_OG_IMAGE_ALT;
export const size = PUBLIC_OG_IMAGE_SIZE;
export const contentType = PUBLIC_OG_IMAGE_CONTENT_TYPE;

interface ImageProps {
  params: Promise<{ slug: string; paperSlug: string }>;
}

export default async function PublicResearchOpengraphImage({ params }: ImageProps) {
  const { slug: rawSlug, paperSlug: rawPaperSlug } = await params;
  const slug = normalizePublicProfileSlug(rawSlug);
  const paperSlug = rawPaperSlug ? normalizeResearchSlug(rawPaperSlug) : '';
  if (!slug || !paperSlug) {
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

  const { data: paper } = await supabase
    .from('research_papers')
    .select('title')
    .eq('profile_id', profile.id)
    .eq('slug', paperSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (!paper) {
    return renderGenericPublicOgImage();
  }

  return renderPublicResearchOgImage({
    paperTitle: paper.title,
    profileDisplayName: profile.display_name,
  });
}

import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isAbsoluteMediaUrl } from '@/lib/projects/project-media-url';

export function getPublicResearchFigureUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.projectMedia)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Resolve a figure for display. Prefer canonical storage_path.
 * Legacy rows may have an absolute HTTPS image_url with null storage_path.
 * Never treat signed/Blob URLs as authoritative persistence.
 */
export function resolveResearchFigureDisplayUrl(
  supabase: SupabaseClient,
  figure: { storage_path?: string | null; image_url?: string | null },
): string | null {
  const path = figure.storage_path?.trim();
  if (path) {
    if (isAbsoluteMediaUrl(path)) {
      return null;
    }
    return getPublicResearchFigureUrl(supabase, path);
  }

  const imageUrl = figure.image_url?.trim();
  if (!imageUrl) return null;
  if (isAbsoluteMediaUrl(imageUrl)) return imageUrl;
  return getPublicResearchFigureUrl(supabase, imageUrl);
}

export function createResearchFigureUrlResolver(supabase: SupabaseClient) {
  return (figure: { storage_path?: string | null; image_url?: string | null }) =>
    resolveResearchFigureDisplayUrl(supabase, figure);
}

export function researchFigureAltText(caption: string | null | undefined): string {
  const trimmed = caption?.trim();
  if (trimmed) return trimmed;
  // Legacy figures without captions: non-filename fallback (known a11y debt).
  return 'Research figure';
}

import type { Metadata } from 'next';
import {
  normalizeResearchPaper,
  type ResearchFigureDisplayResolver,
  type ResearchPaper,
} from '@/lib/research/research';
import {
  buildPublicResearchPageMetadata,
  buildPublicResearchPath as buildSharedPublicResearchPath,
  normalizePublicMetadataText,
  PUBLIC_METADATA_DESCRIPTION_MAX,
} from '@/lib/profile/public-metadata';

export const PUBLIC_RESEARCH_PAPER_SELECT =
  'id, slug, title, abstract, authors, venue, publication_status, year, pdf_url, doi_url, citation_text, tags, cover_image_url, related_project_id, research_figures(id, image_url, storage_path, caption, sort_order), related_project:related_project_id(id, title, is_published)';

export function truncatePlainText(value: string, maxLength: number): string {
  return normalizePublicMetadataText(value, maxLength);
}

export function buildPublicResearchPath(profileSlug: string, paperSlug: string): string {
  return buildSharedPublicResearchPath(profileSlug, paperSlug);
}

export function buildPublicResearchMetadata(input: {
  profileDisplayName: string;
  paperTitle: string;
  abstract: string | null;
  profileSlug: string;
  paperSlug: string;
}): Metadata {
  return buildPublicResearchPageMetadata({
    profileDisplayName: input.profileDisplayName,
    paperTitle: input.paperTitle,
    abstract: input.abstract,
    profileSlug: input.profileSlug,
    paperSlug: input.paperSlug,
  });
}

export function toPublicResearchPaper(
  paper: Parameters<typeof normalizeResearchPaper>[0],
  profileSlug: string,
  resolveFigureUrl?: ResearchFigureDisplayResolver,
): ResearchPaper {
  return normalizeResearchPaper(paper, profileSlug, {
    resolveFigureUrl,
  });
}

/** Fields that must never appear on the public research client payload. */
export const FORBIDDEN_PUBLIC_RESEARCH_KEYS = [
  'tenant_id',
  'owner_user_id',
  'profile_id',
  'is_published',
  'sort_order',
  'created_at',
  'updated_at',
  'storage_path',
] as const;

export { PUBLIC_METADATA_DESCRIPTION_MAX };

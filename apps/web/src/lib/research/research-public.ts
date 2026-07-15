import type { Metadata } from 'next';
import { normalizeResearchPaper, type ResearchPaper } from '@/lib/research/research';

export const PUBLIC_RESEARCH_PAPER_SELECT =
  'id, slug, title, abstract, authors, venue, publication_status, year, pdf_url, doi_url, citation_text, tags, cover_image_url, related_project_id, research_figures(id, image_url, caption, sort_order), related_project:related_project_id(id, title, is_published)';

export function truncatePlainText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function buildPublicResearchPath(profileSlug: string, paperSlug: string): string {
  return `/${profileSlug}/research/${paperSlug}`;
}

export function buildPublicResearchMetadata(input: {
  profileDisplayName: string;
  paperTitle: string;
  abstract: string | null;
  profileSlug: string;
  paperSlug: string;
}): Metadata {
  const description = input.abstract
    ? truncatePlainText(input.abstract, 160)
    : `${input.paperTitle} by ${input.profileDisplayName} on CodeCard`;

  return {
    title: `${input.paperTitle} · ${input.profileDisplayName}`,
    description,
    alternates: {
      canonical: buildPublicResearchPath(input.profileSlug, input.paperSlug),
    },
    openGraph: {
      title: `${input.paperTitle} · ${input.profileDisplayName}`,
      description,
      type: 'article',
    },
  };
}

export function toPublicResearchPaper(
  paper: Parameters<typeof normalizeResearchPaper>[0],
  profileSlug: string,
): ResearchPaper {
  return normalizeResearchPaper(paper, profileSlug);
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
] as const;

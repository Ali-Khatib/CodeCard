import { isAbsoluteMediaUrl } from '@/lib/projects/project-media-url';
import {
  toSafeDoiHref,
  toSafeExternalPdfHref,
} from '@/lib/security/safe-href';

export interface ResearchFigure {
  id?: string;
  imageUrl: string;
  caption?: string | null;
}

export interface ResearchPaper {
  id: string;
  slug: string;
  title: string;
  abstract: string | null;
  authors: string[];
  venue: string | null;
  publicationStatus: string | null;
  year: number | null;
  pdfUrl: string | null;
  doiUrl: string | null;
  citationText: string | null;
  tags: string[];
  coverImageUrl: string | null;
  relatedProjectId: string | null;
  relatedProjectTitle?: string | null;
  relatedProjectHref?: string | null;
  figures: ResearchFigure[];
  downloadCount?: number;
  avgReadTimeSec?: number;
}

export type DbResearchFigure = {
  id?: string;
  image_url: string;
  storage_path?: string | null;
  caption?: string | null;
  sort_order?: number | null;
};

type DbResearchPaper = {
  id: string;
  slug: string;
  title: string;
  abstract: string | null;
  authors?: string[] | null;
  venue?: string | null;
  publication_status?: string | null;
  year?: number | null;
  pdf_url?: string | null;
  doi_url?: string | null;
  citation_text?: string | null;
  tags?: string[] | null;
  cover_image_url?: string | null;
  related_project_id?: string | null;
  research_figures?: DbResearchFigure[] | null;
  related_project?: { id: string; title: string; is_published?: boolean | null } | null;
};

export type ResearchFigureDisplayResolver = (figure: DbResearchFigure) => string | null;

/**
 * Map DB paper rows to the public/client shape.
 * Callers that render figures must pass resolveFigureUrl so storage_path is never exposed.
 */
export function normalizeResearchPaper(
  paper: DbResearchPaper,
  profileSlug?: string,
  options?: { resolveFigureUrl?: ResearchFigureDisplayResolver },
): ResearchPaper {
  const related = paper.related_project;
  const relatedIsPublic = related?.is_published === true;
  const relatedProjectId =
    relatedIsPublic
      ? (paper.related_project_id ?? related?.id ?? null)
      : null;

  return {
    id: paper.id,
    slug: paper.slug,
    title: paper.title,
    abstract: paper.abstract,
    authors: paper.authors ?? [],
    venue: paper.venue ?? null,
    publicationStatus: paper.publication_status ?? null,
    year: paper.year ?? null,
    pdfUrl: toSafeExternalPdfHref(paper.pdf_url),
    doiUrl: toSafeDoiHref(paper.doi_url),
    citationText: paper.citation_text ?? null,
    tags: paper.tags ?? [],
    coverImageUrl: paper.cover_image_url ?? null,
    relatedProjectId,
    relatedProjectTitle: relatedIsPublic ? (related?.title ?? null) : null,
    relatedProjectHref:
      relatedProjectId && profileSlug
        ? `${profileSlug === 'demo' ? '/demo' : `/${profileSlug}`}/projects/${relatedProjectId}`
        : null,
    figures: (paper.research_figures ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((figure) => {
        const resolved = options?.resolveFigureUrl?.(figure);
        let imageUrl = resolved ?? '';
        if (!imageUrl) {
          const legacy = figure.image_url?.trim() ?? '';
          imageUrl = isAbsoluteMediaUrl(legacy) ? legacy : '';
        }
        return {
          id: figure.id,
          imageUrl,
          caption: figure.caption ?? null,
        };
      })
      .filter((figure) => Boolean(figure.imageUrl)),
  };
}

export function estimateReadTimeSeconds(paper: Pick<ResearchPaper, 'abstract' | 'citationText'>) {
  const words = `${paper.abstract ?? ''} ${paper.citationText ?? ''}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(45, Math.round((words / 220) * 60));
}

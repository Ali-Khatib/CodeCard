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

type DbResearchFigure = {
  id?: string;
  image_url: string;
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

export function normalizeResearchPaper(
  paper: DbResearchPaper,
  profileSlug?: string,
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
    pdfUrl: paper.pdf_url ?? null,
    doiUrl: paper.doi_url ?? null,
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
      .map((figure) => ({
        id: figure.id,
        imageUrl: figure.image_url,
        caption: figure.caption ?? null,
      })),
  };
}

export function estimateReadTimeSeconds(paper: Pick<ResearchPaper, 'abstract' | 'citationText'>) {
  const words = `${paper.abstract ?? ''} ${paper.citationText ?? ''}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(45, Math.round((words / 220) * 60));
}

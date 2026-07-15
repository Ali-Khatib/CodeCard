import {
  createResearchSchema,
  normalizeResearchSlug,
  RESEARCH_ABSTRACT_MAX_LENGTH,
  RESEARCH_AUTHOR_MAX_COUNT,
  RESEARCH_AUTHOR_MAX_LENGTH,
  RESEARCH_CITATION_MAX_LENGTH,
  RESEARCH_TITLE_MAX_LENGTH,
  RESEARCH_VENUE_MAX_LENGTH,
  RESEARCH_YEAR_MAX,
  RESEARCH_YEAR_MIN,
} from '@codecard/validation';

export type ResearchFormMode = 'create' | 'edit';

export type ResearchFormValues = {
  title: string;
  slug: string;
  abstract: string;
  authors: string[];
  venue: string;
  publication_status: string;
  year: string;
  doi_url: string;
  pdf_url: string;
  citation_text: string;
  tags: string[];
};

export const RESEARCH_FORM_LIMITS = {
  title: RESEARCH_TITLE_MAX_LENGTH,
  abstract: RESEARCH_ABSTRACT_MAX_LENGTH,
  author: RESEARCH_AUTHOR_MAX_LENGTH,
  authorsMax: RESEARCH_AUTHOR_MAX_COUNT,
  venue: RESEARCH_VENUE_MAX_LENGTH,
  citation: RESEARCH_CITATION_MAX_LENGTH,
  yearMin: RESEARCH_YEAR_MIN,
  yearMax: RESEARCH_YEAR_MAX,
} as const;

export function createEmptyResearchFormValues(): ResearchFormValues {
  return {
    title: '',
    slug: '',
    abstract: '',
    authors: [''],
    venue: '',
    publication_status: '',
    year: '',
    doi_url: '',
    pdf_url: '',
    citation_text: '',
    tags: [],
  };
}

export function suggestResearchSlugFromTitle(title: string): string {
  return normalizeResearchSlug(title);
}

export function buildCreateResearchFormData(values: ResearchFormValues): FormData {
  const fd = new FormData();
  fd.set('title', values.title);
  fd.set('slug', values.slug);
  fd.set('abstract', values.abstract);
  for (const author of values.authors.map((item) => item.trim()).filter(Boolean)) {
    fd.append('authors', author);
  }
  fd.set('venue', values.venue);
  fd.set('publication_status', values.publication_status);
  fd.set('year', values.year);
  fd.set('doi_url', values.doi_url);
  fd.set('pdf_url', values.pdf_url);
  fd.set('citation_text', values.citation_text);
  for (const tag of values.tags.map((item) => item.trim()).filter(Boolean)) {
    fd.append('tags', tag);
  }
  return fd;
}

export function validateResearchFormClient(values: ResearchFormValues): string | null {
  const authors = values.authors.map((item) => item.trim()).filter(Boolean);
  const parsed = createResearchSchema.safeParse({
    title: values.title,
    slug: values.slug,
    abstract: values.abstract || null,
    authors,
    venue: values.venue || null,
    publication_status: values.publication_status || null,
    year: values.year || null,
    doi_url: values.doi_url || null,
    pdf_url: values.pdf_url || null,
    citation_text: values.citation_text || null,
    tags: values.tags,
    related_project_id: null,
  });

  if (!parsed.success) {
    return parsed.error.errors[0]?.message ?? 'Check the highlighted fields.';
  }

  return null;
}

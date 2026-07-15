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
import type { OwnedResearchRecord } from '@/lib/research/research-access-core';

export type ResearchFormMode = 'create' | 'edit';

export type ResearchRelatedProjectOption = {
  id: string;
  title: string;
  slug: string;
};

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
  related_project_id: string;
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
    related_project_id: '',
  };
}

export function suggestResearchSlugFromTitle(title: string): string {
  return normalizeResearchSlug(title);
}

export function formatRelatedProjectOptionLabel(
  option: ResearchRelatedProjectOption,
  allOptions: ResearchRelatedProjectOption[],
): string {
  const duplicateTitle =
    allOptions.filter((item) => item.title.trim().toLowerCase() === option.title.trim().toLowerCase())
      .length > 1;
  return duplicateTitle ? `${option.title} (${option.slug})` : option.title;
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
  fd.set('related_project_id', values.related_project_id);
  return fd;
}

export function buildUpdateResearchFormData(
  researchPaperId: string,
  values: ResearchFormValues,
): FormData {
  const fd = buildCreateResearchFormData(values);
  fd.set('research_paper_id', researchPaperId);
  return fd;
}

export function researchRecordToFormValues(paper: OwnedResearchRecord): ResearchFormValues {
  return {
    title: paper.title,
    slug: paper.slug,
    abstract: paper.abstract ?? '',
    authors: paper.authors.length > 0 ? [...paper.authors] : [''],
    venue: paper.venue ?? '',
    publication_status: paper.publication_status ?? '',
    year: paper.year == null ? '' : String(paper.year),
    doi_url: paper.doi_url ?? '',
    pdf_url: paper.pdf_url ?? '',
    citation_text: paper.citation_text ?? '',
    tags: [...(paper.tags ?? [])],
    related_project_id: paper.related_project_id ?? '',
  };
}

export function validateResearchFormClient(values: ResearchFormValues): string | null {
  const authors = values.authors.map((item) => item.trim()).filter(Boolean);
  const related = values.related_project_id.trim();
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
    related_project_id: related === '' ? null : related,
  });

  if (!parsed.success) {
    return parsed.error.errors[0]?.message ?? 'Check the highlighted fields.';
  }

  return null;
}

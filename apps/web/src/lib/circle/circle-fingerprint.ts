import { createHash } from 'node:crypto';
import {
  PROJECT_MEANINGFUL_UPDATE_FIELDS,
  RESEARCH_MEANINGFUL_UPDATE_FIELDS,
} from '@/lib/circle/circle-activity-contract';

type ProjectMeaningfulSnapshot = {
  title: string;
  tagline: string | null;
  description: string | null;
  slug: string;
  technologies: string[];
  status: string | null;
};

type ResearchMeaningfulSnapshot = {
  title: string;
  abstract: string | null;
  slug: string;
  authors: string[];
  venue: string | null;
  publication_status: string | null;
  pdf_url: string | null;
  cover_image_url: string | null;
  year: number | null;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

export function fingerprintPayload(payload: Record<string, unknown>): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex').slice(0, 32);
}

export function projectMeaningfulSnapshot(
  input: ProjectMeaningfulSnapshot,
): Record<string, unknown> {
  return {
    title: input.title.trim(),
    tagline: input.tagline?.trim() || null,
    description: input.description?.trim() || null,
    slug: input.slug.trim(),
    technologies: [...input.technologies].map((t) => t.trim()).filter(Boolean).sort(),
    status: input.status?.trim() || null,
  };
}

export function researchMeaningfulSnapshot(
  input: ResearchMeaningfulSnapshot,
): Record<string, unknown> {
  return {
    title: input.title.trim(),
    abstract: input.abstract?.trim() || null,
    slug: input.slug.trim(),
    authors: [...input.authors].map((a) => a.trim()).filter(Boolean),
    venue: input.venue?.trim() || null,
    publication_status: input.publication_status?.trim() || null,
    pdf_url: input.pdf_url?.trim() || null,
    cover_image_url: input.cover_image_url?.trim() || null,
    year: input.year ?? null,
  };
}

export function projectContentFingerprint(input: ProjectMeaningfulSnapshot): string {
  return fingerprintPayload(projectMeaningfulSnapshot(input));
}

export function researchContentFingerprint(input: ResearchMeaningfulSnapshot): string {
  return fingerprintPayload(researchMeaningfulSnapshot(input));
}

export function projectHasMeaningfulChange(
  before: ProjectMeaningfulSnapshot,
  after: ProjectMeaningfulSnapshot,
): boolean {
  void PROJECT_MEANINGFUL_UPDATE_FIELDS;
  return projectContentFingerprint(before) !== projectContentFingerprint(after);
}

export function researchHasMeaningfulChange(
  before: ResearchMeaningfulSnapshot,
  after: ResearchMeaningfulSnapshot,
): boolean {
  void RESEARCH_MEANINGFUL_UPDATE_FIELDS;
  return researchContentFingerprint(before) !== researchContentFingerprint(after);
}

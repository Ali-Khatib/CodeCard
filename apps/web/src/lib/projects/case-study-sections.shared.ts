/** Shared case study types and parsing — safe for server and client. */

export const CASE_STUDY_SECTION_IDS = [
  'problem',
  'approach',
  'takeaway',
  'results',
  'demo',
  'build',
] as const;

export type CaseStudySectionId = (typeof CASE_STUDY_SECTION_IDS)[number];

export type CaseStudySectionContent = {
  text?: string;
  mediaUrl?: string;
};

export type CaseStudySections = Partial<Record<CaseStudySectionId, CaseStudySectionContent>>;

export type CaseStudyInputKind = 'text' | 'media';

export type CaseStudySectionConfig = {
  id: CaseStudySectionId;
  label: string;
  eyebrow: string;
  summary: string;
  prompt: string;
  placeholder: string;
  inputKind: CaseStudyInputKind;
  mediaHint: string;
  Icon: import('react-icons').IconType;
};

const LEGACY_SECTION_MAP: Record<string, CaseStudySectionId> = {
  model: 'build',
  pipeline: 'approach',
  dataset: 'approach',
  github: 'takeaway',
  overview: 'takeaway',
};

function normalizeSectionValue(raw: unknown): CaseStudySectionContent | null {
  if (typeof raw === 'string' && raw.trim()) {
    return { text: raw.trim() };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text.trim() : '';
  const mediaUrl = typeof record.mediaUrl === 'string' ? record.mediaUrl.trim() : '';
  if (!text && !mediaUrl) return null;
  return {
    ...(text ? { text } : {}),
    ...(mediaUrl ? { mediaUrl } : {}),
  };
}

export function parseCaseStudySections(value: unknown): CaseStudySections {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const out: CaseStudySections = {};

  for (const [key, raw] of Object.entries(source)) {
    const mappedId = (LEGACY_SECTION_MAP[key] ?? key) as CaseStudySectionId;
    if (!CASE_STUDY_SECTION_IDS.includes(mappedId)) continue;
    const normalized = normalizeSectionValue(raw);
    if (!normalized) continue;
    out[mappedId] = { ...out[mappedId], ...normalized };
  }

  return out;
}

export function sectionHasContent(content: CaseStudySectionContent | undefined): boolean {
  if (!content) return false;
  return Boolean(content.text?.trim() || content.mediaUrl?.trim());
}

export function caseStudyTextForSection(
  project: { caseStudySections?: CaseStudySections },
  sectionId: CaseStudySectionId,
): string | null {
  const text = project.caseStudySections?.[sectionId]?.text?.trim();
  return text || null;
}

export function caseStudyMediaForSection(
  project: {
    caseStudySections?: CaseStudySections;
    posterUrl?: string | null;
    screenshots?: string[];
    videoUrl?: string | null;
  },
  sectionId: CaseStudySectionId,
): string | null {
  const custom = project.caseStudySections?.[sectionId]?.mediaUrl?.trim();
  if (custom) return custom;
  if (sectionId === 'demo') return project.videoUrl ?? project.posterUrl ?? project.screenshots?.[0] ?? null;
  if (sectionId === 'results') return project.screenshots?.[3] ?? project.screenshots?.[1] ?? null;
  if (sectionId === 'build') return project.screenshots?.[2] ?? project.screenshots?.[1] ?? null;
  return null;
}

export function visibleCaseStudySections(
  project: { caseStudySections?: CaseStudySections },
  sections: CaseStudySectionConfig[],
): CaseStudySectionConfig[] {
  const data = project.caseStudySections ?? {};
  return sections.filter((section) => sectionHasContent(data[section.id]));
}

export function hasShowcaseExtras(
  project: { caseStudySections?: CaseStudySections },
  sections: CaseStudySectionConfig[],
): boolean {
  return visibleCaseStudySections(project, sections).length > 0;
}

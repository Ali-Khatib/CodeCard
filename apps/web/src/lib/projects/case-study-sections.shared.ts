/** Shared case study types and parsing — safe for server and client. */

export const CASE_STUDY_SECTION_IDS = [
  'problem',
  'approach',
  'results',
  'product',
  'architecture',
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
  /** Shown in the create form before a section is enabled. */
  addHint: string;
  prompt: string;
  placeholder: string;
  inputKind: CaseStudyInputKind;
  mediaHint: string;
  Icon: import('react-icons').IconType;
};

/** Map retired / alternate keys onto the five current section ids. */
const LEGACY_SECTION_MAP: Record<string, CaseStudySectionId> = {
  impact: 'results',
  takeaway: 'results',
  overview: 'results',
  github: 'results',
  demo: 'product',
  build: 'architecture',
  model: 'architecture',
  pipeline: 'approach',
  dataset: 'approach',
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

/** Only inline images and http(s) URLs may render (blocks javascript: etc.). */
export function isSafeCaseStudyMediaUrl(value: string): boolean {
  return value.startsWith('data:image/') || /^https?:\/\//i.test(value);
}

/**
 * Optional background image for a section. Rendered behind the section text
 * with a scrim so the story stays readable; never shown as a bare media panel.
 */
export function caseStudyMediaForSection(
  project: {
    caseStudySections?: CaseStudySections;
  },
  sectionId: CaseStudySectionId,
): string | null {
  const custom = project.caseStudySections?.[sectionId]?.mediaUrl?.trim();
  if (!custom || !isSafeCaseStudyMediaUrl(custom)) return null;
  return custom;
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

/** Build a storable object from optional per-section text (empty → omitted). */
export function buildCaseStudySectionsFromTexts(
  texts: Partial<Record<CaseStudySectionId, string>>,
): CaseStudySections {
  const out: CaseStudySections = {};
  for (const id of CASE_STUDY_SECTION_IDS) {
    const text = texts[id]?.trim();
    if (text) out[id] = { text };
  }
  return out;
}

/** Build a storable object from per-section text and optional background image. */
export function buildCaseStudySectionsFromEntries(
  entries: Partial<Record<CaseStudySectionId, { text?: string; mediaUrl?: string }>>,
): CaseStudySections {
  const out: CaseStudySections = {};
  for (const id of CASE_STUDY_SECTION_IDS) {
    const text = entries[id]?.text?.trim();
    const mediaUrl = entries[id]?.mediaUrl?.trim();
    const safeMedia = mediaUrl && isSafeCaseStudyMediaUrl(mediaUrl) ? mediaUrl : undefined;
    if (!text && !safeMedia) continue;
    out[id] = {
      ...(text ? { text } : {}),
      ...(safeMedia ? { mediaUrl: safeMedia } : {}),
    };
  }
  return out;
}

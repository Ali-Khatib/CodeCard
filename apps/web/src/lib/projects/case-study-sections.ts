import {
  HiOutlineBeaker,
  HiOutlineChartBarSquare,
  HiOutlineCodeBracketSquare,
  HiOutlineCpuChip,
  HiOutlineCubeTransparent,
  HiOutlinePlayCircle,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import type { IconType } from 'react-icons';

export const CASE_STUDY_SECTION_IDS = [
  'overview',
  'problem',
  'pipeline',
  'dataset',
  'model',
  'results',
  'demo',
  'github',
] as const;

export type CaseStudySectionId = (typeof CASE_STUDY_SECTION_IDS)[number];

export type CaseStudySections = Partial<Record<CaseStudySectionId, string>>;

export type CaseStudySectionConfig = {
  id: CaseStudySectionId;
  label: string;
  eyebrow: string;
  summary: string;
  prompt: string;
  placeholder: string;
  optional: boolean;
  visual: CaseStudySectionId | 'problem';
  Icon: IconType;
};

export const CASE_STUDY_SECTIONS: CaseStudySectionConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    eyebrow: 'Main frame',
    summary: 'The finished product, main screenshot, and first proof point.',
    prompt: 'What does this project do in one or two sentences? Lead with the outcome.',
    placeholder: 'e.g. A visual CI/CD editor that maps 1:1 to GitHub Actions and cuts failed deploys in half.',
    optional: false,
    visual: 'overview',
    Icon: HiOutlineSquares2X2,
  },
  {
    id: 'problem',
    label: 'Problem',
    eyebrow: 'Constraint',
    summary: 'The technical or user problem this project was built to solve.',
    prompt: 'What pain existed before you built this? Who felt it and why did it matter?',
    placeholder: 'e.g. Teams drowned in opaque YAML pipelines with no preview environments and slow feedback loops.',
    optional: true,
    visual: 'problem',
    Icon: HiOutlineCubeTransparent,
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    eyebrow: 'Workflow',
    summary: 'How data, services, jobs, and UI states move through the system.',
    prompt: 'Walk through the flow: inputs → processing → outputs. Name the main services or steps.',
    placeholder: 'e.g. PR webhook → build worker → preview deploy → status checks → merge gate.',
    optional: true,
    visual: 'pipeline',
    Icon: HiOutlineCubeTransparent,
  },
  {
    id: 'dataset',
    label: 'Dataset',
    eyebrow: 'Inputs',
    summary: 'Sample records, captures, events, or training material powering the project.',
    prompt: 'What data powers this? Sources, size, format, or representative examples.',
    placeholder: 'e.g. 12k pipeline runs/month, GitHub webhook payloads, and container build logs.',
    optional: true,
    visual: 'dataset',
    Icon: HiOutlineBeaker,
  },
  {
    id: 'model',
    label: 'Model',
    eyebrow: 'Intelligence',
    summary: 'The model, prompt layer, inference path, or decision logic behind the product.',
    prompt: 'Describe the core logic, model, rules engine, or AI layer — keep it concrete.',
    placeholder: 'e.g. Deterministic YAML parser plus a diff engine that flags drift before deploy.',
    optional: true,
    visual: 'model',
    Icon: HiOutlineCpuChip,
  },
  {
    id: 'results',
    label: 'Results',
    eyebrow: 'Proof',
    summary: 'Metrics, before/after comparisons, and signals that show the work landed.',
    prompt: 'Share measurable outcomes: speed, reliability, cost, adoption, or before/after.',
    placeholder: 'e.g. 3× faster ship cadence, 50% fewer failed deploys, previews in under 90s.',
    optional: true,
    visual: 'results',
    Icon: HiOutlineChartBarSquare,
  },
  {
    id: 'demo',
    label: 'Demo',
    eyebrow: 'Live surface',
    summary: 'A product-facing preview of the interface, prototype, or interaction loop.',
    prompt: 'What should a visitor try or notice in the live demo? Link or walkthrough notes.',
    placeholder: 'e.g. Open the visual editor, edit a stage, and watch the preview environment spin up.',
    optional: true,
    visual: 'demo',
    Icon: HiOutlinePlayCircle,
  },
  {
    id: 'github',
    label: 'GitHub',
    eyebrow: 'Source',
    summary: 'A clean repository/code view for reviewers who want to inspect the build.',
    prompt: 'What should reviewers look at in the repo? Architecture, tests, or key modules.',
    placeholder: 'e.g. Monorepo with /packages/pipeline-core and integration tests in /apps/api.',
    optional: true,
    visual: 'github',
    Icon: HiOutlineCodeBracketSquare,
  },
];

export function parseCaseStudySections(value: unknown): CaseStudySections {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: CaseStudySections = {};
  for (const section of CASE_STUDY_SECTIONS) {
    const raw = (value as Record<string, unknown>)[section.id];
    if (typeof raw === 'string' && raw.trim()) {
      out[section.id] = raw.trim();
    }
  }
  return out;
}

export function caseStudyBodyForSection(
  project: { caseStudySections?: CaseStudySections; tagline?: string | null; description?: string | null },
  sectionId: CaseStudySectionId,
): string | null {
  const custom = project.caseStudySections?.[sectionId]?.trim();
  if (custom) return custom;
  if (sectionId === 'overview') {
    return project.tagline?.trim() || project.description?.split(/\n\n+/)[0]?.trim() || null;
  }
  return null;
}

export function visibleCaseStudySections(
  project: { caseStudySections?: CaseStudySections; tagline?: string | null; description?: string | null },
): CaseStudySectionConfig[] {
  const hasCustom = Boolean(project.caseStudySections && Object.keys(project.caseStudySections).length > 0);
  if (!hasCustom) return CASE_STUDY_SECTIONS;
  return CASE_STUDY_SECTIONS.filter((section) => {
    if (section.id === 'overview') return true;
    return Boolean(project.caseStudySections?.[section.id]?.trim());
  });
}

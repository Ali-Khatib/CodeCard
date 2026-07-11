import {
  HiOutlineBolt,
  HiOutlineChartBarSquare,
  HiOutlineCubeTransparent,
  HiOutlineLightBulb,
  HiOutlineSquares2X2,
  HiOutlineWindow,
} from 'react-icons/hi2';
import {
  CASE_STUDY_SECTION_IDS,
  hasShowcaseExtras as hasShowcaseExtrasBase,
  visibleCaseStudySections as visibleCaseStudySectionsBase,
  type CaseStudySectionConfig,
} from '@/lib/projects/case-study-sections.shared';

export * from '@/lib/projects/case-study-sections.shared';

export const CASE_STUDY_SECTIONS: CaseStudySectionConfig[] = [
  {
    id: 'problem',
    label: 'Problem',
    eyebrow: 'Before',
    summary: 'What was frustrating, slow, or broken?',
    prompt: 'In 1–3 sentences, describe the pain you set out to fix.',
    placeholder: 'e.g. Deploys failed silently and nobody trusted the pipeline config.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineCubeTransparent,
  },
  {
    id: 'approach',
    label: 'Approach',
    eyebrow: 'How',
    summary: 'How you tackled it — plain English, not a full write-up.',
    prompt: 'What was your strategy or angle? Keep it short.',
    placeholder: 'e.g. Visual editor on top of GitHub Actions with instant preview environments.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineLightBulb,
  },
  {
    id: 'impact',
    label: 'Impact',
    eyebrow: 'After',
    summary: 'What changed — speed, adoption, revenue, or user wins.',
    prompt: 'What measurable or visible difference did you create?',
    placeholder: 'e.g. Cut deploy time from 45 minutes to under 8, with preview URLs on every PR.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineBolt,
  },
  {
    id: 'results',
    label: 'Results',
    eyebrow: 'Proof',
    summary: 'A photo of outcomes — chart, metric, or before/after.',
    prompt: 'Add a screenshot or photo that shows it worked.',
    placeholder: 'https://…',
    inputKind: 'media',
    mediaHint: 'PNG/JPG screenshot of metrics, dashboard, or outcome.',
    Icon: HiOutlineChartBarSquare,
  },
  {
    id: 'product',
    label: 'Product',
    eyebrow: 'Interface',
    summary: 'A screenshot of the UI, app screen, or experience.',
    prompt: 'Add a screenshot that shows what you built.',
    placeholder: 'https://…',
    inputKind: 'media',
    mediaHint: 'UI screenshot, app screen, or prototype photo.',
    Icon: HiOutlineWindow,
  },
  {
    id: 'architecture',
    label: 'System',
    eyebrow: 'Architecture',
    summary: 'How it is wired — diagram, flow, or technical visual.',
    prompt: 'Add an architecture diagram, data flow, or system screenshot.',
    placeholder: 'https://…',
    inputKind: 'media',
    mediaHint: 'Architecture diagram, ER map, or infra overview.',
    Icon: HiOutlineSquares2X2,
  },
];

export function visibleCaseStudySections(project: { caseStudySections?: import('@/lib/projects/case-study-sections.shared').CaseStudySections }) {
  return visibleCaseStudySectionsBase(project, CASE_STUDY_SECTIONS);
}

export function hasShowcaseExtras(project: { caseStudySections?: import('@/lib/projects/case-study-sections.shared').CaseStudySections }) {
  return hasShowcaseExtrasBase(project, CASE_STUDY_SECTIONS);
}

// Ensure config ids stay aligned with shared constants.
void CASE_STUDY_SECTION_IDS;

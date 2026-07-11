import {
  HiOutlineChartBarSquare,
  HiOutlineCpuChip,
  HiOutlineCubeTransparent,
  HiOutlineLightBulb,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
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
    id: 'takeaway',
    label: 'Takeaway',
    eyebrow: 'Remember',
    summary: 'One line you want a recruiter or reviewer to walk away with.',
    prompt: 'What should they remember about this project?',
    placeholder: 'e.g. Shipped reliable previews without adding ops overhead.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineSparkles,
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
    id: 'demo',
    label: 'Demo',
    eyebrow: 'In action',
    summary: 'A photo of the product, UI, or prototype running.',
    prompt: 'Add a screenshot or photo of the live experience.',
    placeholder: 'https://…',
    inputKind: 'media',
    mediaHint: 'UI screenshot, screen recording still, or product photo.',
    Icon: HiOutlinePlayCircle,
  },
  {
    id: 'build',
    label: 'Under the hood',
    eyebrow: 'Build',
    summary: 'A photo of architecture, core screen, or technical visual.',
    prompt: 'Add a diagram, architecture shot, or key technical screenshot.',
    placeholder: 'https://…',
    inputKind: 'media',
    mediaHint: 'Architecture diagram, code structure, or system visual.',
    Icon: HiOutlineCpuChip,
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

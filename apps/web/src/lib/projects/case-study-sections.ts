import {
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
    summary: 'The pain, friction, or gap you set out to fix.',
    addHint:
      'Optional. Turn this on if you want a “Problem” tab on the project page. Write 2–4 sentences someone can read in under 10 seconds.',
    prompt:
      'What was broken, slow, confusing, or missing before you built this? Name the people affected and the concrete friction.',
    placeholder:
      'e.g. Deploys failed silently, preview environments were manual, and nobody trusted the pipeline config.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineCubeTransparent,
  },
  {
    id: 'approach',
    label: 'Approach',
    eyebrow: 'How',
    summary: 'Your strategy — plain English, not a full write-up.',
    addHint:
      'Optional. Explain how you tackled the problem in plain English — strategy, not a step-by-step diary.',
    prompt:
      'What was your angle? Mention the key idea, stack choice, or constraint that shaped the solution.',
    placeholder:
      'e.g. Visual editor on top of GitHub Actions with instant preview environments and drift checks before merge.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineLightBulb,
  },
  {
    id: 'results',
    label: 'Results',
    eyebrow: 'Proof',
    summary: 'What changed — speed, adoption, quality, or user wins.',
    addHint:
      'Optional. Write the outcome in numbers or clear before/after language. Prefer one sharp result over a long list.',
    prompt:
      'What measurable or visible difference did this create? Include a metric, adoption note, or before→after if you have one.',
    placeholder:
      'e.g. Cut deploy time from 45 minutes to under 8, with preview URLs on every PR.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineChartBarSquare,
  },
  {
    id: 'product',
    label: 'Product',
    eyebrow: 'Experience',
    summary: 'What someone actually uses — screens, flows, or the live experience in words.',
    addHint:
      'Optional. Describe what the product looks and feels like to use. Paint the interface in words.',
    prompt:
      'What does a user see or do? Name the main screens, actions, or moments that make the product click.',
    placeholder:
      'e.g. A pipeline canvas where each node is a GitHub Action step, with live logs and one-click preview links.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineWindow,
  },
  {
    id: 'architecture',
    label: 'System',
    eyebrow: 'Architecture',
    summary: 'How it is wired — services, data flow, or technical shape in plain language.',
    addHint:
      'Optional. Describe the system shape so a technical reader understands how pieces connect.',
    prompt:
      'How is it wired? Mention major services, data stores, or boundaries without dumping a full design doc.',
    placeholder:
      'e.g. Next.js app → API routes → Postgres for state, with workers watching GitHub webhooks for preview spins.',
    inputKind: 'text',
    mediaHint: '',
    Icon: HiOutlineSquares2X2,
  },
];

export function visibleCaseStudySections(project: {
  caseStudySections?: import('@/lib/projects/case-study-sections.shared').CaseStudySections;
}) {
  return visibleCaseStudySectionsBase(project, CASE_STUDY_SECTIONS);
}

export function hasShowcaseExtras(project: {
  caseStudySections?: import('@/lib/projects/case-study-sections.shared').CaseStudySections;
}) {
  return hasShowcaseExtrasBase(project, CASE_STUDY_SECTIONS);
}

// Ensure config ids stay aligned with shared constants.
void CASE_STUDY_SECTION_IDS;

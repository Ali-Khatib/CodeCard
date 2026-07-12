/** Canonical project domain labels used for create/edit validation and forms. */
export const PROJECT_DOMAIN_OPTIONS = [
  'Artificial Intelligence',
  'Cloud Computing',
  'GenAI',
  'AI / ML',
  'DevOps',
  'Data',
  'Observability',
  'Full Stack',
  'Backend',
  'Frontend',
] as const;

export type ProjectDomainOption = (typeof PROJECT_DOMAIN_OPTIONS)[number];

/** Canonical project focus-area labels used for create/edit validation and forms. */
export const PROJECT_FOCUS_AREA_OPTIONS = [
  'DevOps',
  'CI/CD',
  'Databases',
  'Observability',
  'LLMs',
  'AI',
] as const;

export type ProjectFocusAreaOption = (typeof PROJECT_FOCUS_AREA_OPTIONS)[number];

const projectDomainSet = new Set<string>(PROJECT_DOMAIN_OPTIONS);
const projectFocusAreaSet = new Set<string>(PROJECT_FOCUS_AREA_OPTIONS);

export function isAllowedProjectDomain(value: string): value is ProjectDomainOption {
  return projectDomainSet.has(value);
}

export function isAllowedProjectFocusArea(value: string): value is ProjectFocusAreaOption {
  return projectFocusAreaSet.has(value);
}

import {
  createProjectInputSchema,
  normalizeProjectSlug,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_DOMAIN_OPTIONS,
  PROJECT_FOCUS_AREA_OPTIONS,
  PROJECT_LIFECYCLE_STATUSES,
  PROJECT_TAGLINE_MAX_LENGTH,
  PROJECT_TITLE_MAX_LENGTH,
  PROJECT_USER_ROLE_MAX_LENGTH,
  type ProjectLifecycleStatus,
} from '@codecard/validation';
import {
  buildCaseStudySectionsFromEntries,
  CASE_STUDY_SECTION_IDS,
  parseCaseStudySections,
  type CaseStudySectionId,
  type CaseStudySections,
} from '@/lib/projects/case-study-sections.shared';

export type ProjectFormMode = 'create' | 'edit';

export type ProjectFormValues = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  technologies: string[];
  domains: string[];
  focus_areas: string[];
  user_role: string;
  started_at: string;
  ended_at: string;
  status: ProjectLifecycleStatus;
  case_study_sections: CaseStudySections;
};

export function createEmptyProjectFormValues(): ProjectFormValues {
  return {
    title: '',
    slug: '',
    tagline: '',
    description: '',
    technologies: [],
    domains: [],
    focus_areas: [],
    user_role: '',
    started_at: '',
    ended_at: '',
    status: 'draft',
    case_study_sections: {},
  };
}

export function suggestProjectSlugFromTitle(title: string): string {
  return normalizeProjectSlug(title);
}

function appendCaseStudySections(fd: FormData, sections: CaseStudySections) {
  for (const id of CASE_STUDY_SECTION_IDS) {
    const text = sections[id]?.text?.trim();
    const mediaUrl = sections[id]?.mediaUrl?.trim();
    if (text) {
      fd.set(`case_study_${id}`, text);
    }
    if (mediaUrl) {
      fd.set(`case_study_${id}_image`, mediaUrl);
    }
  }
}

export function parseCaseStudySectionsFromFormData(formData: FormData): CaseStudySections {
  const entries: Partial<Record<CaseStudySectionId, { text?: string; mediaUrl?: string }>> = {};
  for (const id of CASE_STUDY_SECTION_IDS) {
    const text = String(formData.get(`case_study_${id}`) ?? '');
    const mediaUrl = String(formData.get(`case_study_${id}_image`) ?? '');
    if (text.trim() || mediaUrl.trim()) {
      entries[id] = {
        ...(text.trim() ? { text } : {}),
        ...(mediaUrl.trim() ? { mediaUrl } : {}),
      };
    }
  }
  return buildCaseStudySectionsFromEntries(entries);
}

export function buildCreateProjectFormData(values: ProjectFormValues): FormData {
  const fd = new FormData();
  fd.set('title', values.title);
  fd.set('slug', values.slug);
  fd.set('tagline', values.tagline);
  fd.set('description', values.description);
  for (const tech of values.technologies) {
    fd.append('technologies', tech);
  }
  for (const domain of values.domains) {
    fd.append('domains', domain);
  }
  for (const area of values.focus_areas) {
    fd.append('focus_areas', area);
  }
  fd.set('user_role', values.user_role);
  fd.set('started_at', values.started_at);
  fd.set('ended_at', values.ended_at);
  fd.set('status', values.status);
  appendCaseStudySections(fd, values.case_study_sections);
  return fd;
}

export function buildUpdateProjectFormData(
  projectId: string,
  values: ProjectFormValues,
): FormData {
  const fd = buildCreateProjectFormData(values);
  fd.set('project_id', projectId);
  return fd;
}

export function formatProjectDateForInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function projectRecordToFormValues(
  project: {
    title: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    technologies?: string[] | null;
    user_role?: string | null;
    started_at?: string | null;
    ended_at?: string | null;
    status?: string | null;
    case_study_sections?: unknown;
  },
  relations: { domains: string[]; focus_areas: string[] },
): ProjectFormValues {
  const status = PROJECT_LIFECYCLE_STATUSES.includes(
    (project.status ?? 'draft') as ProjectLifecycleStatus,
  )
    ? ((project.status ?? 'draft') as ProjectLifecycleStatus)
    : 'draft';

  return {
    title: project.title,
    slug: project.slug,
    tagline: project.tagline ?? '',
    description: project.description ?? '',
    technologies: project.technologies ?? [],
    domains: relations.domains,
    focus_areas: relations.focus_areas,
    user_role: project.user_role ?? '',
    started_at: formatProjectDateForInput(project.started_at),
    ended_at: formatProjectDateForInput(project.ended_at),
    status,
    case_study_sections: parseCaseStudySections(project.case_study_sections),
  };
}

export type ProjectFormClientValidationResult =
  | { success: true }
  | { success: false; message: string; field?: string };

export function validateProjectFormClient(
  values: ProjectFormValues,
): ProjectFormClientValidationResult {
  const parsed = createProjectInputSchema.safeParse({
    title: values.title,
    slug: values.slug,
    tagline: values.tagline || null,
    description: values.description || null,
    technologies: values.technologies,
    domains: values.domains,
    focus_areas: values.focus_areas,
    user_role: values.user_role || null,
    started_at: values.started_at || null,
    ended_at: values.ended_at || null,
    status: values.status,
    case_study_sections: values.case_study_sections,
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    return {
      success: false,
      message: first?.message ?? 'Invalid project details.',
      field: typeof field === 'string' ? field : undefined,
    };
  }

  return { success: true };
}

export const PROJECT_FORM_DOMAIN_OPTIONS = PROJECT_DOMAIN_OPTIONS;
export const PROJECT_FORM_FOCUS_AREA_OPTIONS = PROJECT_FOCUS_AREA_OPTIONS;
export const PROJECT_FORM_STATUS_OPTIONS = PROJECT_LIFECYCLE_STATUSES;
export const PROJECT_FORM_LIMITS = {
  title: PROJECT_TITLE_MAX_LENGTH,
  tagline: PROJECT_TAGLINE_MAX_LENGTH,
  description: PROJECT_DESCRIPTION_MAX_LENGTH,
  userRole: PROJECT_USER_ROLE_MAX_LENGTH,
  caseStudySection: 2000,
};

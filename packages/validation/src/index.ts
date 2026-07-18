import { z } from 'zod';
import { profileLinkTypeSchema } from './profile-links';
import { projectLinkTypeSchema } from './project-links';
import {
  isAllowedProjectDomain,
  isAllowedProjectFocusArea,
  PROJECT_DOMAIN_OPTIONS,
  PROJECT_FOCUS_AREA_OPTIONS,
} from './project-options';

export {
  PROJECT_DOMAIN_OPTIONS,
  PROJECT_FOCUS_AREA_OPTIONS,
  isAllowedProjectDomain,
  isAllowedProjectFocusArea,
} from './project-options';
export type { ProjectDomainOption, ProjectFocusAreaOption } from './project-options';

export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(63, 'Slug must be at most 63 characters')
  .regex(SLUG_REGEX, 'Slug must be lowercase alphanumeric with hyphens');

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .max(2048, 'URL too long')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP(S) URLs allowed');

export const connectionSourceSchema = z.enum(['qr', 'nfc', 'direct_link', 'manual', 'app']);

export const PROFILE_LOCATION_MAX_LENGTH = 120;
export const PROFILE_SKILLS_MAX_COUNT = 30;
export const PROFILE_SKILL_MAX_LENGTH = 50;

export const PROJECT_USER_ROLE_MAX_LENGTH = 120;
export const PROJECT_STATUS_MAX_LENGTH = 40;
export const PROJECT_TITLE_MAX_LENGTH = 120;
export const PROJECT_TAGLINE_MAX_LENGTH = 160;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 10000;
export const PROJECT_TECH_MAX_LENGTH = 40;
export const PROJECT_TECH_MAX_COUNT = 20;
export const PROJECT_DOMAIN_MAX_COUNT = 10;
export const PROJECT_FOCUS_AREA_MAX_COUNT = 10;
export const PROJECT_SLUG_TAKEN_MESSAGE = 'This project URL is already in use.';

/** Provisional lifecycle labels for future CRUD; not enforced at DB level in WS03-T002. */
export const PROJECT_LIFECYCLE_STATUSES = ['draft', 'active', 'completed', 'on_hold'] as const;
export type ProjectLifecycleStatus = (typeof PROJECT_LIFECYCLE_STATUSES)[number];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeProjectSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const projectSlugSchema = z
  .string()
  .refine((value) => !/(?:\.\.|\/|\\)/.test(value), 'Invalid slug')
  .transform((value) => normalizeProjectSlug(value))
  .pipe(slugSchema);

export function normalizeProjectUserRole(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export const projectUserRoleSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (value === undefined ? undefined : normalizeProjectUserRole(value)))
  .refine(
    (value) =>
      value === undefined || value === null || value.length <= PROJECT_USER_ROLE_MAX_LENGTH,
    `Role must be at most ${PROJECT_USER_ROLE_MAX_LENGTH} characters`,
  );

export const projectDateSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  .refine(
    (value) => value === undefined || value === null || ISO_DATE_REGEX.test(value),
    'Date must use YYYY-MM-DD format',
  );

export function validateProjectDateRange(input: {
  started_at?: string | null;
  ended_at?: string | null;
}): string | null {
  const started = input.started_at ?? null;
  const ended = input.ended_at ?? null;
  if (!started || !ended) return null;
  if (ended < started) {
    return 'End date cannot be earlier than start date.';
  }
  return null;
}

export const projectStatusSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  .refine(
    (value) =>
      value === undefined || value === null || value.length <= PROJECT_STATUS_MAX_LENGTH,
    `Status must be at most ${PROJECT_STATUS_MAX_LENGTH} characters`,
  );

export const projectLifecycleStatusSchema = z.enum(PROJECT_LIFECYCLE_STATUSES);

/** Trim, drop empties, dedupe case-insensitively, preserve first-entered capitalization. */
export function normalizeProjectTechnologies(technologies: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of technologies) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized;
}

export const projectTechnologiesSchema = z
  .array(z.string())
  .transform((items) => normalizeProjectTechnologies(items))
  .refine(
    (items) => items.length <= PROJECT_TECH_MAX_COUNT,
    `At most ${PROJECT_TECH_MAX_COUNT} technologies allowed`,
  )
  .refine(
    (items) =>
      items.every(
        (tech) => tech.length >= 1 && tech.length <= PROJECT_TECH_MAX_LENGTH,
      ),
    `Each technology must be 1–${PROJECT_TECH_MAX_LENGTH} characters`,
  );

function dedupeTrimmedLabels(items: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of items) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

export const projectDomainsInputSchema = z
  .array(z.string())
  .transform((items) => dedupeTrimmedLabels(items))
  .refine(
    (items) => items.length <= PROJECT_DOMAIN_MAX_COUNT,
    `At most ${PROJECT_DOMAIN_MAX_COUNT} domains allowed`,
  )
  .refine(
    (items) => items.every(isAllowedProjectDomain),
    'Unsupported domain',
  );

export const projectFocusAreasInputSchema = z
  .array(z.string())
  .transform((items) => dedupeTrimmedLabels(items))
  .refine(
    (items) => items.length <= PROJECT_FOCUS_AREA_MAX_COUNT,
    `At most ${PROJECT_FOCUS_AREA_MAX_COUNT} focus areas allowed`,
  )
  .refine(
    (items) => items.every(isAllowedProjectFocusArea),
    'Unsupported focus area',
  );

export const FORBIDDEN_CREATE_PROJECT_FIELDS = [
  'owner_user_id',
  'tenant_id',
  'profile_id',
  'user_id',
  'is_published',
  'plan',
  'is_owner',
  'membership_role',
] as const;

export function findForbiddenCreateProjectFields(
  input: Record<string, unknown>,
): string | null {
  for (const key of FORBIDDEN_CREATE_PROJECT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      return `Unexpected field: ${key}`;
    }
  }
  return null;
}

export function findForbiddenCreateProjectFormData(formData: FormData): string | null {
  const forbidden = new Set<string>(FORBIDDEN_CREATE_PROJECT_FIELDS);
  for (const key of formData.keys()) {
    if (forbidden.has(key)) {
      return 'Invalid submission.';
    }
  }
  return null;
}

export const CASE_STUDY_SECTION_ID_VALUES = [
  'problem',
  'approach',
  'results',
  'product',
  'architecture',
] as const;

export const caseStudySectionBodySchema = z.string().max(2000).trim();

const caseStudyMediaUrlSchema = z
  .string()
  .trim()
  .max(600_000, 'Image is too large')
  .refine(
    (value) => value.startsWith('data:image/') || /^https?:\/\//i.test(value),
    'Image must be a valid URL or uploaded photo',
  );

export const caseStudySectionContentSchema = z
  .object({
    text: caseStudySectionBodySchema.optional(),
    mediaUrl: caseStudyMediaUrlSchema.optional(),
  })
  .refine((value) => Boolean(value.text?.trim() || value.mediaUrl?.trim()), {
    message: 'Each showcase section needs text',
  });

export const caseStudySectionsSchema = z
  .record(z.union([caseStudySectionBodySchema, caseStudySectionContentSchema]))
  .optional()
  .default({});

export const projectCoreInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(PROJECT_TITLE_MAX_LENGTH)
    .trim(),
  slug: projectSlugSchema,
  tagline: z
    .string()
    .max(PROJECT_TAGLINE_MAX_LENGTH)
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value == null || value === '' ? null : value)),
  description: z
    .string()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH)
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value == null || value === '' ? null : value)),
  technologies: projectTechnologiesSchema.default([]),
  domains: projectDomainsInputSchema.default([]),
  focus_areas: projectFocusAreasInputSchema.default([]),
  user_role: projectUserRoleSchema,
  started_at: projectDateSchema,
  ended_at: projectDateSchema,
  status: projectLifecycleStatusSchema.default('draft'),
  case_study_sections: caseStudySectionsSchema,
});

function applyProjectDateRangeRefine<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const dateError = validateProjectDateRange({
      started_at: (data as { started_at?: string | null }).started_at ?? null,
      ended_at: (data as { ended_at?: string | null }).ended_at ?? null,
    });
    if (dateError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: dateError,
        path: ['ended_at'],
      });
    }
  });
}

export const createProjectInputSchema = applyProjectDateRangeRefine(
  projectCoreInputSchema.strict(),
);

export const FORBIDDEN_UPDATE_PROJECT_FIELDS = FORBIDDEN_CREATE_PROJECT_FIELDS;

export const updateProjectInputSchema = applyProjectDateRangeRefine(
  projectCoreInputSchema
    .extend({
      project_id: z.string().uuid('Invalid project ID'),
    })
    .strict(),
);

export function findForbiddenUpdateProjectFields(
  input: Record<string, unknown>,
): string | null {
  return findForbiddenCreateProjectFields(input);
}

export function findForbiddenUpdateProjectFormData(formData: FormData): string | null {
  const forbidden = new Set<string>(FORBIDDEN_UPDATE_PROJECT_FIELDS);
  for (const key of formData.keys()) {
    if (key === 'project_id') continue;
    if (forbidden.has(key)) {
      return 'Invalid submission.';
    }
  }
  return null;
}

export function normalizeProfileLocation(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function parseCommaSeparatedSkills(input: string): string[] {
  if (!input.trim()) return [];
  return input.split(',').map((part) => part.trim()).filter(Boolean);
}

/** Trim, drop empties, dedupe case-insensitively, preserve first-entered capitalization. */
export function normalizeProfileSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of skills) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized;
}

export const profileLocationSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (value === undefined ? undefined : normalizeProfileLocation(value)))
  .refine(
    (value) => value === undefined || value === null || value.length <= PROFILE_LOCATION_MAX_LENGTH,
    `Location must be at most ${PROFILE_LOCATION_MAX_LENGTH} characters`,
  );

export const profileSkillsSchema = z
  .array(z.string())
  .transform((items) => normalizeProfileSkills(items))
  .refine(
    (items) => items.length <= PROFILE_SKILLS_MAX_COUNT,
    `At most ${PROFILE_SKILLS_MAX_COUNT} skills allowed`,
  )
  .refine(
    (items) => items.every((skill) => skill.length >= 1 && skill.length <= PROFILE_SKILL_MAX_LENGTH),
    `Each skill must be 1–${PROFILE_SKILL_MAX_LENGTH} characters`,
  );

export const createProfileSchema = z.object({
  display_name: z.string().min(1).max(80).trim(),
  headline: z.string().max(120).trim().optional().nullable(),
  slug: slugSchema,
  bio: z.string().max(2000).trim().optional().nullable(),
  location: profileLocationSchema,
  skills: profileSkillsSchema.default([]).optional(),
  is_public: z.boolean().default(false),
});

export const updateProfileSchema = createProfileSchema.partial();

export const profileLinkSchema = z.object({
  type: profileLinkTypeSchema,
  label: z.string().max(50).trim().optional().nullable(),
  url: urlSchema,
  sort_order: z.number().int().min(0).max(100).default(0),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(120).trim(),
  tagline: z.string().max(160).trim().optional().nullable(),
  description: z.string().max(10000).trim().optional().nullable(),
  technologies: z.array(z.string().min(1).max(40).trim()).max(20).default([]),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(1000).default(0),
  domains: z.array(z.string().min(1).max(40).trim()).max(10).default([]),
  focus_areas: z.array(z.string().min(1).max(40).trim()).max(10).default([]),
  case_study_sections: caseStudySectionsSchema,
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectLinkSchema = z.object({
  type: projectLinkTypeSchema,
  label: z.string().max(50).trim().optional().nullable(),
  url: urlSchema,
  sort_order: z.number().int().min(0).max(100).default(0),
});

export const reorderProjectsSchema = z.object({
  project_ids: z.array(z.string().uuid()).min(1).max(100),
});

export const saveConnectionSchema = z.object({
  saved_profile_id: z.string().uuid(),
  source: connectionSourceSchema.default('manual'),
  connected_at: z.string().datetime().optional().nullable(),
  met_at: z.string().datetime().optional().nullable(),
});

/** Public handle for Connections — normalize case before slug rules. */
export const connectionTargetSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(63)
  .transform((value) => value.toLowerCase())
  .pipe(slugSchema);

/**
 * WS15-T003 — Add Connection input.
 * Client may supply a target profile UUID and/or public slug.
 * Owner identity is never accepted from the client.
 */
export const addConnectionInputSchema = z
  .object({
    targetProfileId: z.string().uuid().optional(),
    targetSlug: connectionTargetSlugSchema.optional(),
    source: connectionSourceSchema.default('manual'),
  })
  .refine((data) => Boolean(data.targetProfileId || data.targetSlug), {
    message: 'A target profile id or slug is required',
    path: ['targetProfileId'],
  });

/** Remove by connection row id and/or saved target profile id. */
export const removeConnectionInputSchema = z
  .object({
    connectionId: z.string().uuid().optional(),
    targetProfileId: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.connectionId || data.targetProfileId), {
    message: 'A connection id or target profile id is required',
    path: ['connectionId'],
  });

export const connectionStatusInputSchema = z
  .object({
    targetProfileId: z.string().uuid().optional(),
    targetSlug: connectionTargetSlugSchema.optional(),
  })
  .refine((data) => Boolean(data.targetProfileId || data.targetSlug), {
    message: 'A target profile id or slug is required',
    path: ['targetProfileId'],
  });

export const connectionNoteSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
});

/** WS15-T006 — update private note / context / dates for an owned Connection. */
export const updateConnectionMetadataInputSchema = z.object({
  connectionId: z.string().uuid(),
  privateNote: z
    .union([z.string(), z.null()])
    .optional()
    .superRefine((v, ctx) => {
      if (typeof v === 'string' && v.replace(/^\s+|\s+$/g, '').length > 5000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Private note is too long',
        });
      }
    })
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v == null) return null;
      // Preserve intentional line breaks; trim only outer whitespace.
      const trimmed = v.replace(/^\s+|\s+$/g, '');
      return trimmed === '' ? null : trimmed;
    }),
  context: z
    .union([z.string(), z.null()])
    .optional()
    .superRefine((v, ctx) => {
      if (typeof v === 'string' && v.trim().length > 500) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Context is too long',
        });
      }
    })
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v == null) return null;
      const trimmed = v.trim();
      return trimmed === '' ? null : trimmed;
    }),
  connectedAt: z
    .union([z.string().datetime(), z.null()])
    .optional(),
  metAt: z.union([z.string().datetime(), z.null()]).optional(),
  source: connectionSourceSchema.optional(),
});

export const connectionMetadataInputSchema = z.object({
  connectionId: z.string().uuid(),
});

export const collectionSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  description: z.string().max(500).trim().optional().nullable(),
});

/** WS15-T005 — create collection (owner identity never accepted from client). */
export const createCollectionInputSchema = z.object({
  name: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Collection name is required').max(80, 'Collection name is too long')),
  description: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null) return null;
      const trimmed = v.trim();
      return trimmed === '' ? null : trimmed.slice(0, 500);
    }),
});

export const updateCollectionInputSchema = z.object({
  collectionId: z.string().uuid(),
  name: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Collection name is required').max(80, 'Collection name is too long'))
    .optional(),
  description: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v == null) return null;
      const trimmed = v.trim();
      return trimmed === '' ? null : trimmed.slice(0, 500);
    }),
});

export const collectionIdInputSchema = z.object({
  collectionId: z.string().uuid(),
});

export const collectionMembershipInputSchema = z.object({
  collectionId: z.string().uuid(),
  connectionId: z.string().uuid(),
});

export const connectionCollectionsInputSchema = z.object({
  connectionId: z.string().uuid(),
});

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const signUpSchema = z.object({
  email: z.string().email().max(255),
  password: passwordSchema,
  display_name: z.string().min(1).max(80).trim(),
  slug: slugSchema,
});

export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address').max(255),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const analyticsEventTypeSchema = z.enum([
  'profile_view',
  'project_view',
  'link_click',
  'resume_click',
  'research_view',
  'paper_download',
  'citation_copy',
  'abstract_expand',
  'figure_view',
  'related_project_click',
  'time_spent_on_research',
  'project_time_spent',
  'project_section_time_spent',
  'project_section_view',
  'project_section_hover_or_click',
  'profile_share',
  'qr_download',
]);

export const analyticsEventSchema = z.object({
  profile_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  research_paper_id: z.string().uuid().optional(),
  target_type: z.enum(['profile', 'project', 'research']).optional(),
  target_id: z.string().uuid().optional(),
  event_type: analyticsEventTypeSchema,
  section_name: z.string().max(120).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  source: connectionSourceSchema.optional().nullable(),
  referrer: z.string().max(2048).optional().nullable(),
  session_id: z.string().max(64).optional().nullable(),
});

export const MODERATION_REPORT_REASON_CATEGORIES = [
  'spam',
  'harassment',
  'impersonation',
  'copyright',
  'other',
] as const;

export const moderationReportSchema = z
  .object({
    target_type: z.enum(['profile', 'project']),
    target_id: z.string().uuid(),
    reason_category: z.enum(MODERATION_REPORT_REASON_CATEGORIES),
    description: z.string().max(1500).trim().optional(),
  })
  .strict();

export const dmcaNoticeSchema = z.object({
  claimant_name: z.string().min(1).max(200).trim(),
  claimant_email: z.string().email().max(255),
  copyrighted_work: z.string().min(10).max(5000).trim(),
  infringing_url: urlSchema,
  statement: z.string().min(20).max(5000).trim(),
  signature: z.string().min(2).max(200).trim(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export * from './reserved-profile-slugs';
export * from './profile-links';
export * from './project-links';
export * from './upload-schemas';
export * from './research-schemas';
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateProjectInputPayload = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInputPayload = z.infer<typeof updateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SaveConnectionInput = z.infer<typeof saveConnectionSchema>;
export type AddConnectionInput = z.infer<typeof addConnectionInputSchema>;
export type RemoveConnectionInput = z.infer<typeof removeConnectionInputSchema>;
export type ConnectionStatusInput = z.infer<typeof connectionStatusInputSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionInputSchema>;
export type CollectionMembershipInput = z.infer<typeof collectionMembershipInputSchema>;
export type UpdateConnectionMetadataInput = z.infer<typeof updateConnectionMetadataInputSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type AnalyticsEventType = z.infer<typeof analyticsEventTypeSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;

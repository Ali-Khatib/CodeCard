import { z } from 'zod';

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

export const profileLinkTypeSchema = z.enum([
  'website',
  'github',
  'linkedin',
  'twitter',
  'resume',
  'email',
  'other',
]);

export const projectLinkTypeSchema = z.enum(['live', 'repo', 'demo', 'paper', 'other']);

export const connectionSourceSchema = z.enum(['qr', 'nfc', 'direct_link', 'manual', 'app']);

export const PROFILE_LOCATION_MAX_LENGTH = 120;
export const PROFILE_SKILLS_MAX_COUNT = 30;
export const PROFILE_SKILL_MAX_LENGTH = 50;

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
    message: 'Each showcase section needs text or an image',
  });

export const caseStudySectionsSchema = z
  .record(z.union([caseStudySectionBodySchema, caseStudySectionContentSchema]))
  .optional()
  .default({});

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

export const connectionNoteSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
});

export const collectionSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  description: z.string().max(500).trim().optional().nullable(),
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

export const analyticsEventSchema = z.object({
  profile_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  research_paper_id: z.string().uuid().optional(),
  target_type: z.enum(['profile', 'project', 'research']).optional(),
  target_id: z.string().uuid().optional(),
  event_type: z.enum([
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
  ]),
  section_name: z.string().max(120).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  source: connectionSourceSchema.optional().nullable(),
  referrer: z.string().max(2048).optional().nullable(),
  session_id: z.string().max(64).optional().nullable(),
});

export const moderationReportSchema = z.object({
  target_type: z.enum(['profile', 'project', 'media']),
  target_id: z.string().uuid(),
  reason: z.string().min(10).max(2000).trim(),
  reporter_email: z.string().email().max(255).optional(),
});

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
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SaveConnectionInput = z.infer<typeof saveConnectionSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

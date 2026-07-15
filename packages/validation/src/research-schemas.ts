import { z } from 'zod';

export const RESEARCH_TITLE_MAX_LENGTH = 200;
export const RESEARCH_ABSTRACT_MAX_LENGTH = 10000;
export const RESEARCH_VENUE_MAX_LENGTH = 200;
export const RESEARCH_PUBLICATION_STATUS_MAX_LENGTH = 80;
export const RESEARCH_CITATION_MAX_LENGTH = 2000;
export const RESEARCH_AUTHOR_MAX_LENGTH = 120;
export const RESEARCH_AUTHOR_MAX_COUNT = 40;
export const RESEARCH_TAG_MAX_LENGTH = 40;
export const RESEARCH_TAG_MAX_COUNT = 20;
export const RESEARCH_YEAR_MIN = 1800;
export const RESEARCH_YEAR_MAX = 2100;
export const RESEARCH_REORDER_MAX_COUNT = 100;
export const RESEARCH_SLUG_TAKEN_MESSAGE = 'This research URL is already in use.';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Same normalization as project/profile URL slugs. */
export function normalizeResearchSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const researchSlugSchema = z
  .string()
  .refine((value) => !/(?:\.\.|\/|\\)/.test(value), 'Invalid slug')
  .transform((value) => normalizeResearchSlug(value))
  .pipe(
    z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(63, 'Slug must be at most 63 characters')
      .regex(SLUG_REGEX, 'Slug must be lowercase alphanumeric with hyphens'),
  );

const httpUrlSchema = z
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

/**
 * External research PDF / paper link (MVP).
 * HTTPS only; no embedded credentials; no storage paths or signed URLs.
 * CodeCard does not host, scan, or verify the remote document.
 */
export function normalizeExternalPdfUrl(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return trimmed;
}

export function isValidExternalPdfUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  if (value.includes('://') === false && value.startsWith('//')) return false;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  if (!parsed.hostname) return false;
  return true;
}

export function externalPdfHostname(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return null;
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

const externalPdfUrlSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => normalizeExternalPdfUrl(value))
  .refine(
    (value) =>
      value === undefined || value === null || isValidExternalPdfUrl(value),
    'Enter a valid HTTPS URL without credentials',
  );

export const FORBIDDEN_CREATE_RESEARCH_FIELDS = [
  'owner_user_id',
  'owner_id',
  'user_id',
  'tenant_id',
  'profile_id',
  'is_published',
  'sort_order',
  'plan',
  'is_owner',
  'membership_role',
  'cover_image_url',
  'storage_path',
  'bucket',
  'bucket_name',
  'path',
  'authorization',
  'authorized',
] as const;

export const FORBIDDEN_UPDATE_RESEARCH_FIELDS = FORBIDDEN_CREATE_RESEARCH_FIELDS;

export function findForbiddenCreateResearchFields(
  input: Record<string, unknown>,
): string | null {
  for (const key of FORBIDDEN_CREATE_RESEARCH_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      return `Unexpected field: ${key}`;
    }
  }
  return null;
}

export function findForbiddenCreateResearchFormData(formData: FormData): string | null {
  const forbidden = new Set<string>(FORBIDDEN_CREATE_RESEARCH_FIELDS);
  for (const key of formData.keys()) {
    if (forbidden.has(key)) {
      return 'Invalid submission.';
    }
  }
  return null;
}

export function findForbiddenUpdateResearchFields(
  input: Record<string, unknown>,
): string | null {
  return findForbiddenCreateResearchFields(input);
}

export function findForbiddenUpdateResearchFormData(formData: FormData): string | null {
  const forbidden = new Set<string>(FORBIDDEN_UPDATE_RESEARCH_FIELDS);
  for (const key of formData.keys()) {
    if (key === 'research_paper_id') continue;
    if (forbidden.has(key)) {
      return 'Invalid submission.';
    }
  }
  return null;
}

function normalizeNullableTrimmed(
  value: string | null | undefined,
  max: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/**
 * Normalize DOI / doi.org URL into a stable https://doi.org/... form when possible.
 * Does not verify the DOI remotely.
 */
export function normalizeDoiUrl(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const bare = trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
  if (/^10\.\d{4,9}\/\S+$/i.test(bare)) {
    return `https://doi.org/${bare}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return trimmed;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export function isValidDoiUrlValue(value: string | null | undefined): boolean {
  if (value == null || value === '') return true;
  const normalized = normalizeDoiUrl(value);
  if (normalized == null) return true;
  if (/^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/i.test(normalized)) {
    return true;
  }
  try {
    const parsed = new URL(normalized);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function normalizeResearchAuthors(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const authors: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    authors.push(trimmed);
  }
  return authors;
}

export function normalizeResearchTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(trimmed);
  }
  return tags;
}

const nullableHttpUrlSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  .refine(
    (value) => value === undefined || value === null || httpUrlSchema.safeParse(value).success,
    'Only HTTP(S) URLs allowed',
  );

/** @deprecated Prefer externalPdfUrlSchema for research PDF links; kept for non-PDF HTTP fields. */
const nullableUrlSchema = nullableHttpUrlSchema;

const doiUrlSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => normalizeDoiUrl(value))
  .refine((value) => isValidDoiUrlValue(value), 'Enter a valid DOI or DOI URL');

const yearSchema = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const n = typeof value === 'number' ? value : Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  .refine(
    (value) =>
      value === undefined ||
      value === null ||
      (Number.isInteger(value) && value >= RESEARCH_YEAR_MIN && value <= RESEARCH_YEAR_MAX),
    `Year must be between ${RESEARCH_YEAR_MIN} and ${RESEARCH_YEAR_MAX}`,
  );

const authorsSchema = z
  .unknown()
  .optional()
  .transform((value) => (value === undefined ? [] : normalizeResearchAuthors(value)))
  .refine(
    (authors) => authors.length <= RESEARCH_AUTHOR_MAX_COUNT,
    `At most ${RESEARCH_AUTHOR_MAX_COUNT} authors`,
  )
  .refine(
    (authors) => authors.every((author) => author.length <= RESEARCH_AUTHOR_MAX_LENGTH),
    `Each author must be at most ${RESEARCH_AUTHOR_MAX_LENGTH} characters`,
  );

const tagsSchema = z
  .unknown()
  .optional()
  .transform((value) => (value === undefined ? [] : normalizeResearchTags(value)))
  .refine(
    (tags) => tags.length <= RESEARCH_TAG_MAX_COUNT,
    `At most ${RESEARCH_TAG_MAX_COUNT} tags`,
  )
  .refine(
    (tags) => tags.every((tag) => tag.length <= RESEARCH_TAG_MAX_LENGTH),
    `Each tag must be at most ${RESEARCH_TAG_MAX_LENGTH} characters`,
  );

const relatedProjectIdSchema = z
  .union([z.string().uuid('Invalid project ID'), z.null()])
  .optional()
  .transform((value) => (value === undefined ? undefined : value));

export const researchCoreInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(RESEARCH_TITLE_MAX_LENGTH, `Title must be at most ${RESEARCH_TITLE_MAX_LENGTH} characters`),
  slug: researchSlugSchema,
  abstract: z
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
        value === undefined ||
        value === null ||
        value.length <= RESEARCH_ABSTRACT_MAX_LENGTH,
      `Abstract must be at most ${RESEARCH_ABSTRACT_MAX_LENGTH} characters`,
    ),
  authors: authorsSchema,
  venue: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => normalizeNullableTrimmed(value, RESEARCH_VENUE_MAX_LENGTH))
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        value.length <= RESEARCH_VENUE_MAX_LENGTH,
      `Venue must be at most ${RESEARCH_VENUE_MAX_LENGTH} characters`,
    ),
  publication_status: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) =>
      normalizeNullableTrimmed(value, RESEARCH_PUBLICATION_STATUS_MAX_LENGTH),
    )
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        value.length <= RESEARCH_PUBLICATION_STATUS_MAX_LENGTH,
      `Publication status must be at most ${RESEARCH_PUBLICATION_STATUS_MAX_LENGTH} characters`,
    ),
  year: yearSchema,
  doi_url: doiUrlSchema,
  pdf_url: externalPdfUrlSchema,
  citation_text: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => normalizeNullableTrimmed(value, RESEARCH_CITATION_MAX_LENGTH))
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        value.length <= RESEARCH_CITATION_MAX_LENGTH,
      `Citation must be at most ${RESEARCH_CITATION_MAX_LENGTH} characters`,
    ),
  tags: tagsSchema,
  related_project_id: relatedProjectIdSchema,
});

export const createResearchSchema = researchCoreInputSchema.strict();
export const createResearchInputSchema = createResearchSchema;

export const updateResearchSchema = researchCoreInputSchema
  .extend({
    research_paper_id: z.string().uuid('Invalid research paper ID'),
  })
  .strict();

export const updateResearchInputSchema = updateResearchSchema;

export const reorderResearchSchema = z
  .object({
    research_paper_ids: z
      .array(z.string().uuid('Invalid research paper ID'))
      .min(1, 'At least one research paper is required')
      .max(RESEARCH_REORDER_MAX_COUNT, `At most ${RESEARCH_REORDER_MAX_COUNT} papers`),
  })
  .strict()
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (const id of data.research_paper_ids) {
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate research paper IDs are not allowed',
          path: ['research_paper_ids'],
        });
        return;
      }
      seen.add(id);
    }
  });

export type CreateResearchPayload = z.infer<typeof createResearchSchema>;
export type UpdateResearchPayload = z.infer<typeof updateResearchSchema>;
export type ReorderResearchPayload = z.infer<typeof reorderResearchSchema>;

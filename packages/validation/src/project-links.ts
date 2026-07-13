import { z } from 'zod';

export const PROJECT_LINK_LABEL_MAX_LENGTH = 50;
export const PROJECT_LINK_URL_MAX_LENGTH = 2048;
export const PROJECT_LINKS_MAX_COUNT = 10;

export const projectLinkTypeSchema = z.enum(['live', 'repo', 'demo', 'paper', 'other']);

export const PROJECT_LINK_TYPES = projectLinkTypeSchema.options;

const BLOCKED_URL_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:', 'file:']);

export function normalizeProjectLinkLabel(label: string | null | undefined): string | null {
  if (label == null) return null;
  const trimmed = label.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeProjectLinkUrl(rawUrl: string): string {
  return rawUrl.trim();
}

export function isAllowedProjectLinkHref(url: string): boolean {
  if (!url || url.startsWith('//')) return false;
  try {
    const parsed = new URL(url);
    if (BLOCKED_URL_PROTOCOLS.has(parsed.protocol)) return false;
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const projectLinkLabelSchema = z
  .string()
  .max(
    PROJECT_LINK_LABEL_MAX_LENGTH,
    `Label must be at most ${PROJECT_LINK_LABEL_MAX_LENGTH} characters`,
  )
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === undefined ? undefined : normalizeProjectLinkLabel(value)));

export const projectLinkUrlInputSchema = z
  .string()
  .min(1, 'URL is required')
  .max(PROJECT_LINK_URL_MAX_LENGTH, 'URL is too long')
  .trim()
  .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, ''));

export const projectLinkInputSchema = z
  .object({
    type: projectLinkTypeSchema,
    label: projectLinkLabelSchema,
    url: projectLinkUrlInputSchema,
  })
  .superRefine((value, ctx) => {
    const normalizedUrl = normalizeProjectLinkUrl(value.url);
    if (!isAllowedProjectLinkHref(normalizedUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid http(s) URL',
        path: ['url'],
      });
    }
  })
  .transform((value) => ({
    type: value.type,
    label: value.label ?? null,
    url: normalizeProjectLinkUrl(value.url),
  }));

export function projectLinkIdentityKey(type: string, url: string): string {
  return `${type.toLowerCase()}::${url.trim().toLowerCase()}`;
}

export function findDuplicateProjectLink(
  links: Array<{ id?: string; type: string; url: string }>,
  candidate: { id?: string; type: string; url: string },
): boolean {
  const key = projectLinkIdentityKey(candidate.type, candidate.url);
  return links.some(
    (link) =>
      link.id !== candidate.id && projectLinkIdentityKey(link.type, link.url) === key,
  );
}

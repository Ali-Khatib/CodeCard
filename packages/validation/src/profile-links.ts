import { z } from 'zod';

export const PROFILE_LINK_LABEL_MAX_LENGTH = 50;
export const PROFILE_LINK_URL_MAX_LENGTH = 2048;
export const PROFILE_LINKS_MAX_COUNT = 12;

export const profileLinkTypeSchema = z.enum([
  'website',
  'github',
  'linkedin',
  'twitter',
  'resume',
  'email',
  'other',
]);

export const PROFILE_LINK_TYPES = profileLinkTypeSchema.options;

const BLOCKED_URL_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:', 'file:']);

export function normalizeProfileLinkLabel(label: string | null | undefined): string | null {
  if (label == null) return null;
  const trimmed = label.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeProfileLinkUrl(type: string, rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (type === 'email') {
    if (trimmed.toLowerCase().startsWith('mailto:')) {
      const address = trimmed.slice('mailto:'.length).split('?')[0]?.trim() ?? '';
      return `mailto:${address}`;
    }
    return `mailto:${trimmed}`;
  }
  return trimmed;
}

export function isAllowedProfileLinkHref(url: string): boolean {
  if (!url || url.startsWith('//')) return false;
  try {
    const parsed = new URL(url);
    if (BLOCKED_URL_PROTOCOLS.has(parsed.protocol)) return false;
    if (parsed.protocol === 'mailto:') {
      const address = parsed.pathname || parsed.href.replace(/^mailto:/i, '');
      return address.length > 0 && address.length <= 320;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const profileLinkLabelSchema = z
  .string()
  .max(PROFILE_LINK_LABEL_MAX_LENGTH, `Label must be at most ${PROFILE_LINK_LABEL_MAX_LENGTH} characters`)
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === undefined ? undefined : normalizeProfileLinkLabel(value)));

export const profileLinkUrlInputSchema = z
  .string()
  .min(1, 'URL is required')
  .max(PROFILE_LINK_URL_MAX_LENGTH, 'URL is too long')
  .trim()
  .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, ''));

export const profileLinkInputSchema = z
  .object({
    type: profileLinkTypeSchema,
    label: profileLinkLabelSchema,
    url: profileLinkUrlInputSchema,
  })
  .superRefine((value, ctx) => {
    const normalizedUrl = normalizeProfileLinkUrl(value.type, value.url);
    if (!isAllowedProfileLinkHref(normalizedUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid http(s) or mailto link',
        path: ['url'],
      });
      return;
    }
    if (value.type === 'email') {
      const address = normalizedUrl.replace(/^mailto:/i, '');
      const emailOk = z.string().email().safeParse(address).success;
      if (!emailOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid email address',
          path: ['url'],
        });
      }
    }
  })
  .transform((value) => ({
    type: value.type,
    label: value.label ?? null,
    url: normalizeProfileLinkUrl(value.type, value.url),
  }));

export const reorderProfileLinksSchema = z.object({
  link_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one link to reorder')
    .max(PROFILE_LINKS_MAX_COUNT),
});

export function profileLinkIdentityKey(type: string, url: string): string {
  return `${type.toLowerCase()}::${url.trim().toLowerCase()}`;
}

export function findDuplicateProfileLink(
  links: Array<{ id?: string; type: string; url: string }>,
  candidate: { id?: string; type: string; url: string },
): boolean {
  const key = profileLinkIdentityKey(candidate.type, candidate.url);
  return links.some(
    (link) =>
      link.id !== candidate.id && profileLinkIdentityKey(link.type, link.url) === key,
  );
}

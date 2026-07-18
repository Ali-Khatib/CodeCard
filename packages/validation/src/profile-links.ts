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

/** Host expectations for typed profile links. Website/other/resume stay open https. */
const PROFILE_LINK_HOST_RULES: Partial<
  Record<(typeof PROFILE_LINK_TYPES)[number], { hosts: string[]; message: string }>
> = {
  github: {
    hosts: ['github.com'],
    message: 'GitHub links must use github.com (example: https://github.com/yourname)',
  },
  linkedin: {
    hosts: ['linkedin.com'],
    message: 'LinkedIn links must use linkedin.com (example: https://www.linkedin.com/in/yourname)',
  },
  twitter: {
    hosts: ['x.com', 'twitter.com'],
    message: 'X / Twitter links must use x.com or twitter.com (example: https://x.com/yourname)',
  },
};

export function profileLinkUrlHelp(type: string): string {
  switch (type) {
    case 'github':
      return 'Paste your GitHub profile URL (github.com/…).';
    case 'linkedin':
      return 'Paste your LinkedIn profile URL (linkedin.com/in/…).';
    case 'twitter':
      return 'Paste your X profile URL (x.com/… or twitter.com/…). Optional.';
    case 'website':
      return 'Add your personal website if you have one (optional). Any https:// URL works.';
    case 'email':
      return 'Your public contact email.';
    case 'resume':
      return 'Link to a public resume or CV (https://…).';
    default:
      return 'Paste a full https:// URL.';
  }
}

export function profileLinkUrlPlaceholder(type: string): string {
  switch (type) {
    case 'github':
      return 'https://github.com/yourname';
    case 'linkedin':
      return 'https://www.linkedin.com/in/yourname';
    case 'twitter':
      return 'https://x.com/yourname';
    case 'website':
      return 'https://yourname.dev';
    case 'email':
      return 'you@example.com';
    case 'resume':
      return 'https://…';
    default:
      return 'https://example.com';
  }
}

function hostMatches(hostname: string, allowed: string[]): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return allowed.some((rule) => host === rule || host.endsWith(`.${rule}`));
}

export function profileLinkHostError(type: string, url: string): string | null {
  const rule = PROFILE_LINK_HOST_RULES[type as keyof typeof PROFILE_LINK_HOST_RULES];
  if (!rule) return null;
  try {
    const parsed = new URL(url);
    if (!hostMatches(parsed.hostname, rule.hosts)) {
      return rule.message;
    }
  } catch {
    return rule.message;
  }
  return null;
}

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
      return;
    }
    const hostError = profileLinkHostError(value.type, normalizedUrl);
    if (hostError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: hostError,
        path: ['url'],
      });
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

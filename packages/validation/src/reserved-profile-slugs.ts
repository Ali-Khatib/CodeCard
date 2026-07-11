/** Application routes and reserved paths that cannot be used as public profile slugs. */
export const RESERVED_PROFILE_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'demo',
  'forgot-password',
  'how-it-works',
  'landing',
  'legal',
  'pricing',
  'profiles',
  'research',
  'reset-password',
  'sign-in',
  'sign-up',
]);

export const RESERVED_PROFILE_SLUG_MESSAGE = 'This profile URL is reserved.';

export function isReservedProfileSlug(slug: string): boolean {
  return RESERVED_PROFILE_SLUGS.has(slug.trim().toLowerCase());
}

export const PROFILE_SLUG_TAKEN_MESSAGE = 'This profile URL is already taken.';

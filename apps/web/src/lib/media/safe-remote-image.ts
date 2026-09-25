const ALLOWED_REMOTE_IMAGE_HOSTS = [
  /(^|\.)supabase\.co$/i,
  /^images\.unsplash\.com$/i,
];

/**
 * Next/Image may fetch remote URLs on the server. Only allow hosts we already
 * list in `next.config.ts` images.remotePatterns.
 */
export function isSafeRemoteImageUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    return ALLOWED_REMOTE_IMAGE_HOSTS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

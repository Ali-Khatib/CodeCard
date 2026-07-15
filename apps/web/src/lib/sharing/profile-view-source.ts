import type { ConnectionSource } from '@codecard/types';

export const DEFAULT_PROFILE_VIEW_SOURCE: ConnectionSource = 'direct_link';

/**
 * Map an explicit public-route `source` query value to an approved analytics source.
 * Invalid or missing values fall back to direct_link — never pass through arbitrary strings.
 */
export function parseProfileViewSource(
  raw: string | null | undefined,
): ConnectionSource {
  if (raw === 'qr') return 'qr';
  return DEFAULT_PROFILE_VIEW_SOURCE;
}

export function readProfileViewSourceFromSearch(
  search: string | null | undefined,
): ConnectionSource {
  if (!search) return DEFAULT_PROFILE_VIEW_SOURCE;
  try {
    const params = new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search,
    );
    // Deterministic: first `source` value only; ignore additional duplicates for mapping.
    return parseProfileViewSource(params.get('source'));
  } catch {
    return DEFAULT_PROFILE_VIEW_SOURCE;
  }
}

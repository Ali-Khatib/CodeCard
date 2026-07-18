/**
 * Join aria-describedby / aria-errormessage id tokens deterministically.
 * Omits empty values; returns undefined when nothing remains (attribute omitted).
 */
export function joinDescribedBy(
  ...ids: Array<string | false | null | undefined>
): string | undefined {
  const joined = ids.filter((id): id is string => typeof id === 'string' && id.length > 0).join(' ');
  return joined.length > 0 ? joined : undefined;
}

import type { VisitorConversionMarkerContext } from '@/lib/visitor-conversion/visitor-conversion';

/**
 * Successful public pages render this inert marker so the root controller can
 * distinguish published content from not-found/error routes.
 * Prompt eligibility is limited to landing + live-demo entry; markers alone
 * do not schedule the conversion box.
 */
export function VisitorConversionMarker({
  context,
  referrer,
  profileId,
}: {
  context: VisitorConversionMarkerContext;
  referrer?: string | null;
  profileId?: string | null;
}) {
  return (
    <span
      hidden
      aria-hidden="true"
      data-visitor-conversion-context={context}
      data-visitor-conversion-referrer={referrer ?? undefined}
      data-visitor-conversion-profile-id={profileId ?? undefined}
    />
  );
}

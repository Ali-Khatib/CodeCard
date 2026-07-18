import type { VisitorConversionContext } from '@/lib/visitor-conversion/visitor-conversion';

/**
 * Successful public pages render this inert marker so the root controller can
 * distinguish published content from not-found/error routes.
 */
export function VisitorConversionMarker({
  context,
  referrer,
  profileId,
}: {
  context: Extract<
    VisitorConversionContext,
    'live_demo' | 'public_profile' | 'public_project' | 'public_research'
  >;
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

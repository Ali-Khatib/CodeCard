import { isAudienceRole } from '@codecard/validation';

/**
 * Profile-view role comes from the signed-in viewer's saved choice.
 * A client-supplied audience_role is never stored.
 */
export function profileViewAudienceMetadata(
  metadata: Record<string, unknown>,
  viewerRole: unknown,
): Record<string, unknown> {
  const next = { ...metadata };
  delete next.audience_role;
  if (isAudienceRole(viewerRole)) {
    next.audience_role = viewerRole;
  }
  return next;
}

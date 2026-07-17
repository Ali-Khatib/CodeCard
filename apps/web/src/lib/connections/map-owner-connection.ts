import type { OwnerConnectionListItem } from '@/lib/connections/connections-contract';
import type { WorkspaceConnection } from '@/lib/dashboard/workspace-demo';

const SOURCE_LABEL: Record<string, WorkspaceConnection['source']> = {
  manual: 'Manual',
  qr: 'QR',
  nfc: 'NFC',
  direct_link: 'Manual',
  app: 'Manual',
};

function formatConnectedDate(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export type AuthenticatedConnectionCard = WorkspaceConnection & {
  profileSlug?: string;
  savedProfileId: string;
  isPublicTarget: boolean;
};

/** Map a safe owner list item into the existing Connections card shape. */
export function mapOwnerConnectionToCard(
  item: OwnerConnectionListItem,
): AuthenticatedConnectionCard {
  const target = item.target;
  return {
    id: item.connectionId,
    name: target.displayName,
    role: target.headline?.trim() || (target.isPublic ? 'CodeCard member' : 'Unavailable'),
    company: target.location?.trim() || '',
    metAt: target.isPublic ? 'Connected' : 'Saved',
    date: formatConnectedDate(item.connectedAt ?? item.createdAt),
    source: SOURCE_LABEL[item.source] ?? 'Manual',
    note: target.isPublic
      ? target.headline?.trim() || target.location?.trim() || 'Saved from their public CodeCard.'
      : 'This CodeCard is no longer public. Your Connection is still saved privately.',
    followUp: 'none',
    tags: [],
    avatarUrl: target.avatarPublicUrl ?? undefined,
    profileSlug: target.slug || undefined,
    savedProfileId: target.profileId,
    isPublicTarget: target.isPublic,
  };
}

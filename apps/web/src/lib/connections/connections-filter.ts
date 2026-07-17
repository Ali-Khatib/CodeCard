import type { WorkspaceConnection } from '@/lib/dashboard/workspace-demo';

export type ConnectionsSortId = 'newest' | 'oldest' | 'name_asc' | 'name_desc';
export type ConnectionsCollectionFilter = 'all' | 'uncategorized' | string;

export type FilterableConnection = WorkspaceConnection & {
  context?: string | null;
  privateNote?: string | null;
  connectedAtIso?: string | null;
};

export function normalizeConnectionsQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

export function connectionMatchesQuery(
  connection: FilterableConnection,
  rawQuery: string,
): boolean {
  const q = normalizeConnectionsQuery(rawQuery);
  if (!q) return true;
  const haystack = [
    connection.name,
    connection.role,
    connection.company,
    connection.metAt,
    connection.note,
    connection.context ?? '',
    connection.privateNote ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function connectionMatchesCollectionFilter(
  connectionId: string,
  filter: ConnectionsCollectionFilter,
  memberships: Record<string, string[]>,
): boolean {
  if (filter === 'all') return true;
  const ids = memberships[connectionId] ?? [];
  if (filter === 'uncategorized') return ids.length === 0;
  return ids.includes(filter);
}

function connectedTimestamp(connection: FilterableConnection): number {
  const iso = connection.connectedAtIso;
  if (iso) {
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export function sortConnections(
  connections: FilterableConnection[],
  sort: ConnectionsSortId,
): FilterableConnection[] {
  const copy = [...connections];
  copy.sort((a, b) => {
    if (sort === 'name_asc' || sort === 'name_desc') {
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return sort === 'name_asc' ? cmp : -cmp;
      return a.id.localeCompare(b.id);
    }
    const ta = connectedTimestamp(a);
    const tb = connectedTimestamp(b);
    if (ta !== tb) {
      return sort === 'newest' ? tb - ta : ta - tb;
    }
    // Deterministic tie-breaker
    return a.id.localeCompare(b.id);
  });
  return copy;
}

export function filterAndSortConnections(input: {
  connections: FilterableConnection[];
  query: string;
  collectionFilter: ConnectionsCollectionFilter;
  memberships: Record<string, string[]>;
  sort: ConnectionsSortId;
}): FilterableConnection[] {
  const filtered = input.connections.filter(
    (c) =>
      connectionMatchesQuery(c, input.query) &&
      connectionMatchesCollectionFilter(c.id, input.collectionFilter, input.memberships),
  );
  return sortConnections(filtered, input.sort);
}

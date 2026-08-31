import type { WorkspaceConnection } from '@/lib/dashboard/workspace-demo';

export type ConnectionsSortId = 'newest' | 'oldest' | 'name_asc' | 'name_desc';
export type ConnectionsCollectionFilter = 'all' | 'uncategorized' | string;
/** `all` | `unknown` (no location) | exact country/location string. */
export type ConnectionsLocationFilter = 'all' | 'unknown' | string;
/** `all` | `unassigned` (no meeting point) | exact meeting-point name. */
export type ConnectionsMeetingPointFilter = 'all' | 'unassigned' | string;

export type FilterableConnection = WorkspaceConnection & {
  context?: string | null;
  privateNote?: string | null;
  connectedAtIso?: string | null;
};

export function normalizeConnectionsQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeConnectionLocation(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

export function normalizeMeetingPoint(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

/** Placeholders that mean “no meeting point assigned yet.” */
const UNASSIGNED_MEETING_LABELS = new Set(['', 'connected', 'saved', 'unassigned']);

export function connectionMeetingPointValue(connection: FilterableConnection): string {
  const raw =
    connection.meetingPoint?.trim() ||
    connection.context?.trim() ||
    connection.metAt?.trim() ||
    '';
  if (UNASSIGNED_MEETING_LABELS.has(raw.toLowerCase())) return '';
  return raw;
}

export function connectionMatchesMeetingPointFilter(
  connection: FilterableConnection,
  filter: ConnectionsMeetingPointFilter,
): boolean {
  if (filter === 'all') return true;
  const point = connectionMeetingPointValue(connection);
  if (filter === 'unassigned') return point.length === 0;
  return normalizeMeetingPoint(point) === normalizeMeetingPoint(filter);
}

/** Distinct meeting points for the filter dropdown, sorted A→Z. */
export function uniqueConnectionMeetingPoints(connections: FilterableConnection[]): string[] {
  const seen = new Map<string, string>();
  for (const connection of connections) {
    const raw = connectionMeetingPointValue(connection);
    if (!raw) continue;
    const key = normalizeMeetingPoint(raw);
    if (!seen.has(key)) seen.set(key, raw);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function connectionLocationValue(connection: FilterableConnection): string {
  // Prefer explicit country; authenticated cards map profile.location into `company`.
  return (connection.country ?? connection.company ?? '').trim();
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
    connection.country ?? '',
    connection.meetingPoint ?? '',
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

export function connectionMatchesLocationFilter(
  connection: FilterableConnection,
  filter: ConnectionsLocationFilter,
): boolean {
  if (filter === 'all') return true;
  const location = connectionLocationValue(connection);
  if (filter === 'unknown') return location.length === 0;
  return normalizeConnectionLocation(location) === normalizeConnectionLocation(filter);
}

/** Distinct display locations/countries for the filter dropdown, sorted A→Z. */
export function uniqueConnectionLocations(connections: FilterableConnection[]): string[] {
  const seen = new Map<string, string>();
  for (const connection of connections) {
    const raw = connectionLocationValue(connection);
    if (!raw) continue;
    const key = normalizeConnectionLocation(raw);
    if (!seen.has(key)) seen.set(key, raw);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
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
  locationFilter?: ConnectionsLocationFilter;
  meetingPointFilter?: ConnectionsMeetingPointFilter;
  memberships: Record<string, string[]>;
  sort: ConnectionsSortId;
}): FilterableConnection[] {
  const locationFilter = input.locationFilter ?? 'all';
  const meetingPointFilter = input.meetingPointFilter ?? 'all';
  const filtered = input.connections.filter(
    (c) =>
      connectionMatchesQuery(c, input.query) &&
      connectionMatchesCollectionFilter(c.id, input.collectionFilter, input.memberships) &&
      connectionMatchesLocationFilter(c, locationFilter) &&
      connectionMatchesMeetingPointFilter(c, meetingPointFilter),
  );
  return sortConnections(filtered, input.sort);
}

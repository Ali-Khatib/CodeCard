import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  connectionMatchesCollectionFilter,
  connectionMatchesQuery,
  filterAndSortConnections,
  normalizeConnectionsQuery,
  sortConnections,
} from './connections-filter';

const people = [
  {
    id: 'c1',
    name: 'Bob Smith',
    role: 'Engineer',
    company: 'Berlin',
    metAt: 'Conference',
    date: 'Jul 1',
    source: 'Manual' as const,
    note: 'public preview',
    followUp: 'none' as const,
    tags: [],
    privateNote: 'Follow up on AI paper',
    context: 'DevConf',
    connectedAtIso: '2026-07-10T00:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Ada Lovelace',
    role: 'Researcher',
    company: 'London',
    metAt: 'Connected',
    date: 'Jul 2',
    source: 'Manual' as const,
    note: 'headline',
    followUp: 'none' as const,
    tags: [],
    privateNote: null,
    context: null,
    connectedAtIso: '2026-07-01T00:00:00.000Z',
  },
];

describe('WS15-T007 connections search filter sort', () => {
  it('normalizes whitespace and matches case-insensitively across safe fields', () => {
    expect(normalizeConnectionsQuery('  BoB  ')).toBe('bob');
    expect(connectionMatchesQuery(people[0], ' berlin ')).toBe(true);
    expect(connectionMatchesQuery(people[0], 'ENGINEER')).toBe(true);
    expect(connectionMatchesQuery(people[0], 'AI paper')).toBe(true);
    expect(connectionMatchesQuery(people[0], 'DevConf')).toBe(true);
    expect(connectionMatchesQuery(people[0], "';%_'")).toBe(false);
  });

  it('filters by collection and uncategorized', () => {
    const memberships = { c1: ['col-1'], c2: [] };
    expect(connectionMatchesCollectionFilter('c1', 'all', memberships)).toBe(true);
    expect(connectionMatchesCollectionFilter('c1', 'col-1', memberships)).toBe(true);
    expect(connectionMatchesCollectionFilter('c2', 'col-1', memberships)).toBe(false);
    expect(connectionMatchesCollectionFilter('c2', 'uncategorized', memberships)).toBe(true);
    expect(connectionMatchesCollectionFilter('c1', 'uncategorized', memberships)).toBe(false);
  });

  it('sorts deterministically with id tie-breaker', () => {
    const newest = sortConnections(people, 'newest');
    expect(newest.map((p) => p.id)).toEqual(['c1', 'c2']);
    const oldest = sortConnections(people, 'oldest');
    expect(oldest.map((p) => p.id)).toEqual(['c2', 'c1']);
    const az = sortConnections(people, 'name_asc');
    expect(az.map((p) => p.name)).toEqual(['Ada Lovelace', 'Bob Smith']);
    const za = sortConnections(people, 'name_desc');
    expect(za.map((p) => p.name)).toEqual(['Bob Smith', 'Ada Lovelace']);
  });

  it('combines search, collection filter, and sort', () => {
    const result = filterAndSortConnections({
      connections: people,
      query: 'research',
      collectionFilter: 'uncategorized',
      memberships: { c1: ['col-1'], c2: [] },
      sort: 'name_asc',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });

  it('wires authenticated filter UI and distinct empty states', () => {
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-connections-view.tsx'),
      'utf8',
    );
    expect(view).toContain('filterAndSortConnections');
    expect(view).toContain('Filter by collection');
    expect(view).toContain('Sort Connections');
    expect(view).toContain('No Connections match these filters.');
    expect(view).toContain('Build a network you can actually remember');
    expect(view).toContain('Clear filters');
    expect(view).toContain('uncategorized');
  });
});

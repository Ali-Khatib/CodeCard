import { describe, expect, it } from 'vitest';
import {
  CIRCLE_FEED_FILTERS,
  CIRCLE_FEED_MAX_PAGE_SIZE,
  CIRCLE_FEED_PAGE_SIZE,
  CIRCLE_FORBIDDEN_SOCIAL_CONTROLS,
  encodeCircleFeedCursor,
  eventTypesForFilter,
  normalizeCircleFeedFilter,
  parseCircleFeedCursor,
} from './circle-activity-contract';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WS16-T005 circle pagination and filters', () => {
  it('bounds page size and defines work-type filters without social ranking', () => {
    expect(CIRCLE_FEED_PAGE_SIZE).toBe(20);
    expect(CIRCLE_FEED_MAX_PAGE_SIZE).toBe(20);
    expect(CIRCLE_FEED_FILTERS).toEqual(['all', 'projects', 'research', 'updates']);
    expect(eventTypesForFilter('projects')).toEqual(['project_published', 'project_updated']);
    expect(eventTypesForFilter('research')).toEqual(['research_published', 'research_updated']);
    expect(eventTypesForFilter('updates')).toEqual(['project_updated', 'research_updated']);
    expect(CIRCLE_FORBIDDEN_SOCIAL_CONTROLS).toContain('like');
    expect(CIRCLE_FORBIDDEN_SOCIAL_CONTROLS).toContain('trending');
  });

  it('normalizes unknown filters and validates viewer-safe cursors', () => {
    expect(normalizeCircleFeedFilter('Projects')).toBe('projects');
    expect(normalizeCircleFeedFilter('popular')).toBe('all');
    expect(normalizeCircleFeedFilter(undefined)).toBe('all');

    const cursor = {
      createdAt: '2026-07-17T12:00:00.000Z',
      id: '11111111-1111-4111-8111-111111111111',
      filter: 'projects' as const,
    };
    const encoded = encodeCircleFeedCursor(cursor);
    expect(parseCircleFeedCursor(encoded, 'projects').ok).toBe(true);
    expect(parseCircleFeedCursor(encoded, 'all').ok).toBe(false);
    expect(parseCircleFeedCursor('not-json', 'all').ok).toBe(false);
    expect(
      parseCircleFeedCursor(
        { ...cursor, viewerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
        'projects',
      ).ok,
    ).toBe(false);
    expect(
      parseCircleFeedCursor(
        { createdAt: 'bad', id: cursor.id, filter: 'projects' },
        'projects',
      ).ok,
    ).toBe(false);
  });

  it('wires filter + Load more into feed query and authenticated UI', () => {
    const feed = readFileSync(resolve(process.cwd(), 'src/lib/circle/circle-feed-core.ts'), 'utf8');
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/authenticated-circle-view.tsx'),
      'utf8',
    );
    const action = readFileSync(resolve(process.cwd(), 'src/app/actions/circle.ts'), 'utf8');

    expect(feed).toContain('eventTypesForFilter');
    expect(feed).toContain('parseCircleFeedCursor');
    expect(feed).toContain('owner_user_id');
    expect(feed).toContain('filtered_empty');
    expect(feed).toContain('hasMoreRaw');
    expect(view).toContain('Load more');
    expect(view).toContain('No Circle updates match this filter.');
    expect(view).toContain('View all activity');
    expect(view).toContain('DashFilterBar');
    expect(view).not.toMatch(/\bLike\b|\bReact\b|\bComment\b|\bTrending\b/);
    expect(action).toContain('filter');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CIRCLE_MUTATION_ACTIVITY_CLASSIFICATION,
  buildUpdateDedupeKey,
} from './circle-activity-contract';
import { collapseCircleUpdateGroups } from './circle-group';
import type { CircleFeedItem } from './circle-activity-contract';

function item(
  partial: Partial<CircleFeedItem> & Pick<CircleFeedItem, 'eventId' | 'eventType' | 'createdAt'>,
): CircleFeedItem {
  return {
    activitySentence: 'test',
    actor: {
      profileId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      slug: 'maya',
      displayName: 'Maya',
      headline: null,
      avatarPublicUrl: null,
    },
    target: {
      targetType: partial.eventType.startsWith('research') ? 'research' : 'project',
      targetId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      title: 'Work',
      summary: null,
      publicPathKey: 'work',
      previewImageUrl: null,
    },
    ...partial,
  };
}

describe('WS16-T007 circle activity quality', () => {
  it('classifies mutations and collapses update noise per target', () => {
    expect(CIRCLE_MUTATION_ACTIVITY_CLASSIFICATION.project_reorder).toBe('none');
    expect(CIRCLE_MUTATION_ACTIVITY_CLASSIFICATION.research_figure_reorder).toBe('none');
    expect(CIRCLE_MUTATION_ACTIVITY_CLASSIFICATION.project_publish).toBe('publish');
    expect(CIRCLE_MUTATION_ACTIVITY_CLASSIFICATION.project_noop_update).toBe('none');
    expect(buildUpdateDedupeKey('project', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'a')).toBe(
      'project_updated:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
    expect(buildUpdateDedupeKey('project', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b')).toBe(
      buildUpdateDedupeKey('project', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'a'),
    );

    const grouped = collapseCircleUpdateGroups([
      item({
        eventId: '1',
        eventType: 'project_updated',
        createdAt: '2026-07-17T12:00:00.000Z',
      }),
      item({
        eventId: '2',
        eventType: 'project_updated',
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
      item({
        eventId: '3',
        eventType: 'project_published',
        createdAt: '2026-07-16T12:00:00.000Z',
      }),
    ]);
    expect(grouped.map((g) => g.eventId)).toEqual(['1', '3']);
  });

  it('does not group different targets or actors', () => {
    const a = item({
      eventId: '1',
      eventType: 'project_updated',
      createdAt: '2026-07-17T12:00:00.000Z',
    });
    const b = item({
      eventId: '2',
      eventType: 'project_updated',
      createdAt: '2026-07-17T11:30:00.000Z',
      target: {
        ...a.target,
        targetId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        publicPathKey: 'other',
      },
    });
    expect(collapseCircleUpdateGroups([a, b])).toHaveLength(2);
  });

  it('uses upsert emit for updates and keeps publish idempotent', () => {
    const emit = readFileSync(resolve(process.cwd(), 'src/lib/circle/circle-emit-core.ts'), 'utf8');
    const update = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-update-core.ts'),
      'utf8',
    );
    const order = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-order-core.ts'),
      'utf8',
    );
    expect(emit).toContain('upsert');
    expect(emit).toContain('ignoreDuplicates: isPublish');
    expect(update).toContain('projectHasMeaningfulChange');
    expect(order).not.toContain('emitCircle');
    expect(order).not.toContain('circle_activity');
  });
});

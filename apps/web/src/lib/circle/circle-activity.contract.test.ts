import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CIRCLE_ACTIVITY_EVENT_TYPES,
  CIRCLE_ACTIVITY_INVARIANTS,
  CIRCLE_ACTIVITY_TABLE,
  CIRCLE_ACTIVITY_TARGET_TYPES,
  CIRCLE_FEED_PAGE_SIZE,
  CIRCLE_FORBIDDEN_PAYLOAD_FIELDS,
  PROJECT_MEANINGFUL_UPDATE_FIELDS,
  RESEARCH_MEANINGFUL_UPDATE_FIELDS,
  activitySentenceFor,
  buildPublishDedupeKey,
  buildUpdateDedupeKey,
  isCircleActivityEventType,
  isCircleActivityTargetType,
  targetTypeForEvent,
} from './circle-activity-contract';

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('WS16-T001 circle activity contract', () => {
  it('defines persisted hybrid architecture with allowlisted event and target types', () => {
    expect(CIRCLE_ACTIVITY_TABLE).toBe('circle_activity');
    expect(CIRCLE_ACTIVITY_EVENT_TYPES).toEqual([
      'project_published',
      'project_updated',
      'research_published',
      'research_updated',
    ]);
    expect(CIRCLE_ACTIVITY_TARGET_TYPES).toEqual(['project', 'research']);
    expect(CIRCLE_FEED_PAGE_SIZE).toBeGreaterThan(0);
    expect(CIRCLE_FEED_PAGE_SIZE).toBeLessThanOrEqual(50);
    expect(isCircleActivityEventType('project_published')).toBe(true);
    expect(isCircleActivityEventType('like')).toBe(false);
    expect(isCircleActivityTargetType('project')).toBe(true);
    expect(isCircleActivityTargetType('message')).toBe(false);
  });

  it('documents privacy, Connections-based feed, and demo isolation invariants', () => {
    expect(CIRCLE_ACTIVITY_INVARIANTS).toContain('feed_based_on_owner_connections_only');
    expect(CIRCLE_ACTIVITY_INVARIANTS).toContain('no_client_arbitrary_event_insert');
    expect(CIRCLE_ACTIVITY_INVARIANTS).toContain('private_notes_and_collections_never_in_activity');
    expect(CIRCLE_ACTIVITY_INVARIANTS).toContain('demo_data_isolated_from_authenticated');
    expect(CIRCLE_ACTIVITY_INVARIANTS).toContain('viewer_does_not_see_own_activity');
    expect(CIRCLE_ACTIVITY_INVARIANTS).toContain('remove_connection_hides_actor_from_viewer_feed');
  });

  it('builds idempotent publish and fingerprint-based update dedupe keys', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    expect(buildPublishDedupeKey('project', id)).toBe(`project_published:${id}`);
    expect(buildPublishDedupeKey('research', id)).toBe(`research_published:${id}`);
    expect(buildUpdateDedupeKey('project', id, 'abc')).toBe(`project_updated:${id}:abc`);
    expect(buildUpdateDedupeKey('project', id, 'abc')).toBe(
      buildUpdateDedupeKey('project', id, 'abc'),
    );
    expect(buildUpdateDedupeKey('project', id, 'abc')).not.toBe(
      buildUpdateDedupeKey('project', id, 'def'),
    );
  });

  it('maps event types to target types and human-readable sentences', () => {
    expect(targetTypeForEvent('project_published')).toBe('project');
    expect(targetTypeForEvent('research_updated')).toBe('research');
    expect(activitySentenceFor('project_published', 'Maya')).toBe('Maya published a new project');
    expect(activitySentenceFor('research_updated', 'Omar')).toBe(
      'Omar updated a research paper',
    );
    expect(activitySentenceFor('project_published', 'Maya')).not.toMatch(/posted/i);
  });

  it('defines meaningful update fields and forbids private payload fields', () => {
    expect(PROJECT_MEANINGFUL_UPDATE_FIELDS).toContain('title');
    expect(PROJECT_MEANINGFUL_UPDATE_FIELDS).toContain('description');
    expect(PROJECT_MEANINGFUL_UPDATE_FIELDS).not.toContain('sort_order');
    expect(RESEARCH_MEANINGFUL_UPDATE_FIELDS).toContain('abstract');
    expect(RESEARCH_MEANINGFUL_UPDATE_FIELDS).not.toContain('sort_order');
    for (const field of CIRCLE_FORBIDDEN_PAYLOAD_FIELDS) {
      expect(field.length).toBeGreaterThan(0);
    }
  });

  it('documents the contract and keeps demo Circle separate from auth foundation', () => {
    const docsPath = resolve(process.cwd(), '../../docs/CIRCLE.md');
    expect(existsSync(docsPath)).toBe(true);
    const doc = readRepo('docs/CIRCLE.md');
    expect(doc).toContain('private feed projection');
    expect(doc).toContain('circle_activity');
    expect(doc).toContain('DEMO_CIRCLE_FEED');
    expect(doc).toContain('manual deploy');
    expect(doc).not.toMatch(/service_role|sk_live|eyJhbGci/i);

    const demo = readFileSync(resolve(process.cwd(), 'src/lib/dashboard/circle-demo.ts'), 'utf8');
    expect(demo).toContain('DEMO_CIRCLE_FEED');
    expect(demo).not.toContain('circle_activity');

    const authPage = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/circle/page.tsx'),
      'utf8',
    );
    // T004 replaces DEMO import on the authenticated Circle route.
    expect(authPage).not.toContain('DEMO_CIRCLE_FEED');
    expect(authPage).toContain('listCircleFeed');
  });

  it('relies on real Connections and published content foundations from WS15/WS05', () => {
    const connections = readFileSync(
      resolve(process.cwd(), 'src/lib/connections/connections-contract.ts'),
      'utf8',
    );
    expect(connections).toContain('saved_connections');
    expect(connections).toContain('directed_not_mutual');

    const inventory = readRepo('docs/account-data-inventory.md');
    expect(inventory).toContain('saved_connections');
  });
});

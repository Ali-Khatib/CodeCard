import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CIRCLE_READ_STATE_INVARIANTS,
  CIRCLE_VIEWER_STATE_TABLE,
  formatCircleUnreadBadge,
} from './circle-read-state-contract';
import { isActivityNewSince } from './circle-read-state-core';

describe('WS16-T006 circle read state', () => {
  it('defines private viewer state with no actor-facing receipts', () => {
    expect(CIRCLE_VIEWER_STATE_TABLE).toBe('circle_viewer_state');
    expect(CIRCLE_READ_STATE_INVARIANTS).toContain('viewer_owned_only');
    expect(CIRCLE_READ_STATE_INVARIANTS).toContain('actor_cannot_see_viewer_reads');
    expect(CIRCLE_READ_STATE_INVARIANTS).toContain('no_creator_facing_read_receipts');
    expect(formatCircleUnreadBadge(0)).toBe('');
    expect(formatCircleUnreadBadge(3)).toBe('3');
    expect(formatCircleUnreadBadge(12)).toBe('9+');
    expect(isActivityNewSince('2026-07-17T12:00:00.000Z', null)).toBe(true);
    expect(isActivityNewSince('2026-07-17T12:00:00.000Z', '2026-07-17T13:00:00.000Z')).toBe(false);
    expect(isActivityNewSince('2026-07-17T14:00:00.000Z', '2026-07-17T13:00:00.000Z')).toBe(true);
  });

  it('adds viewer-state migration with owner-only RLS', () => {
    const path = resolve(
      process.cwd(),
      '../../supabase/migrations/20260717080001_circle_viewer_state.sql',
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, 'utf8');
    expect(sql).toContain('circle_viewer_state');
    expect(sql).toContain('viewer_user_id = auth.uid()');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON public.circle_viewer_state FROM anon');
    expect(sql).toContain('Manual deploy only');
  });

  it('wires deliberate mark-seen, nav badge, export and deletion', () => {
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/authenticated-circle-view.tsx'),
      'utf8',
    );
    const shell = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'),
      'utf8',
    );
    const layout = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/layout.tsx'),
      'utf8',
    );
    const deletion = readFileSync(
      resolve(process.cwd(), 'src/lib/account/delete-local-content.ts'),
      'utf8',
    );
    const exportBuild = readFileSync(
      resolve(process.cwd(), 'src/lib/account/export-build.ts'),
      'utf8',
    );
    const inventory = readFileSync(resolve(process.cwd(), '../../docs/account-data-inventory.md'), 'utf8');

    expect(view).toContain('markCircleSeenAction');
    expect(view).toContain('visibilityState');
    expect(view).toContain('New since your last visit');
    expect(shell).toContain('circleUnreadBadge');
    expect(layout).toContain('getCircleUnreadSummary');
    expect(layout).not.toContain('DEMO_');
    expect(deletion).toContain('circle_viewer_state');
    expect(exportBuild).toContain('circle_viewer_state');
    expect(inventory).toContain('circle_viewer_state');
  });
});

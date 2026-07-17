import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CIRCLE_FORBIDDEN_SOCIAL_CONTROLS,
  encodeCircleFeedCursor,
  parseCircleFeedCursor,
} from './circle-activity-contract';

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

function readRoot(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('WS16-T008 circle quality completion', () => {
  it('documents Circle as a private latest-work feed (not social)', () => {
    const doc = readRoot('docs/CIRCLE.md');
    expect(doc).toContain(
      'Circle is a private latest-work feed, not a social engagement platform.',
    );
    expect(doc).toContain('likes');
    expect(doc).toContain('Pagination');
    expect(doc).toContain('circle_viewer_state');
    expect(doc).toContain('grouping');
    expect(doc).toMatch(/Manual deploy|manual deploy/i);
    for (const control of ['like', 'comment', 'trending', 'follower'] as const) {
      expect(CIRCLE_FORBIDDEN_SOCIAL_CONTROLS).toContain(control);
    }
  });

  it('enforces security matrix: anon denied, viewer-bound cursors, owner-only read state', () => {
    const feed = readWeb('src/lib/circle/circle-feed-core.ts');
    const readCore = readWeb('src/lib/circle/circle-read-state-core.ts');
    const activitySql = readRoot('supabase/migrations/20260717034827_circle_activity.sql');
    const viewerSql = readRoot('supabase/migrations/20260717080001_circle_viewer_state.sql');

    expect(feed).toContain("status: 'unauthenticated'");
    expect(feed).toContain('owner_user_id === user.id');
    expect(feed).toContain('saved_connections');
    expect(feed).not.toContain('DEMO_CIRCLE_FEED');
    expect(readCore).toContain('viewer_user_id');
    expect(readCore).toContain('auth.getUser');
    expect(activitySql).toContain('FORCE ROW LEVEL SECURITY');
    expect(viewerSql).toContain('viewer_user_id = auth.uid()');
    expect(viewerSql).toContain('REVOKE ALL ON public.circle_viewer_state FROM anon');

    const poisoned = encodeCircleFeedCursor({
      createdAt: '2026-07-17T12:00:00.000Z',
      id: '11111111-1111-4111-8111-111111111111',
      filter: 'all',
    });
    expect(parseCircleFeedCursor(poisoned, 'all').ok).toBe(true);
    expect(
      parseCircleFeedCursor(
        {
          createdAt: '2026-07-17T12:00:00.000Z',
          id: '11111111-1111-4111-8111-111111111111',
          filter: 'all',
          viewerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
        'all',
      ).ok,
    ).toBe(false);
  });

  it('keeps a11y structure: heading, list, labeled filters, time, load more, new not color-only', () => {
    const view = readWeb('src/components/dashboard/authenticated-circle-view.tsx');
    expect(view).toContain('title="Circle"');
    expect(view).toContain('aria-label="Circle activity"');
    expect(view).toContain('Filter:');
    expect(view).toContain('aria-live="polite"');
    expect(view).toContain('dateTime={item.createdAt}');
    expect(view).toContain('Load more Circle activity');
    expect(view).toContain('New since your last visit');
    expect(view).toContain('role="alert"');
    expect(view).not.toMatch(/\bLike\b|\bComment\b|\bMessage\b|\bFollow\b/);
  });

  it('covers export/deletion and demo isolation boundary', () => {
    const exportBuild = readWeb('src/lib/account/export-build.ts');
    const deletion = readWeb('src/lib/account/delete-local-content.ts');
    const authPage = readWeb('src/app/dashboard/(authenticated)/circle/page.tsx');
    const preview = readWeb('src/app/dashboard/preview/circle/page.tsx');
    const demo = readWeb('src/lib/dashboard/circle-demo.ts');
    const layout = readWeb('src/app/dashboard/(authenticated)/layout.tsx');

    expect(exportBuild).toContain('circle_activity');
    expect(exportBuild).toContain('circle_viewer_state');
    expect(deletion).toContain('circle_viewer_state');
    expect(authPage).toContain('listCircleFeed');
    expect(authPage).not.toContain('DEMO_CIRCLE_FEED');
    expect(preview).toContain('DEMO_CIRCLE_FEED');
    expect(demo).toContain('DEMO_CIRCLE_FEED');
    expect(layout).not.toContain('DEMO_CIRCLE_FEED');
    expect(layout).toContain('getCircleUnreadSummary');
  });

  it('ships mocked Playwright coverage for journey, filters, pagination, mobile', () => {
    expect(existsSync(resolve(process.cwd(), 'e2e/circle.spec.ts'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'src/components/e2e/circle-harness.tsx'))).toBe(true);
    const spec = readWeb('e2e/circle.spec.ts');
    const harness = readWeb('src/components/e2e/circle-harness.tsx');
    expect(spec).toContain('filters and pagination');
    expect(spec).toContain('filtered empty');
    expect(spec).toContain('390');
    expect(spec).toContain('Alex Chen');
    expect(harness).toContain('feedLoader');
    expect(harness).toContain('Paginated feed');
    expect(harness).not.toContain('SERVICE_ROLE');
  });
});

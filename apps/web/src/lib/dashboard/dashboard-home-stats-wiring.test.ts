import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS08-T008 authenticated dashboard home stats', () => {
  it('uses owner analytics and never falls back to demo numbers', () => {
    const page = read('src/app/dashboard/(authenticated)/page.tsx');
    const view = read('src/components/dashboard/dashboard-overview-view.tsx');
    const preview = read('src/app/dashboard/preview/page.tsx');

    expect(page).toContain('loadOwnerAnalytics');
    expect(page).not.toContain('DEMO_OVERVIEW_ACTIVITY');
    expect(page).not.toContain('1284');
    expect(page).not.toContain('128');
    expect(page).not.toContain('47');
    expect(page).not.toContain('342');
    expect(page).toContain('activity={[]}');
    expect(page).toContain('statsError');

    expect(view).not.toContain('saves');
    expect(view).not.toContain('qrScans');
    expect(view).toContain('linkClicks');
    expect(view).toContain('qrDownloads');
    expect(view).toContain('statsError');
    expect(view).toContain('Activity will appear here');

    // Preview keeps deterministic sample stats only on the preview route.
    expect(preview).toContain('DEMO_OVERVIEW_ACTIVITY');
    expect(preview).toContain('1284');
    expect(preview).toContain('preview');
  });
});

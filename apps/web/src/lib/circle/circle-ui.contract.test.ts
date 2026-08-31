import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS16-T004 real circle feed experience', () => {
  it('restores Circle in authenticated navigation without Coming soon', () => {
    const shell = readWeb('src/components/dashboard/dashboard-shell.tsx');
    const nav = shell.slice(
      shell.indexOf('const NAV_ITEMS'),
      shell.indexOf('] as const;') + '] as const;'.length,
    );
    expect(nav).toContain("label: 'Circle'");
    expect(nav).toContain("segment: 'circle'");
    expect(nav).toContain("label: 'Connections'");
    expect(shell).not.toMatch(/Coming soon/i);
  });

  it('wires authenticated Circle page to listCircleFeed without demo data', () => {
    const page = readWeb('src/app/dashboard/(authenticated)/circle/page.tsx');
    const preview = readWeb('src/app/demo/(workspace)/circle/page.tsx');
    expect(page).toContain('listCircleFeed');
    expect(page).toContain('AuthenticatedCircleView');
    expect(page).not.toContain('DEMO_CIRCLE_FEED');
    expect(preview).toContain('DEMO_CIRCLE_FEED');
  });

  it('renders truthful empty states and real activity cards without social controls', () => {
    const view = readWeb('src/components/dashboard/authenticated-circle-view.tsx');
    const empty = readWeb('src/lib/dashboard/empty-state-copy.ts');
    expect(view).toContain('EMPTY_STATE_COPY.circle.noConnectionsTitle');
    expect(view).toContain('Share your CodeCard');
    expect(view).toContain('Open Connections');
    expect(view).not.toContain('Find people to add');
    expect(view).not.toContain('href="/profiles"');
    expect(view).toContain('EMPTY_STATE_COPY.circle.noActivityTitle');
    expect(empty).toContain('noConnectionsTitle');
    expect(empty).toContain('noActivityTitle');
    expect(empty).toContain('scans your CodeCard QR');
    expect(view).toContain('activitySentence');
    expect(view).toContain('dateTime={item.createdAt}');
    expect(view).toContain('Read paper');
    expect(view).toContain('View project');
    expect(view).toContain('Load more');
    expect(view).not.toMatch(/\bLike\b|\bReact\b|\bComment\b|\bReply\b/);
    expect(view).not.toContain('DEMO_CIRCLE_FEED');
  });

  it('includes mocked Playwright fixture for Circle states', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/e2e-fixtures/circle/page.tsx'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'e2e/circle.spec.ts'))).toBe(true);
    const harness = readWeb('src/components/e2e/circle-harness.tsx');
    const spec = readWeb('e2e/circle.spec.ts');
    expect(harness).toContain('Circle feed fixture');
    expect(spec).toContain('WS16 Circle feed');
    expect(spec).toContain('Alex Chen');
    expect(spec).toContain('Nothing new yet');
  });
});

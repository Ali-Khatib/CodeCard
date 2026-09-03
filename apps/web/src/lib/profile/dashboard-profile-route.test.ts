import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('canonical dashboard profile route', () => {
  it('folds the old profile destination into Home while preserving hash', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/page.tsx'),
      'utf8',
    );

    expect(src).toContain('WorkspaceHashRedirect');
    expect(src).toContain('to="/dashboard"');
    expect(src).not.toContain('DashboardProfileView');
    expect(src).not.toContain('notFound()');
  });

  it('keeps profile editing on Home instead of a Profile nav item', () => {
    const shell = readFileSync(resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'), 'utf8');
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );

    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    const navBlock = navMatch![1];
    expect(navBlock).not.toContain("segment: 'profile'");
    expect(navBlock).not.toContain("label: 'Profile'");
    expect(navBlock).toContain("segment: 'work'");
    expect(shell).toContain('cc-app-user-card--link');
    expect(shell).toContain('Edit photo, bio, links');
    expect(overview).toContain('HomeIdentitySection');
    expect(overview).toContain('How people see you');
  });

  it('hosts the full profile editor on the dashboard overview', () => {
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );
    const identity = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/home-identity-section.tsx'),
      'utf8',
    );

    expect(overview).toContain('HomeIdentitySection');
    expect(identity).toContain('ProfileEditor');
    expect(identity).toContain('HomeCodeCardPreview');
  });

  it('redirects /demo/profile into the demo Home identity section', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/demo/(workspace)/profile/page.tsx'),
      'utf8',
    );

    expect(src).toContain('WorkspaceHashRedirect');
    expect(src).toContain('LIVE_DEMO_WORKSPACE_HREF');
    expect(src).not.toContain('DashboardProfileView');
  });
});

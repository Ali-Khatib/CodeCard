import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 1 web app IA freeze', () => {
  it('keeps the authenticated app on /dashboard with the existing six nav items', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    const navBlock = navMatch![1];

    expect(navBlock).toContain("label: 'Home'");
    expect(navBlock).toContain("label: 'Your Work'");
    expect(navBlock).toContain("segment: 'work'");
    expect(navBlock).toContain("label: 'Connections'");
    expect(navBlock).toContain("label: 'Circle'");
    expect(navBlock).toContain("label: 'Analytics'");
    expect(navBlock).toContain("label: 'Settings'");

    expect(navBlock).not.toContain("label: 'My CodeCard'");
    expect(navBlock).not.toContain("label: 'Sharing'");
    expect(navBlock).not.toContain("label: 'Billing'");
    expect(navBlock).not.toContain("label: 'AI'");
    expect(navBlock).not.toContain("label: 'Presentations'");
    expect(navBlock).not.toContain("label: 'Projects'");
    expect(navBlock).not.toContain("label: 'Research'");
  });

  it('does not add a second app shell or /app product route', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    expect(shell).toContain('export function DashboardShell');
    expect(shell).not.toContain('href="/app"');
    expect(shell).not.toContain("href: '/app'");
  });

  it('surfaces CodeCard state and next action on Home without new backends', () => {
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');
    const page = read('src/app/dashboard/(authenticated)/page.tsx');
    expect(overview).toContain('Your CodeCard');
    expect(overview).toContain('isProfilePublic ? \'Public\' : \'Private\'');
    expect(overview).toContain('ProfileShareHero');
    expect(overview).toContain('HomeIdentitySection');
    expect(page).toContain('getHomeWorkspaceNextStep');
  });

  it('does not present unimplemented Pro features as shipped in the authenticated app', () => {
    const settings = read('src/components/dashboard/dashboard-settings-view.tsx');
    const billing = read('src/app/dashboard/(authenticated)/billing/page.tsx');

    expect(settings).toContain("label: 'Custom domain'");
    expect(settings).toContain('Coming later');
    expect(settings).toContain('not available yet');
    expect(settings).not.toContain('Available on Pro');
    expect(settings).not.toContain('Not configured');
    expect(settings).not.toContain('claim a custom domain');

    expect(billing).toContain('unlimited projects');
    expect(billing).toContain('are not included yet');
    expect(billing).toContain('are still planned');
    expect(billing).not.toContain('peer analysis');
  });

  it('keeps marketing Back to landing off the live app sidebar', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const foot = shell.slice(
      shell.indexOf('cc-app-sidebar__foot'),
      shell.indexOf('cc-app-main'),
    );
    expect(foot).toContain('{preview ? (');
    expect(foot).toContain('Back to landing');
    expect(foot).toContain(') : null}');
  });
});

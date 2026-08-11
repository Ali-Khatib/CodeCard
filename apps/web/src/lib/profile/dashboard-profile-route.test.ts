import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('canonical dashboard profile route', () => {
  it('loads the owner profile at /dashboard/profile instead of redirecting away', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/page.tsx'),
      'utf8',
    );

    expect(src).not.toContain("redirect('/dashboard')");
    expect(src).toContain("eq('owner_user_id', user!.id)");
    expect(src).toContain('DashboardProfileView');
    expect(src).toContain("select('id, type, label, url, sort_order')");
    expect(src).not.toContain('notFound()');
  });

  it('exposes Profile in primary nav and Home edit CTAs', () => {
    const shell = readFileSync(resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'), 'utf8');
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );

    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    const navBlock = navMatch![1];
    expect(navBlock).toContain("segment: 'profile'");
    expect(navBlock).toContain("label: 'Profile'");
    expect(shell).toContain('cc-app-user-card--link');
    expect(shell).toContain('Edit photo, bio, links');
    expect(overview).toContain('workspaceProfileHref(basePath)');
    expect(overview).toContain('Edit profile');
    expect(overview).toContain("workspaceProfileHref(basePath, 'photo')");
    expect(overview).toContain('How people see you');
  });

  it('does not keep a second full profile editor on the dashboard overview', () => {
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );

    expect(overview).not.toContain('ProfileEditor');
    expect(overview).not.toContain('profile-edit');
  });

  it('renders a working Alex Chen profile section on /demo/profile', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/demo/(workspace)/profile/page.tsx'),
      'utf8',
    );

    expect(src).toContain('DashboardProfileView');
    expect(src).toContain('preview');
    expect(src).toContain('DEMO_PROFILE');
    expect(src).not.toContain('redirect(');
  });
});

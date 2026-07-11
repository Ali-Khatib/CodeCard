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
  });

  it('points dashboard navigation to the canonical profile editor', () => {
    const shell = readFileSync(resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'), 'utf8');
    const nav = readFileSync(resolve(process.cwd(), 'src/components/dashboard/dashboard-nav.tsx'), 'utf8');
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );

    expect(shell).toContain("segment: 'profile'");
    expect(nav).toContain("href: '/dashboard/profile'");
    expect(overview).toContain('href="/dashboard/profile"');
  });

  it('does not keep a second full profile editor on the dashboard overview', () => {
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );

    expect(overview).not.toContain('ProfileEditor');
    expect(overview).not.toContain('profile-edit');
  });
});

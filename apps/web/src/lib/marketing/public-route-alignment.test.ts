import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LIVE_DEMO_HREF,
  LIVE_DEMO_PROFILE_HREF,
  LIVE_DEMO_PROFILE_LEGACY_HREF,
  LIVE_DEMO_WORKSPACE_HREF,
} from '@/lib/marketing/demo-url';
import {
  LIVE_DEMO_ENTRY_HREF,
  MARKETING_HOME_HREF,
} from '@/lib/marketing/site-routes';
import { resolveVisitorConversionRoute } from '@/lib/visitor-conversion/visitor-conversion';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 0A public route alignment', () => {
  it('exports Option B public route constants', () => {
    expect(MARKETING_HOME_HREF).toBe('/');
    expect(LIVE_DEMO_ENTRY_HREF).toBe('/demo');
    expect(LIVE_DEMO_HREF).toBe('/demo');
    expect(LIVE_DEMO_PROFILE_HREF).toBe('/demo');
    expect(LIVE_DEMO_WORKSPACE_HREF).toBe('/dashboard/preview');
    expect(LIVE_DEMO_PROFILE_LEGACY_HREF).toBe('/demo/card');
  });

  it('serves marketing ProductPage at / via the marketing route group', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/page.tsx'))).toBe(false);
    const home = read('src/app/(marketing)/page.tsx');
    expect(home).toContain('ProductPage');
    expect(home).not.toContain('redirect(');
    expect(home).not.toContain('permanentRedirect');
  });

  it('serves the public-profile demo at /demo', () => {
    const demo = read('src/app/demo/page.tsx');
    expect(demo).toContain('PublicProfileExperience');
    expect(demo).toContain('DEMO_PROFILE');
    expect(demo).toContain('profileSlug="demo"');
    expect(demo).not.toContain("redirect(LIVE_DEMO_HREF)");
  });

  it('keeps workspace preview at /dashboard/preview', () => {
    const preview = read('src/app/dashboard/preview/page.tsx');
    expect(preview).toContain('DEMO_PROFILE');
    expect(preview).toContain('basePath="/dashboard/preview"');
    expect(existsSync(resolve(process.cwd(), 'src/app/dashboard/preview/page.tsx'))).toBe(
      true,
    );
  });

  it('redirects legacy /landing and /demo/card aliases without loops', () => {
    const landing = read('src/app/(marketing)/landing/page.tsx');
    expect(landing).toContain('permanentRedirect');
    expect(landing).toContain('MARKETING_HOME_HREF');
    expect(landing).not.toContain('ProductPage');

    const card = read('src/app/demo/card/page.tsx');
    expect(card).toContain('permanentRedirect');
    expect(card).toContain('LIVE_DEMO_PROFILE_HREF');
    expect(card).not.toContain('PublicProfileExperience');
  });

  it('keeps authenticated dashboard routes on owner data, not Alex Chen demo imports', () => {
    const authHome = read('src/app/dashboard/(authenticated)/page.tsx');
    expect(authHome).toContain('loadOwnerOverviewContent');
    expect(authHome).toContain("eq('owner_user_id', user!.id)");
    expect(authHome).not.toContain('DEMO_PROFILE');
    expect(authHome).not.toContain('Alex Chen');
    expect(authHome).not.toContain('workspace-demo');
  });

  it('keeps visitor-conversion eligibility on / and /demo only', () => {
    expect(resolveVisitorConversionRoute({ pathname: '/' })?.context).toBe('landing');
    expect(resolveVisitorConversionRoute({ pathname: '/demo' })?.context).toBe(
      'live_demo',
    );
    expect(resolveVisitorConversionRoute({ pathname: '/landing' })).toBeNull();
    expect(resolveVisitorConversionRoute({ pathname: '/demo/card' })).toBeNull();
    expect(resolveVisitorConversionRoute({ pathname: '/dashboard/preview' })).toBeNull();
  });

  it('does not force authenticated users away from marketing via middleware matcher', () => {
    const middleware = read('src/middleware.ts');
    expect(middleware).toContain("'/dashboard/:path*'");
    expect(middleware).not.toMatch(/matcher:[\s\S]*'\/'/);
    expect(middleware).not.toMatch(/pathname === '\/'/);
  });
});

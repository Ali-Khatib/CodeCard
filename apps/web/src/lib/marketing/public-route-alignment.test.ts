import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LIVE_DEMO_HREF,
  LIVE_DEMO_PREVIEW_ALIAS_HREF,
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

describe('workspace-first public route alignment', () => {
  it('exports workspace-first live demo constants', () => {
    expect(MARKETING_HOME_HREF).toBe('/');
    expect(LIVE_DEMO_ENTRY_HREF).toBe('/demo');
    expect(LIVE_DEMO_HREF).toBe('/demo');
    expect(LIVE_DEMO_WORKSPACE_HREF).toBe('/demo');
    expect(LIVE_DEMO_PROFILE_HREF).toBe('/demo/card');
    expect(LIVE_DEMO_PROFILE_LEGACY_HREF).toBe('/demo/card');
    expect(LIVE_DEMO_PREVIEW_ALIAS_HREF).toBe('/dashboard/preview');
  });

  it('serves marketing ProductPage at / via the marketing route group', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/page.tsx'))).toBe(false);
    const home = read('src/app/(marketing)/page.tsx');
    expect(home).toContain('ProductPage');
    expect(home).not.toContain('redirect(');
    expect(home).not.toContain('permanentRedirect');
  });

  it('serves the workspace demo at /demo', () => {
    const demo = read('src/app/demo/(workspace)/page.tsx');
    const layout = read('src/app/demo/(workspace)/layout.tsx');
    expect(demo).toContain('DashboardOverviewView');
    expect(demo).toContain('DEMO_PROFILE');
    expect(demo).toContain('LIVE_DEMO_WORKSPACE_HREF');
    expect(layout).toContain('DashboardShell');
    expect(layout).toContain('basePath={LIVE_DEMO_WORKSPACE_HREF}');
    expect(demo).not.toContain('PublicProfileExperience');
  });

  it('serves the public-profile demo at /demo/card', () => {
    const card = read('src/app/demo/card/page.tsx');
    expect(card).toContain('PublicProfileExperience');
    expect(card).toContain('DEMO_PROFILE');
    expect(card).toContain('profileSlug="demo"');
    expect(card).not.toContain('permanentRedirect');
  });

  it('aliases /dashboard/preview to the workspace without loops', () => {
    const preview = read('src/app/dashboard/preview/page.tsx');
    expect(preview).toContain('permanentRedirect');
    expect(preview).toContain('LIVE_DEMO_WORKSPACE_HREF');
    expect(preview).not.toContain('DashboardOverviewView');
    expect(preview).not.toContain('PublicProfileExperience');
  });

  it('redirects legacy /landing without loops', () => {
    const landing = read('src/app/(marketing)/landing/page.tsx');
    expect(landing).toContain('permanentRedirect');
    expect(landing).toContain('MARKETING_HOME_HREF');
    expect(landing).not.toContain('ProductPage');
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

  it('allows Site URL auth-code forwarding on / without forcing marketers off the landing', () => {
    const middleware = read('src/middleware.ts');
    expect(middleware).toContain("'/dashboard/:path*'");
    expect(middleware).toContain("'/'");
    expect(middleware).toContain('shouldForwardAuthExchangeToCallback');
    // Signed-in users are only bounced from auth forms, not from marketing `/`.
    expect(middleware).toContain('isAuthRoute && user');
    expect(middleware).not.toMatch(/if\s*\(\s*pathname\s*===\s*'\/'\s*&&\s*user/);
  });
});

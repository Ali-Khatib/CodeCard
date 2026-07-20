import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('site-wide visitor conversion prompt contract', () => {
  it('uses shared marketing/dashboard integration and the shared eight-second constant', () => {
    const marketing = read('src/app/(marketing)/layout.tsx');
    const dashboard = read('src/app/dashboard/layout.tsx');
    const root = read('src/app/layout.tsx');
    const component = read(
      'src/components/visitor-conversion/sitewide-visitor-conversion-prompt.tsx',
    );
    const core = read('src/lib/visitor-conversion/visitor-conversion.ts');

    // Public `/[slug]` must not inherit this client island (WS14-T019).
    expect(root).not.toContain('SitewideVisitorConversionPrompt');
    expect(marketing).toContain('SitewideVisitorConversionPrompt');
    expect(dashboard).toContain('SitewideVisitorConversionPrompt');
    expect(component).toContain('startVisibleDelay');
    expect(component).not.toContain('8000');
    expect(core).toContain('VISITOR_CONVERSION_DELAY_MS = 8_000');
    expect(core).toContain("codecard:visitor-conversion:shown");
    expect(core).toContain("codecard:visitor-conversion:dismissed-at");
  });

  it('resolves auth before scheduling and fails closed', () => {
    const component = read(
      'src/components/visitor-conversion/sitewide-visitor-conversion-prompt.tsx',
    );
    expect(component).toContain('supabase.auth.getSession()');
    expect(component).toContain('supabase.auth.getUser()');
    expect(component).toContain('onAuthStateChange');
    expect(component).toContain('Fail closed');
  });

  it('renders non-modal accessible semantics without focus management', () => {
    const component = read(
      'src/components/visitor-conversion/sitewide-visitor-conversion-prompt.tsx',
    );
    expect(component).toContain('role="region"');
    expect(component).toContain('aria-labelledby={headingId}');
    expect(component).toContain('aria-describedby={descriptionId}');
    expect(component).toContain('Dismiss CodeCard account prompt');
    expect(component).not.toContain('aria-modal');
    expect(component).not.toContain('.focus()');
    expect(component).not.toContain('inert');
  });

  it('keeps demo copy and real auth destinations in the same component', () => {
    const component = read(
      'src/components/visitor-conversion/sitewide-visitor-conversion-prompt.tsx',
    );
    expect(component).toContain('CodeCard Demo');
    expect(component).toContain('Like what you’re exploring?');
    expect(component).toContain('Build your own CodeCard');
    expect(component).toContain('Create your CodeCard');
    expect(component).toContain('signupHref');
    expect(component).toContain('signinHref');
  });

  it('routes sign-in next through the existing internal redirect sanitizer', () => {
    const signIn = read('src/app/sign-in/page.tsx');
    expect(signIn).toContain("searchParams.get('next') ?? searchParams.get('redirect')");
    expect(signIn).toContain('sanitizeInternalRedirect');
  });

  it('uses successful-content markers on real and demo detail routes', () => {
    for (const path of [
      'src/app/[slug]/page.tsx',
      'src/app/[slug]/projects/[id]/page.tsx',
      'src/app/[slug]/research/[paperSlug]/page.tsx',
      'src/app/demo/card/page.tsx',
      'src/app/demo/projects/[id]/page.tsx',
      'src/app/demo/research/[paperSlug]/page.tsx',
      'src/app/dashboard/preview/layout.tsx',
    ]) {
      expect(read(path), path).toContain('VisitorConversionMarker');
    }
  });

  it('uses safe optional app environment variables and no placeholder links', () => {
    const marketing = read('src/app/(marketing)/layout.tsx');
    const dashboard = read('src/app/dashboard/layout.tsx');
    const env = read('src/lib/security/env.ts');
    expect(marketing).toContain('NEXT_PUBLIC_CODECARD_IOS_APP_URL');
    expect(marketing).toContain('NEXT_PUBLIC_CODECARD_ANDROID_APP_URL');
    expect(dashboard).toContain('NEXT_PUBLIC_CODECARD_IOS_APP_URL');
    expect(dashboard).toContain('NEXT_PUBLIC_CODECARD_ANDROID_APP_URL');
    expect(env).toContain('NEXT_PUBLIC_CODECARD_IOS_APP_URL');
    expect(env).toContain('NEXT_PUBLIC_CODECARD_ANDROID_APP_URL');
  });

  it('tracks allowlisted prompt events without profile analytics in demo context', () => {
    const analytics = read('src/lib/analytics/visitor-conversion.ts');
    for (const event of [
      'visitor_prompt_viewed',
      'visitor_prompt_dismissed',
      'visitor_prompt_signup_clicked',
      'visitor_prompt_signin_clicked',
      'visitor_prompt_ios_app_clicked',
      'visitor_prompt_android_app_clicked',
    ]) {
      expect(analytics).toContain(event);
    }
    expect(analytics).toContain("input.context === 'live_demo'");
    expect(analytics).toContain("profile_id: input.profileId");
  });

  it('provides reduced-motion CSS with no translation', () => {
    const css = read('src/app/globals.css');
    const reducedBlock = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reducedBlock).toContain('.cc-visitor-prompt');
    expect(reducedBlock).toContain('cc-visitor-prompt-fade');
    expect(reducedBlock).not.toContain('translate');
  });
});

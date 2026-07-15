import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Auth experience polish contracts', () => {
  it('keeps routes, removes Google, and preserves demo separation on sign-in', () => {
    const signIn = read('src/app/sign-in/page.tsx');
    expect(signIn).toContain('href="/sign-up"');
    expect(signIn).toContain('AuthGithubButton');
    expect(signIn).toContain('Signing in…');
    expect(signIn).toContain('Welcome back');
    expect(signIn).toContain('Explore demo workspace');
    expect(signIn).toContain('sample data');
    expect(signIn).toContain('AuthPasswordField');
    expect(signIn).not.toMatch(/Continue with Google|oauth\('google'\)|provider:\s*'google'/);
    expect(signIn).toContain('signInWithPassword');
    expect(signIn).toContain('createClient');
  });

  it('keeps sign-up validation and password guidance without leaking passwords across modes', () => {
    const signUp = read('src/app/sign-up/page.tsx');
    expect(signUp).toContain('href="/sign-in"');
    expect(signUp).toContain('Creating account…');
    expect(signUp).toContain('Create your account');
    expect(signUp).toContain('showGuidance');
    expect(signUp).toContain('signUpSchema');
    expect(signUp).toContain('autoComplete="new-password"');
    expect(signUp).not.toContain('Continue with Google');
    expect(signUp).not.toMatch(/password\s*=\s*searchParams|searchParams\.get\(['"]password/);
  });

  it('uses landing-style centered copy with floating tech icons', () => {
    const shell = read('src/components/auth/auth-shell.tsx');
    const collage = read('src/components/auth/auth-collage.tsx');

    expect(shell).toContain('AuthShowcaseStage');
    expect(shell).toContain('auth-side-panel');
    expect(shell).toContain('lg:w-[40%]');
    expect(shell).toContain('lg:rounded-l-[28px]');
    expect(shell).not.toContain('slideIndex');
    expect(collage).toContain('AuthShowcaseStage');
    expect(collage).toContain('cc-hume-hero__float-icon');
    expect(collage).toContain('cc-hume-gradient-text');
    expect(collage).toContain('share in seconds');
    expect(collage).toContain('CODECARD_TAGLINE');
    expect(collage).toContain('Code2');
    expect(collage).toContain('GitBranch');
    expect(collage).not.toContain('Inside the live demo');
    expect(collage).not.toContain('setInterval');
    expect(collage).not.toContain('images.unsplash.com');
    expect(collage).not.toContain('auth-collage/team.jpg');
    expect(collage).not.toContain('Alex Chen');
  });

  it('uses accessible password toggle and reserved error space', () => {
    const password = read('src/components/auth/auth-password-field.tsx');
    const field = read('src/components/auth/auth-field.tsx');
    expect(password).toContain('aria-pressed');
    expect(password).toContain('Hide characters');
    expect(password).toContain('Show characters');
    expect(field).toContain('min-h-[18px]');
    expect(field).toContain('aria-invalid');
  });

  it('does not rewrite authentication security boundaries', () => {
    const signIn = read('src/app/sign-in/page.tsx');
    const signUp = read('src/app/sign-up/page.tsx');
    expect(signIn).toContain('sanitizeInternalRedirect');
    expect(signIn).toContain('authCallbackRedirectUrl');
    expect(signIn).toContain('isAuthSubmissionBlocked');
    expect(signUp).toContain('authCallbackRedirectUrl');
    expect(signIn).not.toContain('service_role');
    expect(signUp).not.toContain('service_role');
  });
});

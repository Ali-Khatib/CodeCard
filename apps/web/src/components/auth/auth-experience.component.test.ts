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
    expect(signIn).not.toMatch(/setInterval\s*\([^)]*progress/i);
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

  it('uses a live-demo slideshow with bold feature copy instead of a decorative collage', () => {
    const shell = read('src/components/auth/auth-shell.tsx');
    const collage = read('src/components/auth/auth-collage.tsx');
    const wordmark = read('src/components/auth/auth-wordmark.tsx');

    expect(shell).toContain('useReducedMotion');
    expect(shell).toContain('AnimatePresence');
    expect(shell).toContain('showCollage');
    expect(shell).toContain('AuthCollage');
    expect(collage).toContain('data-testid="auth-collage"');
    expect(collage).toContain('Inside the live demo');
    expect(collage).toContain('One workspace for your whole identity');
    expect(collage).toContain('Showcase work that looks intentional');
    expect(collage).toContain('AnimatePresence');
    expect(collage).toContain('role="tablist"');
    expect(collage).not.toContain('Alex Rivera');
    expect(collage).not.toContain('Ready to share');
    expect(wordmark).toContain('CodeCard');
  });

  it('uses accessible password toggle and reserved error space', () => {
    const password = read('src/components/auth/auth-password-field.tsx');
    const field = read('src/components/auth/auth-field.tsx');
    expect(password).toContain('aria-pressed');
    expect(password).toContain('Hide characters');
    expect(password).toContain('Show characters');
    expect(password).toContain('setSelectionRange');
    expect(field).toContain('min-h-[18px]');
    expect(field).toContain('aria-invalid');
    expect(field).toContain('aria-describedby');
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

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
    expect(signUp).toContain('showGuidance');
    expect(signUp).toContain('signUpSchema');
    expect(signUp).toContain('autoComplete="new-password"');
    expect(signUp).not.toContain('Continue with Google');
    expect(signUp).not.toMatch(/password\s*=\s*searchParams|searchParams\.get\(['"]password/);
  });

  it('animates entrance with reduced-motion support and collage interactions', () => {
    const shell = read('src/components/auth/auth-shell.tsx');
    const collage = read('src/components/auth/auth-collage.tsx');
    const wordmark = read('src/components/auth/auth-wordmark.tsx');

    expect(shell).toContain('useReducedMotion');
    expect(shell).toContain('AnimatePresence');
    expect(shell).toContain('showCollage');
    expect(shell).toContain('cc-auth-mode');
    expect(collage).toContain('data-testid="auth-collage"');
    expect(collage).toContain('aria-hidden="true"');
    expect(collage).toContain('Ready to share');
    expect(collage).toContain('pointer: fine');
    expect(wordmark).toContain('text-[var(--iris)]');
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

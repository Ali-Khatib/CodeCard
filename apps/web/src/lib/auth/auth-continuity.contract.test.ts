import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('auth continuity', () => {
  it('keeps email sign-in, sign-up, and GitHub on both doors', () => {
    const signIn = read('src/app/sign-in/page.tsx');
    const signUp = read('src/app/sign-up/page.tsx');
    expect(signIn).toContain('signInWithPassword');
    expect(signIn).toContain('startGithubOAuth');
    expect(signUp).toContain('signUp(');
    expect(signUp).toContain('startGithubOAuth');
  });

  it('turns a password-reset hash into a session instead of leaving the opening screen', () => {
    const recover = read('src/app/auth/recover/page.tsx');
    const catcher = read('src/components/auth/auth-hash-recovery-catcher.tsx');
    expect(recover).toContain('parseRecoveryHash');
    expect(recover).toContain('setSession');
    expect(catcher).toContain('parseRecoveryHash');
    expect(catcher).toContain('setSession');
    expect(read('src/app/api/auth/complete-password-reset/route.ts')).toContain('updateUser');
  });

  it('exchanges the GitHub callback code on the server', () => {
    const callback = read('src/app/auth/callback/route.ts');
    expect(callback).toContain('exchangeCodeForSession');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('P0 recovery session route gate contracts', () => {
  it('proxy redirects recovery privilege using app_metadata from getUser', () => {
    const proxy = read('src/proxy.ts');
    expect(proxy).toContain('userHasPasswordRecoveryPrivilege');
    expect(proxy).toContain('isRecoveryAllowedPath');
    expect(proxy).toContain("url.pathname = '/reset-password'");
    expect(proxy).not.toMatch(/localStorage|sessionStorage|cc_pwd_recovery/);
  });

  it('auth callback stamps recovery privilege via service role', () => {
    const callback = read('src/app/auth/callback/route.ts');
    expect(callback).toContain('stampPasswordRecoveryPrivilege');
    expect(callback).toContain("otpType === 'recovery'");
  });

  it('mark-recovery redirects via configured app origin (no request.url open redirect)', () => {
    const mark = read('src/app/auth/mark-recovery/route.ts');
    expect(mark).toContain('getAppOrigin');
    expect(mark).not.toContain('new URL(request.url)');
    expect(mark).toContain('stampPasswordRecoveryPrivilege');
  });

  it('dashboard and admin layouts re-check recovery before rendering', () => {
    const dashboard = read('src/app/dashboard/(authenticated)/layout.tsx');
    const adminGate = read('src/lib/security/admin-route-gate.ts');
    expect(dashboard).toContain('userHasPasswordRecoveryPrivilege');
    expect(dashboard).toContain("redirect('/reset-password')");
    expect(adminGate).toContain('userHasPasswordRecoveryPrivilege');
    expect(adminGate).toContain("redirect('/reset-password')");
  });

  it('authenticated JSON APIs reject recovery sessions', () => {
    const secure = read('src/lib/security/secure-route.ts');
    const upload = read('src/app/api/upload/route.ts');
    expect(secure).toContain('recoverySessionForbiddenResponse');
    expect(upload).toContain('recoverySessionForbiddenResponse');
  });

  it('password reset completes via server API that clears privilege and signs out', () => {
    const reset = read('src/app/reset-password/page.tsx');
    const api = read('src/app/api/auth/complete-password-reset/route.ts');
    expect(reset).toContain('/api/auth/complete-password-reset');
    expect(api).toContain('clearPasswordRecoveryPrivilege');
    expect(api).toContain("scope: 'global'");
    expect(api).toContain('userHasPasswordRecoveryPrivilege');
  });
});

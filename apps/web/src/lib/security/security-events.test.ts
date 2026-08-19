import { describe, expect, it, vi } from 'vitest';
import { logSecurityEvent } from '@/lib/security/security-events';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('security event logging', () => {
  it('logs event names without secrets', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logSecurityEvent('ADMIN_ACCESS_DENIED', {
      reason: 'not_admin',
      password: 'should-not-log',
      token: 'should-not-log',
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.stringify(spy.mock.calls[0]);
    expect(payload).toContain('ADMIN_ACCESS_DENIED');
    expect(payload).toContain('not_admin');
    expect(payload).not.toContain('should-not-log');
    spy.mockRestore();
  });

  it('wires Stripe signature failures and admin denials', () => {
    const webhook = readFileSync(
      resolve(process.cwd(), 'src/lib/billing/stripe-webhook-core.ts'),
      'utf8',
    );
    const gate = readFileSync(
      resolve(process.cwd(), 'src/lib/security/admin-route-gate.ts'),
      'utf8',
    );
    const instrumentation = readFileSync(
      resolve(process.cwd(), 'src/instrumentation.ts'),
      'utf8',
    );
    expect(webhook).toContain("logSecurityEvent('STRIPE_WEBHOOK_FAILED'");
    expect(gate).toContain("logSecurityEvent('ADMIN_ACCESS_DENIED'");
    expect(instrumentation).toContain('assertNoLeakedPublicSecrets');
  });
});

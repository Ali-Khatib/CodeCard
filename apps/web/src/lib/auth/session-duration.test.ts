import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AUTH_ACCESS_TOKEN_SECONDS } from './session-duration';

describe('auth session duration', () => {
  it('keeps access tokens at one hour', () => {
    expect(AUTH_ACCESS_TOKEN_SECONDS).toBe(3600);
    const config = readFileSync(resolve(process.cwd(), '../../supabase/config.toml'), 'utf8');
    expect(config).toMatch(/jwt_expiry\s*=\s*3600/);
  });

  it('does not treat TOKEN_REFRESHED failures as hard logout', () => {
    const guard = readFileSync(
      resolve(process.cwd(), 'src/hooks/use-dashboard-session-guard.ts'),
      'utf8',
    );
    expect(guard).toContain("event === 'SIGNED_OUT'");
    expect(guard).not.toContain('TOKEN_REFRESHED');
  });
});

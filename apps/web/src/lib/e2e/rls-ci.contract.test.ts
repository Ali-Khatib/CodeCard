import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contract test for the WS14-T010 RLS CI job wiring.
 * Ensures the non-browser workflow references only isolated E2E secrets,
 * rejects the production project reference, and never embeds secret values.
 */

const REPO = resolve(process.cwd(), '../..');

describe('WS14-T010 RLS CI workflow contract', () => {
  const workflow = readFileSync(resolve(REPO, '.github/workflows/ci.yml'), 'utf8');

  it('wires an rls-integration job against isolated E2E secrets only', () => {
    expect(workflow).toContain('rls-integration:');
    expect(workflow).toContain('codecard-e2e-isolated');
    expect(workflow).toContain('npm run test:e2e:env');
    expect(workflow).toContain('npm run test:e2e:smoke');
    expect(workflow).toContain('npm run test:e2e:rls');
    expect(workflow).toContain('playwright-live-e2e:');
    expect(workflow).toContain('CODECARD_E2E_MAILTRAP_API_TOKEN');

    for (const secret of [
      'CODECARD_E2E_SUPABASE_URL',
      'CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY',
      'CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY',
      'CODECARD_E2E_SUPABASE_PROJECT_REF',
      'CODECARD_E2E_TEST_PASSWORD',
    ]) {
      expect(workflow).toContain(`secrets.${secret}`);
    }

    // Production project must be explicitly refused.
    expect(workflow).toContain('gclteunkzorwaliwhatp');
    expect(workflow).toContain('zbum*');
    expect(workflow).toContain('Refusing production Supabase project reference');

    // Never hardcode live secret material into YAML or fall back to production env files.
    expect(workflow).not.toMatch(/sb_secret_|eyJ[A-Za-z0-9_-]{20,}/);
    expect(workflow).toContain('.env.e2e.local');
    expect(workflow).not.toMatch(/(?<!e2e)\.env\.local/);
    expect(workflow).not.toContain('secrets.SUPABASE_SERVICE_ROLE_KEY');
    expect(workflow).not.toContain('secrets.NEXT_PUBLIC_SUPABASE_URL');
  });
});

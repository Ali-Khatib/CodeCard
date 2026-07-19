import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contract test for WS14-T012 Playwright CI wiring.
 */

const REPO = resolve(process.cwd(), '../..');

describe('WS14-T012 Playwright CI workflow contract', () => {
  const workflow = readFileSync(resolve(REPO, '.github/workflows/ci.yml'), 'utf8');
  const playwrightConfig = readFileSync(
    resolve(process.cwd(), 'playwright.e2e.config.ts'),
    'utf8',
  );

  it('wires playwright-live-e2e against isolated secrets with safe concurrency', () => {
    expect(workflow).toContain('playwright-live-e2e:');
    expect(workflow).toContain('codecard-e2e-isolated');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).toContain('npm run test:e2e:env');
    expect(workflow).toContain('npm run test:e2e:smoke');
    expect(workflow).toContain('playwright.e2e.config.ts');
    expect(workflow).toContain('auth.live.spec.ts');
    expect(workflow).toContain('profile.live.spec.ts');
    expect(workflow).toContain('projects.live.spec.ts');
    expect(workflow).toContain('research.live.spec.ts');
    expect(workflow).toContain('public.live.spec.ts');
    expect(workflow).toContain('account.live.spec.ts');
    expect(workflow).toContain('PLAYWRIGHT_E2E_SCREENSHOT: only-on-failure');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('if: failure()');
    expect(workflow).toContain('retention-days: 7');

    for (const secret of [
      'CODECARD_E2E_SUPABASE_URL',
      'CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY',
      'CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY',
      'CODECARD_E2E_SUPABASE_PROJECT_REF',
      'CODECARD_E2E_TEST_PASSWORD',
      'CODECARD_E2E_MAILTRAP_API_TOKEN',
      'CODECARD_E2E_MAILTRAP_ACCOUNT_ID',
      'CODECARD_E2E_MAILTRAP_INBOX_ID',
    ]) {
      expect(workflow).toContain(`secrets.${secret}`);
    }

    expect(workflow).toContain('gclteunkzorwaliwhatp');
    expect(workflow).toContain('zbum*');
    expect(workflow).toContain('Refusing production Supabase project reference');
    expect(workflow).not.toMatch(/sb_secret_|eyJ[A-Za-z0-9_-]{20,}/);
    expect(workflow).not.toContain('secrets.SUPABASE_SERVICE_ROLE_KEY');
    // No new axe-in-Playwright-CI work in T012 (owned by WS12-T011).
    expect(workflow).not.toMatch(/playwright-live-e2e:[\s\S]*axe/i);
  });

  it('keeps Playwright traces and videos off by default', () => {
    expect(playwrightConfig).toContain("trace: 'off'");
    expect(playwrightConfig).toContain("video: 'off'");
    expect(playwrightConfig).toContain("PLAYWRIGHT_E2E_SCREENSHOT === 'only-on-failure'");
  });
});

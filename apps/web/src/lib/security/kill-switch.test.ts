import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FEATURE_DISABLED_MESSAGE,
  isFeatureBlocked,
  isFeatureDisabled,
  isMaintenanceMode,
  KILL_SWITCH_FEATURES,
  killSwitchEnvVarNames,
  type KillSwitchFeature,
} from './kill-switch';

const ALL_FEATURES = Object.keys(KILL_SWITCH_FEATURES) as KillSwitchFeature[];

function readWeb(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('kill switch evaluation', () => {
  it('defaults every feature to enabled on an empty environment', () => {
    for (const feature of ALL_FEATURES) {
      expect(isFeatureBlocked(feature, {})).toBe(false);
    }
    expect(isMaintenanceMode({})).toBe(false);
  });

  it('disables a feature only for the exact string "1"', () => {
    expect(isFeatureDisabled('uploads', { CODECARD_DISABLE_UPLOADS: '1' })).toBe(true);
    for (const value of ['0', '', 'true', 'false', 'yes', 'TRUE', ' 1']) {
      expect(isFeatureDisabled('uploads', { CODECARD_DISABLE_UPLOADS: value })).toBe(false);
    }
  });

  it('keeps switches independent', () => {
    const env = { CODECARD_DISABLE_UPLOADS: '1' };
    expect(isFeatureBlocked('uploads', env)).toBe(true);
    expect(isFeatureBlocked('analytics', env)).toBe(false);
    expect(isFeatureBlocked('accountDeletion', env)).toBe(false);
  });

  it('maintenance mode blocks every feature at once', () => {
    const env = { CODECARD_MAINTENANCE_MODE: '1' };
    for (const feature of ALL_FEATURES) {
      expect(isFeatureBlocked(feature, env)).toBe(true);
    }
  });

  it('exposes every switch name for ops documentation', () => {
    const names = killSwitchEnvVarNames();
    expect(names).toContain('CODECARD_MAINTENANCE_MODE');
    for (const envVar of Object.values(KILL_SWITCH_FEATURES)) {
      expect(names).toContain(envVar);
    }
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('kill switch safety properties', () => {
  it('never exposes switches to the browser', () => {
    const src = readWeb('src/lib/security/kill-switch.ts');
    expect(src).toContain("import 'server-only'");
    /* A NEXT_PUBLIC_ switch would ship to the client and be user-editable. */
    expect(src).not.toContain('NEXT_PUBLIC_');
  });

  it('keeps the user-facing message free of configuration detail', () => {
    expect(FEATURE_DISABLED_MESSAGE).not.toMatch(/CODECARD_/);
    expect(FEATURE_DISABLED_MESSAGE).not.toMatch(/env|admin|switch|flag/i);
  });

  it('is enforced by the shared secure route before any side effect', () => {
    const src = readWeb('src/lib/security/secure-route.ts');
    expect(src).toContain('isFeatureBlocked');
    /* Compare against call sites, not the import lines above them. */
    const guardAt = src.indexOf("isFeatureBlocked(options.killSwitch)");
    expect(guardAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(src.indexOf('getClientIp(request)'));
    expect(guardAt).toBeLessThan(src.indexOf('parseJsonBody(request'));
    expect(guardAt).toBeLessThan(src.indexOf('auth.getUser()'));
  });

  it('is wired into the destructive and abuse-prone routes', () => {
    const expectations: [string, string][] = [
      ['src/app/api/upload/route.ts', "isFeatureBlocked('uploads')"],
      ['src/app/api/analytics/route.ts', "killSwitch: 'analytics'"],
      ['src/app/api/account/delete/route.ts', "killSwitch: 'accountDeletion'"],
      ['src/app/api/account/export/route.ts', "killSwitch: 'accountExport'"],
      ['src/app/api/dmca/route.ts', "killSwitch: 'publicReports'"],
      ['src/app/api/moderation/report/route.ts', "killSwitch: 'publicReports'"],
    ];
    for (const [file, needle] of expectations) {
      expect(readWeb(file), file).toContain(needle);
    }
  });

  it('blocks uploads before authentication is resolved', () => {
    const src = readWeb('src/app/api/upload/route.ts');
    expect(src.indexOf("isFeatureBlocked('uploads')")).toBeLessThan(
      src.indexOf('auth.getUser()'),
    );
  });
});

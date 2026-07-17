import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = resolve(process.cwd(), '../..');

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

describe('WS11-T009 CI security auditing', () => {
  const workflow = readRepo('.github/workflows/ci.yml');
  const rootPkg = JSON.parse(readRepo('package.json')) as {
    scripts?: Record<string, string>;
    workspaces?: string[];
    packageManager?: string;
  };
  const docs = readRepo('docs/CI_SECURITY_AUDITING.md');
  const scanner = readRepo('scripts/check-secrets.js');

  it('uses npm with a root lockfile covering workspaces', () => {
    expect(rootPkg.packageManager).toMatch(/^npm@/);
    expect(rootPkg.workspaces).toEqual(expect.arrayContaining(['apps/*', 'packages/*']));
    expect(readRepo('package-lock.json').length).toBeGreaterThan(100);
    expect(docs).toContain('package-lock.json');
    expect(docs).toContain('apps/*');
  });

  it('defines blocking secret-scan and dependency-audit scripts', () => {
    expect(rootPkg.scripts?.['security:scan']).toBe('node scripts/check-secrets.js');
    expect(rootPkg.scripts?.['security:audit']).toBe(
      'npm audit --audit-level=high --package-lock-only',
    );
    expect(scanner).toContain('process.exit(1)');
    expect(scanner).toContain('SECRET SCAN FAILED');
  });

  it('runs secret scanning and dependency audit as blocking CI jobs', () => {
    expect(workflow).toMatch(/secret-scan:/);
    expect(workflow).toMatch(/dependency-audit:/);
    expect(workflow).toContain('npm run security:scan');
    expect(workflow).toContain('npm run security:audit');
    expect(workflow).toMatch(/Install dependencies[\s\S]*npm ci[\s\S]*security:audit/);
  });

  it('documents and applies a high/critical severity threshold', () => {
    expect(docs).toMatch(/Fail on high and critical/i);
    expect(docs).toContain('--audit-level=high');
    expect(workflow).toContain('security:audit');
  });

  it('does not suppress security failures', () => {
    const securityJobs = workflow.split(/\n(?=  [a-z0-9-]+:)/).filter((block) =>
      /secret-scan:|dependency-audit:/.test(block),
    );
    expect(securityJobs.length).toBeGreaterThanOrEqual(2);
    for (const block of securityJobs) {
      expect(block).not.toMatch(/continue-on-error\s*:\s*true/);
      expect(block).not.toMatch(/\|\|\s*true/);
    }
    expect(workflow).not.toMatch(/security:audit[^\n]*\|\|\s*true/);
    expect(workflow).not.toMatch(/security:scan[^\n]*\|\|\s*true/);
  });

  it('constrains security job permissions and covers mvp + main', () => {
    expect(workflow).toMatch(/branches:\s*\[[^\]]*(main|mvp)[^\]]*(main|mvp)/);
    expect(workflow).toContain('mvp');
    expect(workflow).toMatch(/secret-scan:[\s\S]*?permissions:\s*\n\s+contents:\s*read/);
    expect(workflow).toMatch(/dependency-audit:[\s\S]*?permissions:\s*\n\s+contents:\s*read/);
  });

  it('keeps workflow YAML structurally valid for required keys', () => {
    expect(workflow).toMatch(/^name:\s*CI/m);
    expect(workflow).toMatch(/^on:/m);
    expect(workflow).toMatch(/^jobs:/m);
    expect(workflow).toContain('actions/checkout@v4');
    expect(workflow).toContain('actions/setup-node@v4');
  });
});

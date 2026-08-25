import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * The `/demo` tree is CodeCard's demo "account": a credential-free walkthrough
 * built from static fixtures rather than a real seeded login.
 *
 * That design is what makes it safe — there are no demo credentials to commit,
 * rotate, or leak, and no shared account for visitors to mutate. These
 * assertions keep it that way. The complementary
 * `authenticated-demo-isolation.contract.test.ts` guards the other direction
 * (authenticated routes must not import demo fixtures).
 */

const WEB = resolve(process.cwd());
const DEMO_ROOT = resolve(WEB, 'src/app/demo');

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(full);
  }
  return files;
}

const demoFiles = walk(DEMO_ROOT);

describe('demo experience is credential-free', () => {
  it('covers the demo route tree', () => {
    expect(demoFiles.length).toBeGreaterThan(5);
  });

  it('never creates a Supabase client, so it cannot read production data', () => {
    for (const file of demoFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/@\/lib\/supabase\/(server|client|service)/);
      expect(src, file).not.toMatch(/createServiceClient|createServerClient/);
    }
  });

  it('never authenticates or reads a session', () => {
    for (const file of demoFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/auth\.getUser|auth\.getSession|signInWith/);
    }
  });

  it('exposes no admin or moderation surface', () => {
    for (const file of demoFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/@\/lib\/(admin|security\/admin)/);
      expect(src, file).not.toMatch(/requireAdmin|isAdmin|SERVICE_ROLE/);
    }
  });

  it('hardcodes no credentials', () => {
    /*
     * A seeded demo login would need a password in the repo. This tree has no
     * login at all, so any credential-shaped literal here is a regression.
     */
    for (const file of demoFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
      expect(src, file).not.toMatch(/DEMO_PASSWORD|demo_password/i);
      expect(src, file).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
      expect(src, file).not.toMatch(/sk_(test|live)_|service_role/);
    }
  });

  it('draws its content from committed fixtures, not a live tenant', () => {
    const joined = demoFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(joined).toMatch(/demo-data|workspace-demo|circle-demo|notifications-demo/);
  });
});

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Import-boundary and isolation contract for the WS14 E2E bootstrap modules.
 * These checks are pure source inspections — they do not contact a backend.
 */

const WEB_ROOT = path.resolve(__dirname, '../../..');
const REPO_ROOT = path.resolve(WEB_ROOT, '../..');

function read(relativeFromRepo: string): string {
  return readFileSync(path.resolve(REPO_ROOT, relativeFromRepo), 'utf8');
}

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('WS14 E2E isolation contract', () => {
  it('8. service-role key remains server-only (no NEXT_PUBLIC_ for E2E service role)', () => {
    const example = read('apps/web/.env.example');
    expect(example).toContain('CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY=');
    expect(example).not.toMatch(/NEXT_PUBLIC_CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY/);
    expect(example).toMatch(/SERVER-ONLY/i);
  });

  it('9. admin fixture module is server-only and client import is forbidden', () => {
    const fixtures = read('apps/web/src/lib/e2e/admin-fixtures.ts');
    expect(fixtures).toMatch(/^import 'server-only';/);

    // No client component, page, or API route may import the admin fixtures.
    const srcRoot = path.join(WEB_ROOT, 'src');
    const offenders: string[] = [];
    for (const file of walkTsFiles(srcRoot)) {
      const rel = path.relative(WEB_ROOT, file).replace(/\\/g, '/');
      if (rel.startsWith('src/lib/e2e/')) continue;
      const contents = readFileSync(file, 'utf8');
      if (/from\s+['"]@\/lib\/e2e\/admin-fixtures['"]/.test(contents)) {
        offenders.push(rel);
      }
      if (
        contents.includes("'use client'") &&
        /from\s+['"]@\/lib\/e2e\//.test(contents)
      ) {
        offenders.push(rel);
      }
    }
    expect(offenders, `client/route imports of E2E fixtures: ${offenders.join(', ')}`).toEqual([]);
  });

  it('23. ordinary fixtures never receive global-admin metadata', () => {
    const fixtures = read('apps/web/src/lib/e2e/admin-fixtures.ts');
    expect(fixtures).not.toMatch(/app_metadata\s*:\s*\{[^}]*role\s*:\s*['"]admin['"]/);
    expect(fixtures).toContain('createUser');
    expect(fixtures).toMatch(/No app_metadata|never[\s\S]{0,40}administrators/i);
  });

  it('24. mock UI fixture mode is distinguishable from real E2E mode', () => {
    const example = read('apps/web/.env.example');
    expect(example).toContain('CODECARD_E2E_FIXTURES');
    expect(example).toMatch(/NOT equivalent to[\s#]+real E2E/i);
    expect(example).toContain('CODECARD_E2E=');
  });

  it('29. schema readiness check is read-only', () => {
    const readiness = read('apps/web/src/lib/e2e/schema-readiness.livetest.ts');
    expect(readiness).toMatch(/READ-ONLY|read-only/);
    expect(readiness).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/);
  });

  it('admin fixtures never reuse the production runtime Supabase clients', () => {
    const fixtures = read('apps/web/src/lib/e2e/admin-fixtures.ts');
    expect(fixtures).not.toMatch(/from\s+['"]@\/lib\/supabase\//);
    expect(fixtures).toContain("from '@supabase/supabase-js'");
    expect(fixtures).toContain('requireE2EEnvironment');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WS14-T017 — backup / rollback runbook completeness (no secrets, no db push).
 */

const ROOT = path.resolve(__dirname, '../../../../..');

function readRepo(rel: string) {
  return readFileSync(path.resolve(ROOT, rel), 'utf8');
}

describe('WS14-T017 RUNBOOK backup and rollback contract', () => {
  it('covers inventory, backup, migrate, rollback, incidents, and evidence', () => {
    const doc = readRepo('docs/RUNBOOK.md');
    expect(doc).toContain('gclteunkzorwaliwhatp');
    expect(doc).toContain('amneeddkxfbednqwzhao');
    expect(doc).toMatch(/zbum/i);
    expect(doc).toContain('codecard-mvp');
    expect(doc).toContain('System inventory');
    expect(doc).toContain('Backup procedure');
    expect(doc).toContain('Migration procedure');
    expect(doc).toContain('Rollback procedure');
    expect(doc).toContain('Incident response');
    expect(doc).toContain('Post-recovery validation');
    expect(doc).toContain('Evidence template');
    expect(doc).toContain('Ops drill');
    expect(doc).toContain('PRODUCTION GATE');
    expect(doc).toContain('forward-fix');
    expect(doc).toMatch(/PITR|Point-in-Time/i);
  });

  it('forbids agent production db push and omits secrets', () => {
    const doc = readRepo('docs/RUNBOOK.md');
    expect(doc).toMatch(/Agents must not run/i);
    expect(doc).toContain('supabase db push');
    expect(doc).not.toMatch(/sk_live_[A-Za-z0-9]{8,}/);
    expect(doc).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
    expect(doc).not.toMatch(/gQAAAAAA/);
    expect(doc).not.toMatch(/whsec_[A-Za-z0-9]{8,}/);
  });
});

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WS14-T018 — canonical launch checklist is tracked under docs/ (not gitignored root scratch).
 */

const ROOT = path.resolve(__dirname, '../../../../..');

function readRepo(rel: string) {
  return readFileSync(path.resolve(ROOT, rel), 'utf8');
}

describe('WS14-T018 launch checklist contract', () => {
  it('tracks docs/LAUNCH_CHECKLIST.md as the canonical source', () => {
    expect(existsSync(path.resolve(ROOT, 'docs/LAUNCH_CHECKLIST.md'))).toBe(true);

    const ignore = readRepo('.gitignore');
    expect(ignore).toMatch(/^\/LAUNCH_CHECKLIST\.md$/m);
    expect(ignore).not.toMatch(/^LAUNCH_CHECKLIST\.md$/m);

    const doc = readRepo('docs/LAUNCH_CHECKLIST.md');
    expect(doc).toContain('WS14-T018');
    expect(doc).toContain('Canonical tracked source of truth');
    expect(doc).toContain('amneeddkxfbednqwzhao');
    expect(doc).toContain('zbumnudyvclkmynpqjsr');
    expect(doc).toContain('dpl_GJopQb3PyqXZySpK9sdV4hsFTrmD');
    expect(doc).toContain('454b396');
    expect(doc).toMatch(/MVP validation launch/i);
    expect(doc).toMatch(/Real paid production billing/i);
    expect(doc).toMatch(/\bGO\b/);
    expect(doc).toMatch(/NO-GO/);
    expect(doc).toContain('Known risk');
    expect(doc).toContain('2265');
    expect(doc).toContain('3000');
    expect(doc).toContain('sk_test_');
    expect(doc).not.toMatch(/sk_live_[A-Za-z0-9]{8,}/);
    expect(doc).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
    expect(doc).not.toMatch(/whsec_[A-Za-z0-9]{8,}/);
  });

  it('is linked from README and RUNBOOK (not only the gitignored root scratch)', () => {
    const readme = readRepo('README.md');
    expect(readme).toContain('docs/LAUNCH_CHECKLIST.md');

    const runbook = readRepo('docs/RUNBOOK.md');
    expect(runbook).toContain('LAUNCH_CHECKLIST.md');
    expect(runbook).toContain('(./LAUNCH_CHECKLIST.md)');
  });
});

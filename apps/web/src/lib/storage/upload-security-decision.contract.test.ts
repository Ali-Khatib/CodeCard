import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const decisionPath = resolve(process.cwd(), '../../docs/WS04_T013_UPLOAD_SECURITY_DECISION.md');
const checklistPath = resolve(process.cwd(), '../../docs/SECURITY_CHECKLIST.md');

describe('WS04-T013 upload security decision contract', () => {
  it('keeps the decision document and checklist in the repository', () => {
    expect(existsSync(decisionPath)).toBe(true);
    expect(existsSync(checklistPath)).toBe(true);
  });

  it('records a conditional private-beta go without claiming a scanner exists', () => {
    const decision = readFileSync(decisionPath, 'utf8');
    expect(decision).toContain('CONDITIONAL GO');
    expect(decision).toContain('private beta');
    expect(decision).toContain('JPEG');
    expect(decision).toContain('PNG');
    expect(decision).toContain('WebP');
    expect(decision).toMatch(/SVG[\s\S]*Reject/i);
    expect(decision).toContain('PDF');
    expect(decision).toContain('NO-GO');
    expect(decision).not.toMatch(/ClamAV is integrated|VirusTotal is integrated|scanner is live/i);
  });

  it('separates private-beta deferral from public-launch scanning requirements', () => {
    const checklist = readFileSync(checklistPath, 'utf8');
    expect(checklist).toContain('Malware / virus scanning decision');
    expect(checklist).toContain('Conditional deferral');
    expect(checklist).toContain('Reassess');
    expect(checklist).toContain('performance');
    expect(checklist).toContain('WS04_T013_UPLOAD_SECURITY_DECISION.md');
    expect(checklist).toContain('Client-side image resizing/compression');
  });
});

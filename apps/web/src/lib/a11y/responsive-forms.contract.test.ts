import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

describe('WS12-T012 responsive forms QA matrix contract', () => {
  it('keeps the Playwright matrix covering all four widths', () => {
    const spec = readFileSync(resolve(WEB, 'e2e/responsive-forms.spec.ts'), 'utf8');
    expect(spec).toContain('375');
    expect(spec).toContain('390');
    expect(spec).toContain('414');
    expect(spec).toContain('430');
    expect(spec).toContain('assertNoHorizontalOverflow');
    expect(spec).toContain('/sign-in');
    expect(spec).toContain('/sign-up');
    expect(spec).toContain('/dashboard/preview/projects');
    expect(spec).toContain('/dashboard/preview/research');
    expect(spec).toContain('settings-account');
    expect(spec).toContain('public-report');
    expect(spec).toContain('fontSize = \'200%\'');
  });

  it('documents the QA matrix file', () => {
    const matrix = readFileSync(
      resolve(WEB, 'src/lib/a11y/responsive-forms-qa-matrix.md'),
      'utf8',
    );
    expect(matrix).toContain('WS12-T012');
    expect(matrix).toContain('375');
    expect(matrix).toContain('passed automatically');
  });
});

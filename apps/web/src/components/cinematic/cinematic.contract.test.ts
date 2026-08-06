import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('Proof dossier landing contract', () => {
  it('wires ProofLanding into marketing ProductPage only', () => {
    const page = read('src/components/landing/product-page.tsx');
    expect(page).toContain('ProofLanding');
    expect(page).toContain("from '@/components/landing/proof/proof-landing'");
    expect(page).not.toContain('ScatteredWorkScene');
    expect(page).not.toContain('ProductShowcaseScene');

    expect(read('src/app/demo/(workspace)/layout.tsx')).not.toContain('ProofLanding');
    expect(read('src/app/demo/card/layout.tsx')).not.toContain('ProofLanding');
    expect(read('src/app/dashboard/layout.tsx')).not.toContain('ProofLanding');
  });

  it('owns proof dossier scene files', () => {
    expect(existsSync(resolve(WEB, 'src/components/landing/proof/proof-landing.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/components/landing/proof/proof-cold-open.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/components/landing/proof/proof-evidence-wall.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolve(WEB, 'src/components/landing/proof/proof-inspection.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/styles/proof-dossier.css'))).toBe(true);
  });

  it('keeps cold-open statement as server LCP text', () => {
    const open = read('src/components/landing/proof/proof-cold-open.tsx');
    expect(open).toContain('YOUR WORK');
    expect(open).toContain('data-hero-statement');
    expect(open).not.toContain("'use client'");
  });

  it('keeps final CTA destinations correct', () => {
    const finale = read('src/components/landing/proof/proof-finale.tsx');
    expect(finale).toContain('/sign-up');
    expect(finale).toContain('LIVE_DEMO_HREF');
    expect(finale).toContain('LIVE_DEMO_PROFILE_HREF');
    expect(finale).toContain('closing-profile-preview-link');
  });

  it('limits pinned triggers on the inspection scene to one', () => {
    const inspect = read('src/components/landing/proof/proof-inspection.tsx');
    const pins = (inspect.match(/pin:\s*true/g) ?? []).length;
    expect(pins).toBe(1);
    expect(inspect).toContain('proof-inspect-pin');
  });
});

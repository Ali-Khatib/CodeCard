import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('CSP exception inventory', () => {
  const nextConfig = readWeb('next.config.ts');
  const layout = readWeb('src/app/layout.tsx');
  const securityDoc = readRepo('docs/security.md');

  it('keeps script-src exceptions that current shipped deps still need', () => {
    expect(nextConfig).toContain("'unsafe-inline'");
    expect(nextConfig).toContain("'unsafe-eval'");
    expect(nextConfig).toContain('https://va.vercel-scripts.com');
    expect(layout).toContain('/theme-boot.js');
    expect(layout).not.toContain('dangerouslySetInnerHTML');
  });

  it('does not add third-party QR or advertising script hosts', () => {
    expect(nextConfig).not.toContain('api.qrserver.com');
    expect(nextConfig).not.toMatch(/googletagmanager|facebook\.net|tiktok/i);
  });

  it('documents required vs future CSP reductions', () => {
    expect(securityDoc).toContain('REQUIRED EXCEPTIONS');
    expect(securityDoc).toContain('POSSIBLE FUTURE REDUCTIONS');
    expect(securityDoc).toContain('unsafe-inline');
    expect(securityDoc).toContain('unsafe-eval');
  });
});

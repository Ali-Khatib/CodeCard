import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());
const read = (rel: string) => readFileSync(resolve(WEB, rel), 'utf8');

describe('CodeCard brand mark assets', () => {
  it('ships file-based favicon and apple icon instead of a letter C ImageResponse', () => {
    expect(existsSync(resolve(WEB, 'src/app/icon.png'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/app/favicon.ico'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/app/apple-icon.png'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/app/icon.tsx'))).toBe(false);
    expect(existsSync(resolve(WEB, 'src/app/apple-icon.tsx'))).toBe(false);
    expect(read('src/app/layout.tsx')).toContain('/brand/favicon-32.png');
    expect(read('src/app/layout.tsx')).toContain('/brand/codecard-mark.svg');
    expect(read('src/app/layout.tsx')).toContain('/brand/apple-touch-icon.png');
  });

  it('expands the overlapping CC into CodeCard on hover', () => {
    const mark = read('src/components/brand/codecard-mark.tsx');
    const css = read('src/styles/codecard-mark.css');
    const landing = read('src/components/landing/codecard-mark-logo.tsx');
    const link = read('src/components/brand/codecard-mark-link.tsx');
    expect(mark).toContain('<svg');
    expect(mark).toContain('CodeCardExpandingMark');
    expect(mark).toContain('ode');
    expect(mark).toContain('ard');
    expect(css).toContain('.cc-ed-mark-logo__fill');
    expect(css).toContain('max-width: 0');
    expect(landing).toContain('CodeCardExpandingMark');
    expect(link).toContain('CodeCardExpandingMark');
  });

  it('embeds the mark in Open Graph cards', () => {
    const og = read('src/lib/profile/public-og-image-response.tsx');
    expect(og).toContain('codecard-mark-512.png');
    expect(og).toContain('<img');
  });
});

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

  it('uses the overlapping SVG mark in chrome, not two text C letters', () => {
    const mark = read('src/components/brand/codecard-mark.tsx');
    const landing = read('src/components/landing/codecard-mark-logo.tsx');
    const link = read('src/components/brand/codecard-mark-link.tsx');
    expect(mark).toContain('<svg');
    expect(mark).toContain('fillRule="evenodd"');
    expect(mark).not.toMatch(/>C</);
    expect(landing).toContain('CodeCardMark');
    expect(landing).not.toContain('cc-ed-mark-logo__c');
    expect(link).toContain('CodeCardMark');
    expect(link).not.toContain('cc-ed-mark-logo__c');
    expect(link).not.toContain('cc-ed-mark-logo__fill');
  });

  it('embeds the mark in Open Graph cards', () => {
    const og = read('src/lib/profile/public-og-image-response.tsx');
    expect(og).toContain('codecard-mark-512.png');
    expect(og).toContain('<img');
  });
});

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PUBLIC_XSS_PAYLOADS,
  toSafeHttpHref,
  toSafeProfileHref,
  toSafeProjectHref,
} from '@/lib/security/safe-href';
import { escapeHtml } from '@/lib/security/sanitize';
import { activitySentenceFor } from '@/lib/circle/circle-activity-contract';
import { normalizeText } from '@/lib/security/sanitize';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

describe('WS11-T006 XSS sanitization audit', () => {
  it('documents XSS policy and expands the payload corpus', () => {
    const doc = readRepo('docs/XSS_SANITIZATION.md');
    expect(doc).toContain('plain React text');
    expect(doc).toContain('Circle is a private latest-work feed');
    expect(doc).toContain('javascript:');
    expect(doc).toContain('SVG');
    expect(PUBLIC_XSS_PAYLOADS.length).toBeGreaterThanOrEqual(15);
    expect(PUBLIC_XSS_PAYLOADS).toContain('<script>alert(1)</script>');
    expect(PUBLIC_XSS_PAYLOADS).toContain('</script><script>alert(1)</script>');
    expect(PUBLIC_XSS_PAYLOADS).toContain('<iframe src="javascript:alert(1)">');
  });

  it('neutralizes unsafe protocols across shared href helpers', () => {
    for (const payload of PUBLIC_XSS_PAYLOADS) {
      if (/javascript:|vbscript:|data:|^\/\//i.test(payload.trim()) || payload.includes('javascript:')) {
        expect(toSafeHttpHref(payload)).toBeNull();
        expect(toSafeProjectHref(payload)).toBeNull();
        expect(toSafeProfileHref(payload)).toBeNull();
      }
    }
    expect(toSafeHttpHref('https://example.com/ok')).toBe('https://example.com/ok');
  });

  it('escapes HTML when escapeHtml is used and keeps React text payloads readable', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(normalizeText('  hello   <b>x</b>  ', 80)).toBe('hello <b>x</b>');
    // Activity sentences are plain text templates — payloads in names stay text.
    const sentence = activitySentenceFor('project_published', '<img src=x onerror=alert(1)>');
    expect(sentence).toContain('<img src=x onerror=alert(1)>');
    expect(sentence).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it('audits Circle, Connections note, and dashboard UGC surfaces for HTML sinks', () => {
    const surfaces = [
      'src/components/dashboard/authenticated-circle-view.tsx',
      'src/components/dashboard/dashboard-circle-view.tsx',
      'src/components/e2e/circle-harness.tsx',
    ];
    for (const file of surfaces) {
      const src = readWeb(file);
      expect(src).not.toContain('dangerouslySetInnerHTML');
      expect(src).not.toContain('innerHTML');
    }

    const notes = readWeb('src/lib/connections/connection-metadata-core.ts');
    expect(notes).not.toContain('dangerouslySetInnerHTML');
    expect(notes).toContain('getAuthenticatedUser');

    const noteUiCandidates = [
      'src/components/dashboard/connection-note-editor.tsx',
      'src/components/dashboard/connections-note-panel.tsx',
      'src/components/dashboard/connection-details-panel.tsx',
    ];
    for (const file of noteUiCandidates) {
      const path = resolve(WEB, file);
      if (!existsSync(path)) continue;
      const src = readFileSync(path, 'utf8');
      expect(src).not.toContain('dangerouslySetInnerHTML');
    }
  });

  it('rejects SVG upload types and keeps chart/layout sinks non-UGC', () => {
    const validation = readWeb('src/lib/storage/upload-validation.ts');
    expect(validation.toLowerCase()).toContain('svg');
    const validationTest = readWeb('src/lib/storage/upload-validation.test.ts');
    expect(validationTest).toMatch(/svg|image\/svg/);

    const layout = readWeb('src/app/layout.tsx');
    expect(layout).toContain('THEME_BOOT_SCRIPT');
    expect(layout).toContain('dangerouslySetInnerHTML');

    const chart = readWeb('src/components/ui/chart.tsx');
    expect(chart).toContain('dangerouslySetInnerHTML');
    expect(chart).toContain('--color-');
    expect(chart).not.toMatch(/userContent|displayName|bio|abstract/);
  });

  it('keeps metadata free of JSON-LD script concatenation and ships browser fixture', () => {
    const metadata = readWeb('src/lib/profile/public-metadata.ts');
    expect(metadata).not.toMatch(/application\/ld\+json|ld\+json/i);
    expect(metadata).not.toContain('dangerouslySetInnerHTML');

    expect(existsSync(resolve(WEB, 'src/app/e2e-fixtures/xss-public/page.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/components/e2e/xss-public-harness.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'e2e/xss-public.spec.ts'))).toBe(true);

    const harness = readWeb('src/components/e2e/xss-public-harness.tsx');
    expect(harness).toContain('PUBLIC_XSS_PAYLOADS');
    expect(harness).not.toContain('dangerouslySetInnerHTML');
    expect(harness).toContain('toSafeHttpHref');
  });
});

import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * `public/pdf.worker.min.mjs` is a committed copy of the pdfjs-dist worker, and
 * two independent kinds of drift silently break the inline research reader.
 *
 * 1. Version drift. pdf.js refuses to run when API and worker versions differ:
 *    `UnknownErrorException: The API version "x" does not match the Worker
 *    version "y"`. The package moved to 6.2.108 while the committed worker
 *    stayed at 6.1.200, so the reader threw for every paper.
 *
 * 2. Build-flavour drift. pdfjs-dist 6.2's *modern* build calls
 *    `Map.prototype.getOrInsertComputed`, a very recent built-in, and dies with
 *    `getOrInsertComputed is not a function` on browsers that lack it. Only the
 *    `legacy/` build carries the polyfill, so both the import and this worker
 *    copy must come from `legacy/`.
 *
 * Neither failure produced a test signal, because the worker is a build
 * artifact nothing asserted on. After bumping pdfjs-dist, re-copy it:
 *   cp node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs \
 *      apps/web/public/pdf.worker.min.mjs
 */

const require = createRequire(import.meta.url);

function installedPdfjsVersion(): string {
  return require('pdfjs-dist/package.json').version as string;
}

function committedWorkerSource(): string {
  return readFileSync(resolve(process.cwd(), 'public/pdf.worker.min.mjs'), 'utf8');
}

function rendererSource(): string {
  return readFileSync(
    resolve(process.cwd(), 'src/components/research/research-pdf-pages.tsx'),
    'utf8',
  );
}

describe('committed pdf.js worker matches the installed API', () => {
  it('declares the same version as pdfjs-dist', () => {
    const version = installedPdfjsVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    /*
     * The minified worker embeds its version string. Assert presence rather
     * than parsing a specific token, which minification can reshape.
     */
    expect(
      committedWorkerSource().includes(version),
      `public/pdf.worker.min.mjs does not contain pdfjs-dist ${version}. ` +
        'Re-copy it from node_modules/pdfjs-dist/build/pdf.worker.min.mjs.',
    ).toBe(true);
  });

  it('contains no other pdf.js version, so no stale copy lingers', () => {
    const version = installedPdfjsVersion();
    const source = committedWorkerSource();
    /* Version-shaped literals in the worker preamble must all agree. */
    const found = new Set(source.match(/\b\d+\.\d+\.\d{2,}\b/g) ?? []);
    for (const candidate of found) {
      expect(candidate, `unexpected version ${candidate} in committed worker`).toBe(version);
    }
  });

  it('is the worker build, not the main bundle', () => {
    const source = committedWorkerSource();
    expect(source.length).toBeGreaterThan(50_000);
    expect(source).toMatch(/WorkerMessageHandler/);
  });

  it('is referenced by the renderer at the path it is served from', () => {
    expect(rendererSource()).toContain("workerSrc = '/pdf.worker.min.mjs'");
  });

  it('carries the legacy polyfills the renderer relies on', () => {
    /*
     * Guards the modern-vs-legacy choice. The modern worker omits this
     * polyfill, which is what threw `getOrInsertComputed is not a function`.
     */
    expect(committedWorkerSource()).toContain('getOrInsertComputed');
  });

  it('is imported from the legacy build so older browsers still render', () => {
    expect(rendererSource()).toContain("import('pdfjs-dist/legacy/build/pdf.mjs')");
    /* A bare 'pdfjs-dist' import would silently reintroduce the modern build. */
    expect(rendererSource()).not.toMatch(/import\((['"])pdfjs-dist\1\)/);
  });

  it('reports a reason when rendering fails, so breakage is diagnosable', () => {
    /*
     * Both bugs above were invisible because the catch block was empty. Keep a
     * log, and keep it free of the raw error, which can quote PDF bytes.
     */
    const source = rendererSource();
    expect(source).toMatch(/catch \(error\)/);
    expect(source).toMatch(/console\.error\(/);
    expect(source).not.toMatch(/catch\s*\{\s*$/m);
  });
});

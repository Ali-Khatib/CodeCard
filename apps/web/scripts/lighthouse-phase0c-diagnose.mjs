#!/usr/bin/env node
/**
 * Phase 0C — single diagnostic Lighthouse run with LCP breakdown.
 * Usage: node apps/web/scripts/lighthouse-phase0c-diagnose.mjs <url> <label>
 * Writes JSON outside tracked commit intent under .lighthouse-phase0c/
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const outDir = path.join(webRoot, '.lighthouse-phase0c');
mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'https://codecard-mvp.vercel.app/';
const label = process.argv[3] || 'diag';
const outPath = path.join(outDir, `${label}.json`);

const args = [
  'lighthouse@12.6.1',
  url,
  '--only-categories=performance',
  '--form-factor=mobile',
  '--screenEmulation.mobile',
  '--throttling-method=simulate',
  '--output=json',
  `--output-path=${outPath}`,
  '--chrome-flags=--headless --no-sandbox --disable-gpu',
  '--quiet',
];

const run = spawnSync('npx', ['--yes', ...args], {
  cwd: webRoot,
  encoding: 'utf8',
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (!existsSync(outPath)) {
  console.error(run.stderr || run.stdout || 'no report');
  process.exit(1);
}

const report = JSON.parse(readFileSync(outPath, 'utf8'));
const audits = report.audits || {};

const lcpEl = audits['largest-contentful-paint-element'];
const lcpBreakdown = audits['lcp-breakdown-insight'] || audits['prioritize-lcp-image'];
const items0 = lcpEl?.details?.items?.[0]?.items?.[0];
const phases = lcpEl?.details?.items?.[1]?.items;

const summary = {
  url,
  label,
  lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
  fcpMs: Math.round(audits['first-contentful-paint']?.numericValue ?? 0),
  cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
  tbtMs: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
  ttfbMs: Math.round(audits['server-response-time']?.numericValue ?? 0),
  score: report.categories?.performance?.score,
  lcpSelector: items0?.node?.selector,
  lcpSnippet: items0?.node?.snippet,
  lcpNodeLabel: items0?.node?.nodeLabel,
  lcpType: items0?.type || items0?.node?.nodeLabel,
  phases,
  lcpBreakdown: lcpBreakdown?.details?.items ?? lcpBreakdown?.description,
  renderBlocking: (audits['render-blocking-resources']?.details?.items ?? []).slice(0, 12),
  bootup: (audits['bootup-time']?.details?.items ?? []).slice(0, 12).map((b) => ({
    url: b.url,
    total: b.total,
    scripting: b.scripting,
  })),
  longTasks: (audits['long-tasks']?.details?.items ?? []).slice(0, 15),
  mainThread: (audits['mainthread-work-breakdown']?.details?.items ?? []).slice(0, 10),
  networkRequests: (audits['network-requests']?.details?.items ?? [])
    .filter((r) => (r.resourceSize || 0) > 40000 || (r.transferSize || 0) > 30000)
    .slice(0, 20)
    .map((r) => ({
      url: r.url,
      mime: r.mimeType,
      transfer: r.transferSize,
      resource: r.resourceSize,
      start: r.networkRequestTime,
      end: r.networkEndTime,
    })),
  fontDisplay: audits['font-display']?.details?.items ?? [],
  unusedJs: (audits['unused-javascript']?.details?.items ?? []).slice(0, 10),
  prioritizeLcpImage: audits['prioritize-lcp-image']?.details?.items ?? null,
  usesResponsiveImages: (audits['uses-responsive-images']?.details?.items ?? []).slice(0, 8),
  offscreenImages: (audits['offscreen-images']?.details?.items ?? []).slice(0, 8),
  modernImageFormats: (audits['modern-image-formats']?.details?.items ?? []).slice(0, 8),
  preloadLcp: audits['prioritize-lcp-image']?.displayValue,
};

writeFileSync(path.join(outDir, `${label}-summary.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

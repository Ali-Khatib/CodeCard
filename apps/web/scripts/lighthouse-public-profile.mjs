#!/usr/bin/env node
/**
 * WS14-T019 — measure public-profile LCP via Lighthouse (mobile simulation).
 * Usage: node apps/web/scripts/lighthouse-public-profile.mjs <url>
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const outPath = path.join(webRoot, '.lighthouse-public-profile.json');
const url = process.argv[2] || 'https://codecard-mvp.vercel.app/alex-chen';
const BUDGET_MS = 2500;

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
  console.error(run.stderr || run.stdout || 'Lighthouse produced no report');
  process.exit(1);
}

const report = JSON.parse(readFileSync(outPath, 'utf8'));
const lcp = report.audits?.['largest-contentful-paint']?.numericValue;
const score = report.categories?.performance?.score;
console.log(
  JSON.stringify(
    {
      url,
      lcpMs: Math.round(lcp),
      lcpDisplay: report.audits?.['largest-contentful-paint']?.displayValue,
      performanceScore: score,
      budgetMs: BUDGET_MS,
      pass: typeof lcp === 'number' && lcp < BUDGET_MS,
    },
    null,
    2,
  ),
);

try {
  unlinkSync(outPath);
} catch {
  /* ignore */
}

if (typeof lcp !== 'number' || lcp >= BUDGET_MS) {
  process.exit(2);
}

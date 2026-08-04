#!/usr/bin/env node
/**
 * Phase 0 closure — N mobile Lighthouse runs for landing + demo.
 * Usage: node apps/web/scripts/lighthouse-phase0-closure.mjs [runs=7]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const outDir = path.join(webRoot, '.lighthouse-phase0-closure');
mkdirSync(outDir, { recursive: true });

const runs = Number(process.argv[2] || 7);
const urls = [
  { key: 'landing', url: 'https://codecard-mvp.vercel.app/' },
  { key: 'demo', url: 'https://codecard-mvp.vercel.app/demo' },
];

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function runOnce(url, outPath) {
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
  return spawnSync('npx', ['--yes', ...args], {
    cwd: webRoot,
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const report = {};

for (const { key, url } of urls) {
  const rows = [];
  for (let i = 1; i <= runs; i++) {
    const outPath = path.join(outDir, `${key}-${i}.json`);
    console.log(`\n=== ${key} run ${i}/${runs} ===`);
    const result = runOnce(url, outPath);
    if (!existsSync(outPath)) {
      console.error(result.stderr || result.stdout || 'no report');
      rows.push({ run: i, error: true });
      continue;
    }
    const json = JSON.parse(readFileSync(outPath, 'utf8'));
    const row = {
      run: i,
      lcp: Math.round(json.audits['largest-contentful-paint']?.numericValue ?? 0),
      cls: Number(json.audits['cumulative-layout-shift']?.numericValue ?? 0),
      tbt: Math.round(json.audits['total-blocking-time']?.numericValue ?? 0),
      score: json.categories?.performance?.score ?? null,
      fcp: Math.round(json.audits['first-contentful-paint']?.numericValue ?? 0),
      inp: json.audits['interaction-to-next-paint']?.numericValue ?? null,
      inpDisplay: json.audits['interaction-to-next-paint']?.displayValue ?? 'not measured',
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  const ok = rows.filter((r) => !r.error);
  report[key] = {
    url,
    runs: rows,
    median: {
      lcp: median(ok.map((r) => r.lcp)),
      cls: median(ok.map((r) => r.cls)),
      tbt: median(ok.map((r) => r.tbt)),
      score: median(ok.map((r) => r.score ?? 0)),
    },
  };
}

writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(report, null, 2));
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(report, null, 2));

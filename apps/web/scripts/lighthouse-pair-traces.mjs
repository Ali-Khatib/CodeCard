#!/usr/bin/env node
/**
 * Capture paired fast/slow Lighthouse runs with full JSON for T019 diagnosis.
 * Loops until both buckets are filled (or maxAttempts).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '.lighthouse-t019');
mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'https://codecard-mvp.vercel.app/alex-chen';
const FAST = 2500;
const SLOW = 3000;
const maxAttempts = Number(process.argv[3] || 12);

let fast = null;
let slow = null;
const all = [];

for (let i = 1; i <= maxAttempts && (!fast || !slow); i++) {
  const outPath = path.join(outDir, `run-${i}.json`);
  console.log(`\n=== attempt ${i} ===`);
  const run = spawnSync(
    'npx',
    [
      '--yes',
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
    ],
    { encoding: 'utf8', shell: true, cwd: path.join(__dirname, '..') },
  );
  if (!existsSync(outPath)) {
    console.error(run.stderr || run.stdout || 'no report');
    continue;
  }
  const report = JSON.parse(readFileSync(outPath, 'utf8'));
  const lcp = Math.round(report.audits['largest-contentful-paint']?.numericValue ?? 0);
  const fcp = Math.round(report.audits['first-contentful-paint']?.numericValue ?? 0);
  const tbt = Math.round(report.audits['total-blocking-time']?.numericValue ?? 0);
  const cls = report.audits['cumulative-layout-shift']?.numericValue ?? 0;
  const si = Math.round(report.audits['speed-index']?.numericValue ?? 0);
  const score = report.categories?.performance?.score;
  const phases = report.audits['largest-contentful-paint-element']?.details?.items?.[1]?.items;
  const el = report.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node;
  const bootup = (report.audits['bootup-time']?.details?.items ?? []).slice(0, 8);
  const longTasks = report.audits['long-tasks']?.details?.items ?? [];
  const fonts = report.audits['font-display']?.details?.items ?? [];
  const mainThread = report.audits['mainthread-work-breakdown']?.details?.items ?? [];
  const ttfb = Math.round(report.audits['server-response-time']?.numericValue ?? 0);

  const summary = {
    attempt: i,
    lcp,
    fcp,
    tbt,
    cls,
    si,
    score,
    ttfb,
    phases,
    lcpSelector: el?.selector,
    lcpSnippet: el?.snippet,
    lcpLabel: el?.nodeLabel,
    bootup: bootup.map((b) => ({ url: b.url, total: b.total, scripting: b.scripting })),
    longTasks: longTasks.slice(0, 15).map((t) => ({
      start: t.startTime,
      duration: t.duration,
      url: t.url,
    })),
    mainThread: mainThread.map((m) => ({ group: m.group, duration: m.duration })),
    fonts,
  };
  all.push(summary);
  writeFileSync(path.join(outDir, `summary-${i}.json`), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ lcp, fcp, tbt, score, ttfb, phases }, null, 2));

  if (!fast && lcp < FAST) {
    fast = summary;
    copyFileSync(outPath, path.join(outDir, 'fast.json'));
    writeFileSync(path.join(outDir, 'fast-summary.json'), JSON.stringify(summary, null, 2));
    console.log('Captured FAST');
  }
  if (!slow && lcp >= SLOW) {
    slow = summary;
    copyFileSync(outPath, path.join(outDir, 'slow.json'));
    writeFileSync(path.join(outDir, 'slow-summary.json'), JSON.stringify(summary, null, 2));
    console.log('Captured SLOW');
  }
}

writeFileSync(path.join(outDir, 'all-summaries.json'), JSON.stringify(all, null, 2));
console.log('\n=== PAIR RESULT ===');
console.log(
  JSON.stringify(
    {
      fastLcp: fast?.lcp ?? null,
      slowLcp: slow?.lcp ?? null,
      attempts: all.length,
      allLcps: all.map((a) => a.lcp),
    },
    null,
    2,
  ),
);
process.exit(fast && slow ? 0 : 2);

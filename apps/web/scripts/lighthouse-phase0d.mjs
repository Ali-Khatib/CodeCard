#!/usr/bin/env node
/**
 * Phase 0D — standardized sequential mobile Lighthouse.
 * Fresh Chrome user-data-dir per run; one process at a time; cooldown.
 *
 * Usage:
 *   node apps/web/scripts/lighthouse-phase0d.mjs <url> <label> [runs=3]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const outDir = path.join(webRoot, '.lighthouse-phase0d');
mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'https://codecard-mvp.vercel.app/';
const label = process.argv[3] || 'diag';
const runs = Number(process.argv[4] || 3);
const COOLDOWN_MS = 4000;

function sleep(ms) {
  spawnSync(process.execPath, ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${ms})`], {
    stdio: 'ignore',
  });
}

function chromeVersion() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);
  for (const bin of candidates) {
    if (!existsSync(bin)) continue;
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (r.stdout) return r.stdout.trim();
  }
  return 'unknown';
}

function fetchHeaders(target) {
  try {
    const r = spawnSync(
      'curl',
      ['-sI', target],
      { encoding: 'utf8', shell: true },
    );
    const text = r.stdout || '';
    const pick = (name) => {
      const re = new RegExp(`^${name}:\\s*(.+)$`, 'im');
      const m = text.match(re);
      return m ? m[1].trim() : null;
    };
    return {
      status: (text.match(/^HTTP\/\S+\s+(\d+)/im) || [])[1] || null,
      'cache-control': pick('cache-control'),
      age: pick('age'),
      'x-vercel-cache': pick('x-vercel-cache'),
      'server-timing': pick('server-timing'),
      'content-encoding': pick('content-encoding'),
      'content-length': pick('content-length'),
      'x-matched-path': pick('x-matched-path'),
      raw: text.slice(0, 2000),
    };
  } catch (e) {
    return { error: String(e) };
  }
}

const meta = {
  lighthousePinned: '12.6.1',
  chrome: chromeVersion(),
  node: process.version,
  platform: `${os.platform()} ${os.release()}`,
  cpus: os.cpus()?.[0]?.model,
  url,
  label,
  runs,
  throttling: 'mobile simulate (Lighthouse default mobile)',
  freshProfilePerRun: true,
  sequential: true,
  cooldownMs: COOLDOWN_MS,
  measuredAt: new Date().toISOString(),
};

writeFileSync(path.join(outDir, `${label}-meta.json`), JSON.stringify(meta, null, 2));
const headers = fetchHeaders(url);
writeFileSync(path.join(outDir, `${label}-headers.json`), JSON.stringify(headers, null, 2));
console.log('META', JSON.stringify(meta, null, 2));
console.log('HEADERS', JSON.stringify(headers, null, 2));

const rows = [];
for (let i = 1; i <= runs; i++) {
  const profileDir = path.join(os.tmpdir(), `cc-lh-${label}-${Date.now()}-${i}`);
  mkdirSync(profileDir, { recursive: true });
  const outPath = path.join(outDir, `${label}-${i}.json`);
  console.log(`\n=== ${label} run ${i}/${runs} ===`);
  const args = [
    'lighthouse@12.6.1',
    url,
    '--only-categories=performance',
    '--form-factor=mobile',
    '--screenEmulation.mobile',
    '--throttling-method=simulate',
    '--output=json',
    `--output-path=${outPath}`,
    `--chrome-flags=--headless --no-sandbox --disable-gpu --disable-extensions --user-data-dir=${profileDir}`,
    '--quiet',
  ];
  const run = spawnSync('npx', ['--yes', ...args], {
    cwd: webRoot,
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  if (!existsSync(outPath)) {
    console.error(run.stderr || run.stdout || 'no report');
    rows.push({ run: i, error: true, stderr: (run.stderr || '').slice(0, 500) });
  } else {
    const json = JSON.parse(readFileSync(outPath, 'utf8'));
    const row = {
      run: i,
      lcp: Math.round(json.audits['largest-contentful-paint']?.numericValue ?? 0),
      cls: Number(json.audits['cumulative-layout-shift']?.numericValue ?? 0),
      tbt: Math.round(json.audits['total-blocking-time']?.numericValue ?? 0),
      fcp: Math.round(json.audits['first-contentful-paint']?.numericValue ?? 0),
      score: json.categories?.performance?.score ?? null,
      ttfb: Math.round(json.audits['server-response-time']?.numericValue ?? 0),
      lcpSelector:
        json.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node
          ?.selector ?? null,
      phases: json.audits['largest-contentful-paint-element']?.details?.items?.[1]?.items ?? null,
      lighthouseVersion: json.lighthouseVersion,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  if (i < runs) sleep(COOLDOWN_MS);
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const ok = rows.filter((r) => !r.error);
const summary = {
  meta,
  headers,
  runs: rows,
  median: {
    lcp: median(ok.map((r) => r.lcp)),
    cls: median(ok.map((r) => r.cls)),
    tbt: median(ok.map((r) => r.tbt)),
    score: median(ok.map((r) => r.score ?? 0)),
  },
};
writeFileSync(path.join(outDir, `${label}-summary.json`), JSON.stringify(summary, null, 2));
console.log('\nSUMMARY', JSON.stringify(summary.median, null, 2));

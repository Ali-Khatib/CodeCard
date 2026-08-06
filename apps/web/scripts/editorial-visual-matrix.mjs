/**
 * Capture editorial landing visual matrix.
 * Usage: node scripts/editorial-visual-matrix.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '.tmp-screenshots', 'editorial-landing');
mkdirSync(outDir, { recursive: true });

const base = (process.argv[2] || 'http://127.0.0.1:3000').replace(/\/$/, '');

const viewports = [
  { name: '390', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: '1366', width: 1366, height: 768 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
];

const shots = [
  ['01-hero', 'editorial-hero'],
  ['02-statement', 'editorial-statement'],
  ['03-projects', 'editorial-story-projects'],
  ['04-research', 'editorial-story-research'],
  ['05-impact', 'editorial-story-impact'],
  ['06-proof', 'editorial-proof'],
  ['07-finale', 'editorial-finale'],
];

async function capture(browser, vp, reduced = false) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(400);
  const prefix = reduced ? `${vp.name}-rm` : vp.name;

  for (const [label, testId] of shots) {
    const el = page.getByTestId(testId);
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
    }
    await page.screenshot({
      path: path.join(outDir, `${prefix}-${label}.png`),
      fullPage: false,
    });
    console.log('wrote', `${prefix}-${label}.png`);
  }

  // Demo + public profile destinations
  await page.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `${prefix}-09-demo.png`), fullPage: false });
  await page.goto(`${base}/demo/card`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `${prefix}-10-card.png`), fullPage: false });

  await context.close();
}

const browser = await chromium.launch();
try {
  for (const vp of viewports) await capture(browser, vp, false);
  await capture(browser, viewports[0], true);
  await capture(browser, viewports[4], true);
} finally {
  await browser.close();
}
console.log('done', outDir);

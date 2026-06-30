import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = process.env.BASE_URL ?? 'http://localhost:3004';
const dir = path.resolve('C:/Users/khati/Desktop/codecard/apps/web/.screenshots');
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const [name, w, h] of [
  ['landing-1440x900', 1440, 900],
  ['landing-390x844', 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('h1', { timeout: 30000 });
  await page.waitForSelector('nav', { timeout: 30000 });
  await page.waitForTimeout(w === 390 ? 8000 : 10000);
  if (w > 768) {
    await page.waitForFunction(() => document.querySelectorAll('canvas').length >= 1, { timeout: 15000 }).catch(() => {});
  }
  await page.screenshot({ path: path.join(dir, `${name}-hero.png`) });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(dir, `${name}-scroll.png`) });
  const state = await page.evaluate(() => ({
    buttons: [...document.querySelectorAll('button')].map((b) => b.textContent?.trim()),
    canvases: document.querySelectorAll('canvas').length,
    h1: document.querySelector('h1')?.textContent,
    createCta: document.body.innerText.includes('Create your CodeCard'),
    techSection: document.body.innerText.includes('GitHub') || document.querySelectorAll('svg').length,
    profileHidden: (() => {
      const el = [...document.querySelectorAll('div')].find((d) =>
        d.textContent?.includes('Alex Chen') && d.textContent?.includes('DevFlow'),
      );
      if (!el) return null;
      const s = getComputedStyle(el);
      return { opacity: s.opacity, visibility: s.visibility };
    })(),
  }));
  console.log(name, JSON.stringify(state, null, 2));
  await page.close();
}

const demo = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
demo.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
demo.on('pageerror', (err) => consoleErrors.push(String(err)));
await demo.goto(`${base}/demo`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await demo.waitForFunction(() => document.body.innerText.includes('Alex Chen'), { timeout: 45000 });
await demo.waitForTimeout(12000);
const demoState = await demo.evaluate(() => ({
  canvases: document.querySelectorAll('canvas').length,
  hasAlex: document.body.innerText.includes('Alex Chen'),
  errors: [...document.querySelectorAll('body *')]
    .slice(0, 1)
    .map(() => null),
}));
console.log('demo', JSON.stringify(demoState, null, 2));
await demo.screenshot({ path: path.join(dir, 'demo-1440x900.png') });
console.log(
  'demo-console-errors',
  consoleErrors.filter((e) => /image|GLTF|null|TypeError/i.test(e)),
);

await browser.close();
console.log('screenshots saved to', dir);

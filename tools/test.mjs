import { chromium } from 'playwright';
import http from 'http';
import { spawn } from 'child_process';

const server = spawn(process.execPath, ['tools/server.js'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));

const b = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = {};

async function check(url, viewport, name, extra) {
  const page = await b.newPage({ viewport });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  const s1 = await page.evaluate(() => ({ ...window.__stats }));
  await page.waitForTimeout(900);
  const s2 = await page.evaluate(() => ({ ...window.__stats }));
  results[name] = {
    errors: errs,
    animAdvance: s2.dist > s1.dist && s2.crank > s1.crank && s2.wheel > s1.wheel,
    speed: Math.round(s2.speed), dist: Math.round(s2.dist)
  };
  if (extra) await extra(page);
  await page.screenshot({ path: `shots/${name}.png` });
  await page.close();
  errors.push(...errs);
}

await check('http://127.0.0.1:8123/', { width: 1280, height: 800 }, 'desktop', async p => {
  await p.evaluate(() => window.__setCrank(Math.PI * 0.7));
  await p.waitForTimeout(150);
  await p.screenshot({ path: 'shots/desktop-2.png' });
});
await check('http://127.0.0.1:8123/', { width: 390, height: 844 }, 'mobile');
await check('http://127.0.0.1:8123/', { width: 1920, height: 900 }, 'wide');
{
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__setDist(22500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/desktop-warm.png' });
  await page.evaluate(() => window.__jump());
  await page.waitForTimeout(260);
  await page.screenshot({ path: 'shots/desktop-jump.png' });
  errors.push(...errs);
  await page.close();
}

console.log(JSON.stringify({ results, totalErrors: errors.length, errors: errors.slice(0, 5) }, null, 2));
await b.close();
server.kill();
process.exit(errors.length || !results.desktop.animAdvance || !results.mobile.animAdvance ? 1 : 0);

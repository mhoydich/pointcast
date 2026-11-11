#!/usr/bin/env node
// Phone-size check of /baby-bonfire/first-place/ in a real browser, served straight from public/.
//
//   PLAYWRIGHT_PATH=/path/to/node_modules/playwright CHROME_PATH=/usr/bin/google-chrome \
//     node scripts/baby-bonfire/e2e-first-place.mjs [--shots=/tmp/first-place-shots]
//
// Needs Playwright and a Chrome binary; neither is a repo dependency, and this is not run in CI.
// It opens the page at 390x844 with touch, and fails on any page error, console error or request
// that leaves the page's own origin. It checks that the drawing is drawn, that dragging turns it
// (mouse and finger), that the buttons and arrow keys work, and that every download link answers
// with the bytes the manifest promises.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pub = join(root, 'public');
const shots = (process.argv.find((a) => a.startsWith('--shots=')) || '').slice(8);
if (shots) mkdirSync(shots, { recursive: true });
const PAGE = '/baby-bonfire/first-place/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.stl': 'model/stl' };

const server = createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('/')) path += 'index.html';
  const file = join(pub, path);
  if (!file.startsWith(pub) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;
const log = (...a) => console.log('  ', ...a);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
const errors = [];
const outside = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) outside.push(r.url()); });

  await page.goto(base + PAGE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('view').hasAttribute('data-yaw'));
  const shot = async (name, full = false) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: full }); };
  // How much of the canvas is drawn, and a fingerprint of the picture.
  const picture = () => page.evaluate(() => {
    const cv = document.getElementById('view');
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let drawn = 0, sum = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3]) drawn++; sum = (sum * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3]) >>> 0; }
    return { drawn: drawn / (d.length / 4), sum, w: cv.width, h: cv.height, yaw: +cv.dataset.yaw, pitch: +cv.dataset.pitch };
  });
  const settle = () => page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));

  const first = await picture();
  log(`canvas ${first.w}x${first.h}, ${(first.drawn * 100).toFixed(1)}% drawn, yaw ${first.yaw}, pitch ${first.pitch}`);
  assert.ok(first.drawn > 0.15 && first.drawn < 0.9, 'the drawing covers a sensible share of the canvas');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no sideways scroll at 390px');
  await shot('01-top-of-page');
  await page.locator('#view').scrollIntoViewIfNeeded();
  await shot('02-drawing');

  // Drag with a mouse: across turns it, down tips it.
  const box = await page.locator('#view').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy + 30, { steps: 8 });
  await page.mouse.up();
  await settle();
  const dragged = await picture();
  log(`after a mouse drag: yaw ${dragged.yaw}, pitch ${dragged.pitch}`);
  assert.ok(Math.abs(dragged.yaw - first.yaw - 0.96) < 0.05 && Math.abs(dragged.pitch - first.pitch - 0.36) < 0.05, 'a drag of 80 by 30 turns it by 0.96 and tips it by 0.36');
  assert.notEqual(dragged.sum, first.sum, 'the picture changed');
  await shot('03-after-drag');

  // Drag with a finger, sideways: the page must stay where it is and the drawing must turn.
  const scrollBefore = await page.evaluate(() => window.scrollY);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', cx, cy);
  for (let i = 1; i <= 8; i++) await touch('touchMove', cx - i * 10, cy);
  await touch('touchEnd');
  await settle();
  const swiped = await picture();
  log(`after a finger drag: yaw ${swiped.yaw}`);
  assert.ok(swiped.yaw < dragged.yaw - 0.5, 'a sideways finger drag turns it');
  assert.equal(await page.evaluate(() => window.scrollY), scrollBefore, 'a sideways finger drag does not scroll the page');

  // Keyboard.
  await page.locator('#view').focus();
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.ok((await picture()).yaw > swiped.yaw, 'the right arrow turns it');

  // Buttons.
  const pressed = (id) => page.locator(id).getAttribute('aria-pressed');
  await page.locator('#b-sense').click();
  await settle();
  assert.equal(await pressed('#b-sense'), 'true');
  assert.equal(await pressed('#b-blank'), 'false');
  assert.match(await page.locator('#say').textContent(), /sensing puck and its vented lid in its bay/);
  await shot('04-sensing-puck');
  await page.locator('#b-apart').click();
  await settle();
  assert.match(await page.locator('#say').textContent(), /lifted out above its bay/);
  await shot('05-lifted-apart');
  await page.locator('#b-under').click();
  await settle();
  assert.equal(await pressed('#b-under'), 'true');
  assert.ok((await picture()).pitch < 0, 'underneath looks from below');
  assert.match(await page.locator('#say').textContent(), /underneath: four feet, the round recess for the tag/);
  await shot('06-underneath');
  await page.locator('#b-apart').click();
  await page.locator('#b-blank').click();
  await page.locator('#b-under').click();
  await settle();
  await shot('07-blank-again');

  // Every download link answers, with the bytes the manifest lists.
  const manifest = JSON.parse(readFileSync(join(pub, 'baby-bonfire/first-place/files/manifest.json'), 'utf8'));
  const links = await page.locator('a[download]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  assert.equal(links.length, manifest.files.length + 2, 'one link per file, plus params.json and manifest.json');
  for (const href of links) {
    const res = await ctx.request.get(base + href);
    assert.equal(res.status(), 200, href);
    const body = await res.body();
    const listed = manifest.files.find((f) => href.endsWith(`/${f.file}`));
    if (listed) {
      assert.equal(body.length, listed.bytes, href);
      assert.equal(createHash('sha256').update(body).digest('hex'), listed.sha256, href);
      assert.equal(body.readUInt32LE(80), listed.triangles, href);
    } else JSON.parse(body.toString('utf8'));
    log(`${href} 200, ${body.length} bytes`);
  }
  // Links to other pages of the area resolve too.
  const local = await page.locator('a[href^="/baby-bonfire/"]:not([download])').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
  for (const href of local) assert.equal((await ctx.request.get(base + href)).status(), 200, href);
  log(`${local.length} links to other Baby Bonfire pages resolve`);

  await shot('08-whole-page', true);
  assert.deepEqual(outside, [], 'no request left the page\'s own origin');
  assert.deepEqual(errors, [], 'no page or console errors');
  console.log('first place e2e: ok');
} finally {
  await browser.close();
  server.close();
}

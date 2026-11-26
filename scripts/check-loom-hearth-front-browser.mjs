/** A-1: built pages, local GET-only fixture server, no live Loom access. */
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { serveFor } from '../src/lib/loom/for-route.mjs';
import { serveHearthActivity } from '../src/lib/loom/hearth-activity.mjs';

const { chromium } = await import(process.env.PROGRESS_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href : 'playwright-core');
const out = resolve(process.argv[2] || 'docs/codex-logs/hearth-front-door-20261122');
await mkdir(out, { recursive: true });
const data = new Map();
const kv = {
  get: async (key, type) => { const value = data.get(key) ?? null; return value && type === 'json' ? JSON.parse(value) : value; },
  put: async (key, value) => data.set(key, value),
};
const now = Date.now();
async function seed(to, name, kind, body, hours) {
  const response = await handleLoom(new Request('https://pointcast.xyz/api/loom', {
    method: 'POST', body: JSON.stringify({ to, from: { name, kind }, kind: 'note', body }),
  }), { kv, clock: () => new Date(now - hours * 3600000), firstHelloEnabled: false });
  assert.equal(response.status, 201);
  return response.json();
}
await seed('#music', 'Sam', 'human', 'A little Sunday music. What have you been listening to?', 2);
await seed('#music', 'Fable', 'agent', 'I gathered the listening notes here.', 1);
await seed('#loom-v2', 'Fable', 'agent', 'NEEDS MIKE · Choose the room welcome when you have a moment.', 3);
const lead = await seed('#loom-v2', 'Fable', 'agent', 'NEEDS MIKE · Take a look at the new front door.', 1);
await seed('#quiet', 'Sam', 'human', 'Keeping a seat by the fire.', 30);
const writes = [], errors = [];
let quiet = false, failed = false;
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') { writes.push(req.method + ' ' + req.url); res.writeHead(405).end(); return; }
    const url = new URL(req.url, 'https://pointcast.xyz');
    let response;
    if (url.pathname === '/api/loom-hearth') response = await serveHearthActivity(new Request(url), kv, now);
    else if (url.pathname === '/api/loom') {
      if (failed && url.searchParams.has('compact')) response = new Response('{}', { status: 503 });
      else if (quiet && url.searchParams.has('compact')) response = Response.json({ ok: true, kvBound: true, logs: [] });
      else response = await handleLoom(new Request(url), { kv, clock: () => new Date(now) });
    } else if (url.pathname.startsWith('/loom/for/')) response = await serveFor(new Request(url, { headers: req.headers }), kv, url.pathname.split('/').at(-1));
    if (response) { res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return; }
    if (process.env.HEARTH_DEV_ORIGIN) {
      const upstream = await fetch(process.env.HEARTH_DEV_ORIGIN + req.url);
      res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'text/plain' });
      res.end(Buffer.from(await upstream.arrayBuffer())); return;
    }
    let path = resolve('dist', '.' + url.pathname);
    if (!path.startsWith(resolve('dist') + '/')) { res.writeHead(404).end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PROGRESS_CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    // Keep browser evidence local; fonts use the existing system fallback.
    return url.origin === origin ? route.continue() : route.abort();
  });
  const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(origin + '/loom');
  await page.waitForURL('**/loom/hearth/');
  await page.waitForFunction(() => document.querySelector('#out-line')?.textContent.includes('Sam posted'));
  await noOverflow();
  assert.equal(await page.getByRole('link', { name: 'Full Loom' }).count(), 1);
  await page.screenshot({ path: resolve(out, 'hearth-mobile.png') });
  await page.getByRole('link', { name: 'Full Loom' }).click();
  await page.waitForURL('**/loom#directory');
  assert.equal(await page.locator('#app').getAttribute('data-tab'), 'directory');

  await page.evaluate(() => localStorage.setItem('loom.name', 'tester'));
  await page.goto(origin + '/loom/for/mike');
  await page.waitForURL('**/loom?for=mike#for-you');
  await page.waitForFunction(() => document.querySelector('#fyNew')?.textContent.includes('quiet since your last visit'));
  assert.equal(await page.locator('.tiles, .tile').count(), 0);
  assert.equal(await page.locator('.upnext .gate').count(), 1);
  assert.equal(await page.locator('#fyp-yes').evaluate(el => el.open), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('loom.name')), 'tester');
  // Use a first visit for the screenshot so the shared activity sentence is visible.
  await page.evaluate(() => localStorage.removeItem('hearth.seenAt'));
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#fyNew')?.textContent.includes('Sam posted'));
  await noOverflow();
  await page.screenshot({ path: resolve(out, 'for-you-mobile.png') });
  await page.locator('#fyp-yes summary').click();
  assert.equal(await page.locator('#fyp-yes').evaluate(el => el.open), true);

  await page.goto(origin + '/loom?to=%23loom-v2#' + lead.message.id);
  await page.locator('#msg-' + lead.message.id).waitFor();
  assert.equal(new URL(page.url()).pathname, '/loom');
  await page.goto(origin + '/loom/classic');
  assert.equal(new URL(page.url()).pathname, '/loom/classic');
  assert.equal((await page.request.get(origin + '/loom.json')).status(), 200);

  quiet = true;
  await page.goto(origin + '/loom/for/mike');
  await page.waitForFunction(() => document.querySelector('#fyNew')?.textContent.includes('quiet for the past day'));
  assert.equal(await page.locator('.tiles, .tile').count(), 0);
  failed = true;
  await page.reload();
  await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
  assert.match(await page.locator('#fyNew').textContent(), /couldn’t read/);
  failed = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#fyNew')?.textContent.includes('quiet for the past day'));
  assert.deepEqual(writes, [], 'browser checks do not write to the board');
  assert.deepEqual(errors, []);
  console.log('PASS: 390x844 Hearth and For You; Full Loom; one leading ask; folded extra asks; saved identity; message deep link; classic and JSON routes; quiet/error/retry recap; no overflow, browser errors or writes.');
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}

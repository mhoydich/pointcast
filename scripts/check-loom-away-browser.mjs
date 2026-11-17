/** Local GET-only browser harness, in-memory API; never contacts the live board. */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { handleLoom } from '../src/lib/loom/service.mjs';
const modulePath = process.env.PROGRESS_PLAYWRIGHT_MODULE;
const { chromium } = modulePath ? await import(pathToFileURL(modulePath).href) : await import('playwright-core');
const out = resolve(process.argv[2] || '/tmp/loom-away-proof'); mkdirSync(out, {recursive:true});
const source = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const between = (a, b) => { const start = source.indexOf(a) + a.length; return source.slice(start, source.indexOf(b, start)); };
const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + between('<style is:inline>', '</style>') + '</style></head><body>' + between('<body>', '<script is:inline>') + '<script>' + between('<script is:inline>', '</script>') + '</script></body></html>';
const map = new Map(); const kv = { get: async k => map.get(k) ?? null, put: async (k,v) => map.set(k,v) };
const seed = async (to, from, body) => {
  const res = await handleLoom(new Request('https://pointcast.xyz/api/loom', {method:'POST', body:JSON.stringify({to, from, kind:'note', body})}), {kv, firstHelloEnabled:false});
  assert.equal(res.status, 201); return (await res.json()).message.id;
};
const chief = {name:'Chief', kind:'agent', address:'@chief'};
const sourceId = await seed('@chief', chief, 'CARD\nI am an AI agent.\nAvailability: on-demand');
await seed('@chief', {name:'Human reader', kind:'human'}, 'Please read this on your next visit.');
await seed('#away-review', {name:'Human reader', kind:'human'}, '@chief, please read this on your next visit.');
await seed('#away-review', {name:'Human reader', kind:'human'}, '@unknown, no cadence declared.');
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') { res.writeHead(405).end(); return; }
    if (req.url.startsWith('/api/loom')) {
      const response = await handleLoom(new Request('https://pointcast.xyz' + req.url), {kv});
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
    }
    if (req.url === '/loom-availability.mjs') { res.writeHead(200, {'content-type':'text/javascript; charset=utf-8'}).end(readFileSync(new URL('../public/loom-availability.mjs', import.meta.url))); return; }
    if (req.url.startsWith('/loom')) { res.writeHead(200, {'content-type':'text/html; charset=utf-8'}).end(html); return; }
    res.writeHead(404).end();
  } catch (error) { res.writeHead(500).end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.PROGRESS_CHROMIUM_PATH || '/usr/bin/chromium', headless:true, args:['--no-sandbox']});
  for (const viewport of [{width:1440,height:1000}, {width:390,height:844}]) {
    const page = await browser.newPage({viewport}); const errors = []; const writes = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('request', r => { if(r.method() !== 'GET') writes.push(r.method()); });
    await page.goto(origin + '/loom?to=%40chief');
    await page.locator('#msgs .availability').first().waitFor();
    assert.match(await page.locator('#msgs .availability').first().textContent(), /@chief: Away · runs on demand \(self-reported\)/);
    assert.ok((await page.locator('#msgs .availability').first().getAttribute('href')).endsWith('#' + sourceId));
    await page.screenshot({path:resolve(out, `inbox-${viewport.width}.png`)});
    await page.goto(origin + '/loom?to=%23away-review');
    await page.locator('#msgs .availability').waitFor();
    console.log(JSON.stringify(await page.locator('#threadSum').textContent()));
    assert.equal(await page.locator('#msgs .availability').count(), 1);
    assert.ok(!(await page.locator('#msgs').textContent()).includes('@unknown: Away'));
    await page.screenshot({path:resolve(out, `topic-${viewport.width}.png`)});
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    await page.close();
  }
  console.log('PASS: desktop + phone inbox/topic, linked self-report, unknown stays unmarked, GET-only, no page errors.');
} finally { if(browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('../src/components/PrayerLedger.astro', import.meta.url), 'utf8');
const markup = source.slice(source.indexOf('<section class="prayer-ledger"'), source.indexOf('\n<script>'))
  .replace('data-station={station}', 'data-station="still-light"').replace('{label}', 'Add one quiet prayer');
const bundle = await build({ entryPoints: [new URL('../src/lib/prayer-ledger-client.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', globalName: 'Ledger', platform: 'browser' });
const flush = () => new Promise(resolve => setImmediate(resolve));
const view = { ok: true, storageAvailable: true, prayer: { total: 31 }, drumAltar: { week: 202644, total: 7 } };
function fixture(t, fetcher, station = 'still-light') {
  const dom = new JSDOM(`<input id="private" value="A private name"><button id="amen">Amen</button>${markup.replace('data-station="still-light"', `data-station="${station}"`)}`, { url: 'https://pointcast.test/', runScripts: 'outside-only' });
  const w = dom.window; const calls = [];
  Object.defineProperty(w.crypto, 'randomUUID', { value: () => '00000000-0000-4000-8000-000000000001' });
  w.fetch = async (url, init) => { calls.push({ url, init }); return fetcher(url, init); };
  const init = w.eval(bundle.outputFiles[0].text + '\nLedger.initializePrayerLedgers');
  init();
  t.after(() => { w.document.dispatchEvent(new w.Event('astro:before-swap')); w.close(); });
  return { w, calls, init, button: w.document.querySelector('[data-ledger-offer]'), count: w.document.querySelector('[data-ledger-count]'), altar: w.document.querySelector('[data-ledger-altar]'), status: w.document.querySelector('[data-ledger-status]') };
}
const json = body => ({ ok: true, json: async () => body });

test('separate counts are shown; no submission on arrival or Amen', async t => {
  const f = fixture(t, async () => json(view));
  f.init(); f.w.document.querySelector('#amen').click(); await flush();
  assert.equal(f.calls.length, 1);
  assert.match(f.count.textContent, /31 prayer actions/);
  assert.match(f.altar.textContent, /7 tributes/);
  assert.doesNotMatch(f.count.textContent, /38/);
});

test('manual double tap sends one anonymous offering with no personal text', async t => {
  let finish;
  const f = fixture(t, async url => url === '/api/prayer' ? new Promise(resolve => { finish = resolve; }) : json(view));
  await flush(); f.button.click(); f.button.click();
  assert.equal(f.button.disabled, true);
  const posts = f.calls.filter(call => call.url === '/api/prayer');
  assert.equal(posts.length, 1);
  assert.deepEqual(JSON.parse(posts[0].init.body), { station: 'still-light', sessionId: '00000000-0000-4000-8000-000000000001' });
  assert.doesNotMatch(posts[0].init.body, /private|name/i);
  finish(json({ ok: true })); await flush();
  assert.match(f.status.textContent, /recorded/);
  f.button.click(); assert.equal(f.calls.filter(call => call.url === '/api/prayer').length, 1);
});

test('unavailable read does not show zero and uncertain write is never retried', async t => {
  const f = fixture(t, async url => { if (url === '/api/prayer') throw new Error('offline'); return { ok: false }; });
  await flush(); assert.match(f.count.textContent, /unavailable/); assert.match(f.altar.textContent, /unavailable/);
  f.button.click(); await flush();
  assert.match(f.status.textContent, /could not confirm/);
  f.button.click(); assert.equal(f.calls.filter(call => call.url === '/api/prayer').length, 1);
});

test('remembering uses its own station', async t => {
  const f = fixture(t, async url => json(url === '/api/prayer' ? { ok: true } : view), 'remembering');
  f.button.click(); await flush();
  assert.equal(JSON.parse(f.calls.find(call => call.url === '/api/prayer').init.body).station, 'remembering');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const page = await readFile(new URL('../src/pages/still-light.astro', import.meta.url), 'utf8');
const art = JSON.parse(await readFile(new URL('../src/data/still-light-art.json', import.meta.url), 'utf8'));
const markup = page.slice(page.indexOf('<div class="sl"'), page.indexOf('  <script>')).replace(/\{artwork.map[\s\S]*?<\/option>\)\}/, art.map(a => `<option value="${a.id}">${a.title}</option>`).join(''));
const bundle = await build({ entryPoints: [new URL('../src/lib/still-light-client.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', globalName: 'StillLight', platform: 'browser' });
function fixture(t, reduced = false) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/still-light/', pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  const query = new w.EventTarget(); query.matches = reduced;
  w.matchMedia = () => query;
  let contexts = 0; const oscillators = []; const gains = [];
  const parameter = () => ({ value: 0, events: [], setValueAtTime(value, time) { this.events.push({ value, time }); }, exponentialRampToValueAtTime(value, time) { this.events.push({ value, time }); } });
  const node = () => ({ connect() {}, disconnect() {}, gain: parameter() });
  class Audio {
    constructor() { contexts++; this.currentTime = 2; this.state = 'running'; this.destination = {}; }
    createGain() { const gain = node(); gains.push(gain); return gain; }
    createDynamicsCompressor() { return { ...node(), threshold: parameter(), ratio: parameter() }; }
    createOscillator() { const oscillator = { ...node(), frequency: parameter(), started: false, stopped: false, start() { this.started = true; }, stop(time) { if (!time) { this.stopped = true; this.onended?.(); } } }; oscillators.push(oscillator); return oscillator; }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async close() { this.state = 'closed'; }
  }
  w.AudioContext = Audio;
  const init = w.eval(bundle.outputFiles[0].text + '\nStillLight.initializeStillLight');
  const controller = init();
  t.after(() => { controller.dispose(); w.close(); });
  return { w, doc: w.document, init, query, oscillators, gains, contexts: () => contexts, q: id => w.document.getElementById(`sl-${id}`), flush: () => new Promise(resolve => setImmediate(resolve)) };
}
test('arrival and silent interactions create no audio; candle toggles survive duplicate initialization', t => {
  const f = fixture(t); f.init();
  assert.equal(f.contexts(), 0);
  const candle = f.doc.querySelector('[data-candle]');
  candle.click(); assert.equal(candle.getAttribute('aria-pressed'), 'true');
  assert.equal(candle.getAttribute('aria-label'), 'Candle for yourself');
  candle.click(); assert.equal(candle.getAttribute('aria-pressed'), 'false');
  f.q('amen').click(); assert.equal(f.q('closing').hidden, false);
  assert.equal(f.contexts(), 0);
});
test('private names stay text, prayer changes work, and selecting a view updates responsive images', t => {
  const f = fixture(t);
  f.q('name').value = '<img src=x onerror=alert(1)>';
  f.q('name').dispatchEvent(new f.w.Event('input'));
  assert.equal(f.q('dedication').querySelector('img'), null);
  assert.match(f.q('dedication').textContent, /<img src=x/);
  f.q('prayer-kind').value = 'caregivers'; f.q('prayer-kind').dispatchEvent(new f.w.Event('change'));
  assert.match(f.q('prayer-text').textContent, /those who care for others/);
  f.q('art-kind').value = 'fishing-print'; f.q('art-kind').dispatchEvent(new f.w.Event('change'));
  assert.match(f.q('art').src, /fishing-print\.webp$/);
  assert.match(f.q('art').srcset, /fishing-print-480\.webp/);
  assert.equal(f.w.localStorage.length, 0);
});
test('reduced motion begins paused and water never creates accumulating ripples', t => {
  const f = fixture(t, true);
  assert.equal(f.q('motion').getAttribute('aria-pressed'), 'true');
  assert.equal(f.doc.querySelector('#still-light').dataset.motion, 'paused');
  for (let i = 0; i < 20; i++) f.q('water').click();
  assert.equal(f.q('water').querySelectorAll('.sl-ripple').length, 1);
});
test('only explicit sound activation permits Amen audio; mute stops active oscillators', async t => {
  const f = fixture(t);
  f.q('sound').click(); await f.flush();
  assert.equal(f.contexts(), 1);
  assert.equal(f.oscillators.length, 0, 'activation itself is silent');
  f.q('amen').click(); await f.flush();
  assert.ok(f.oscillators.some(o => o.started));
  f.q('sound').click();
  assert.ok(f.oscillators.every(o => o.stopped));
  const count = f.oscillators.length;
  f.q('amen').click(); await f.flush();
  assert.equal(f.oscillators.length, count);
});
test('pending audio cannot start after mute, and bfcache return keeps candle controls', async t => {
  const f = fixture(t);
  f.q('sound').click(); f.q('amen').click(); f.q('sound').click(); await f.flush();
  assert.equal(f.oscillators.length, 0);
  const hide = new f.w.Event('pagehide'); Object.defineProperty(hide, 'persisted', { value: true });
  f.w.dispatchEvent(hide);
  const candle = f.doc.querySelector('[data-candle]'); candle.click();
  assert.equal(candle.getAttribute('aria-pressed'), 'true');
});

test('chime schedules quiet voices and mute cancels even the later strikes', async t => {
  const f = fixture(t);
  f.q('tone').value = 'chime';
  f.q('sound').click(); await f.flush();
  f.q('amen').click(); await f.flush();
  assert.equal(f.oscillators.length, 9);
  assert.equal(f.gains[0].gain.value, .12);
  for (const gain of f.gains.slice(1)) {
    const [start, peak, end] = gain.gain.events;
    assert.ok(peak.time - start.time >= .089);
    assert.ok(peak.value <= .28 / 3);
    assert.ok(end.time - start.time > 4);
  }
  f.q('sound').click();
  assert.ok(f.oscillators.every(oscillator => oscillator.stopped));
});

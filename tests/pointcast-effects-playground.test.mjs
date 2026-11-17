import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const html = readFileSync(new URL('../public/offered-light-lab/effects-lab.html', import.meta.url), 'utf8');
const scripts = ['../public/pointcast-effects/v0.1.0/pointcast-effects.js', '../public/pointcast-effects/v0.1.0/visual-effects.js', '../public/offered-light-lab/artworks.js'].map(p => readFileSync(new URL(p, import.meta.url), 'utf8'));
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function setup() {
  const dom = new JSDOM(html, { url: 'https://example.test/effects-lab.html', runScripts: 'outside-only' });
  const { window: w } = dom; let calls = 0, requests = 0, hidden = false; const contexts = [], media = { matches: false, addEventListener() {} };
  w.matchMedia = () => media; w.fetch = () => { requests++; throw Error('unexpected network'); };
  Object.defineProperty(w.document, 'hidden', { get: () => hidden });
  Object.defineProperty(w.document, 'visibilityState', { get: () => hidden ? 'hidden' : 'visible' });
  w.HTMLImageElement.prototype.decode = () => Promise.resolve();
  const param = () => ({ value: 0, setValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {} });
  w.AudioContext = class {
    constructor() { calls++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.oscillators = []; contexts.push(this); }
    createGain() { return { ...node(), gain: param() }; }
    createDynamicsCompressor() { return { ...node(), threshold: {}, knee: {}, ratio: {}, attack: {}, release: {} }; }
    createOscillator() { const o = { ...node(), frequency: param(), addEventListener() {}, start() {}, stop() {} }; this.oscillators.push(o); return o; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  };
  for (const source of [...scripts, inline]) w.eval(source);
  return { dom, w, contexts, get calls() { return calls; }, get requests() { return requests; }, hide() { hidden = true; w.document.dispatchEvent(new w.Event('visibilitychange')); }, show() { hidden = false; w.document.dispatchEvent(new w.Event('visibilitychange')); } };
}
test('playground integrates sound, candle, ripple, stillness, artwork and background', async () => {
  const f = setup(), { w } = f, d = w.document, el = id => d.getElementById(id);
  try {
    assert.equal(f.calls, 0); assert.equal(el('lab-ring').disabled, true);
    el('lab-candle').click(); assert.equal(el('lab-candle').getAttribute('aria-pressed'), 'true'); assert.equal(el('lab-candle-root').dataset.lit, 'true'); assert.equal(f.calls, 0);
    el('lab-water').getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 60 });
    el('lab-water').dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, clientX: 40, clientY: 50, button: 0 }));
    const ripple = el('lab-water').querySelector('.pointcast-ripple'); assert.equal(ripple.style.left, '30px'); assert.equal(ripple.style.top, '30px');
    el('lab-still').click(); assert.equal(el('effects-lab').dataset.still, 'true'); assert.equal(el('lab-water').querySelector('.pointcast-ripple'), null);
    d.querySelector('[data-lab-art="garden"]').click(); await tick(); assert.match(el('lab-art').src, /assets\/mj-garden\.webp$/); assert.equal(el('lab-art').alt, 'A delicate green plant against luminous blocks of pink, yellow, mint and lavender.');
    w.HTMLImageElement.prototype.decode = () => Promise.reject(new Error('decode failed'));
    d.querySelector('[data-lab-art="dusk"]').click(); await tick();
    assert.match(el('lab-art').src, /assets\/mj-garden\.webp$/);
    assert.equal(d.querySelector('[data-lab-art="garden"]').getAttribute('aria-pressed'), 'true');
    assert.equal(d.querySelector('[data-lab-art="dusk"]').getAttribute('aria-pressed'), 'false');
    assert.equal(JSON.parse(el('lab-recipe').textContent).artwork, 'garden');
    assert.match(el('lab-art-status').textContent, /could not be loaded/);
    el('lab-audio').click(); await tick(); assert.equal(f.calls, 1); assert.equal(el('lab-ring').disabled, false);
    el('lab-ring').click(); assert.equal(f.contexts[0].oscillators.length, 3);
    f.hide(); assert.equal(f.contexts[0].state, 'closed'); assert.equal(el('lab-ring').disabled, true);
    f.show(); await tick(); assert.equal(f.calls, 1); assert.equal(el('lab-ring').disabled, true);
    el('lab-audio').click(); await tick(); assert.equal(f.calls, 2); el('lab-stop').click(); assert.equal(el('lab-ring').disabled, true);
    assert.equal(f.requests, 0);
  } finally { w.dispatchEvent(new w.Event('pagehide')); f.dom.window.close(); }
});

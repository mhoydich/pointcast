// Behavioural tests for the Layers Radio hooks in public/js/pc-layers.js (a site-wide script).
// Runs the real file in jsdom with a recording 2d context and a manual animation-frame queue.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('../public/js/pc-layers.js', import.meta.url), 'utf8');

async function boot({ url = 'https://pointcast.xyz/shortwave', footer = true, saved } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    ${footer ? '<div class="fb__right"><span class="other"></span></div>' : ''}
    <input id="page-field"></body></html>`, { url, runScripts: 'outside-only', pretendToBeVisual: false });
  const w = dom.window;
  const calls = [];
  const ctx2d = new Proxy({}, {
    get: (_, k) => {
      if (k === 'createLinearGradient') return () => { const g = { stops: [], addColorStop(o, c) { g.stops.push(c); } }; calls.push({ op: 'gradient', g }); return g; };
      if (k === 'createPattern') return () => ({});
      if (k === 'createImageData') return (x, y) => ({ data: new Uint8ClampedArray(x * y * 4) });
      if (k === 'fillRect') return () => calls.push({ op: 'fillRect' });
      return () => {};
    },
    set: () => true,
  });
  w.HTMLCanvasElement.prototype.getContext = () => ctx2d;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  const rafQueue = [];
  w.requestAnimationFrame = fn => { rafQueue.push(fn); return rafQueue.length; };
  const frames = (n = 1) => { for (let i = 0; i < n; i++) { const q = rafQueue.splice(0); q.forEach(fn => fn(w.performance.now())); } };
  if (saved) w.localStorage.setItem('pc-layers-v1', JSON.stringify(saved));
  const stops = [];
  w.addEventListener('pcl:stop', e => stops.push(e.detail.reason));
  w.eval(SRC);
  if (w.document.readyState === 'loading') await new Promise(r => w.document.addEventListener('DOMContentLoaded', r, { once: true }));
  const L = w.PCLayers;
  const drawnSince = mark => calls.slice(mark).filter(c => c.op === 'gradient').map(c => c.g.stops[0] || '');
  return { dom, w, L, calls, frames, drawnSince, stops, doc: w.document };
}
const key = (w, target, k) => target.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true }));
const tick = () => new Promise(r => setTimeout(r, 20));

test('without ?radio=1 nothing Radio-related appears and the deck has no panel', async () => {
  const { L, doc, w } = await boot();
  assert.equal(L.radio, false);
  const badge = doc.querySelector('.pcl-chip .pcl-badge');
  assert.equal(badge.hidden, true);
  doc.querySelector('.pcl-chip').click();
  await tick();
  assert.equal(doc.querySelectorAll('[data-pcl-panel]').length, 0);
  assert.equal(w.sessionStorage.getItem('pc-layers-radio'), null);
  assert.ok(doc.querySelector('.fb__right').firstElementChild.classList.contains('pcl-chip'), 'chip still mounts first in the footer bar');
});

test('?radio=1 turns the flag on for this tab, shows a RADIO badge, and a failed module load leaves Layers working', async () => {
  const { L, doc, w } = await boot({ url: 'https://pointcast.xyz/shortwave?radio=1' });
  assert.equal(L.radio, true);
  assert.equal(w.sessionStorage.getItem('pc-layers-radio'), '1');
  const badge = doc.querySelector('.pcl-chip .pcl-badge');
  assert.equal(badge.hidden, false); assert.equal(badge.textContent, 'RADIO');
  doc.querySelector('.pcl-chip').click();                    // opening the deck lazy-loads Radio; jsdom cannot import() it
  await tick(); await tick();
  const panel = doc.querySelector('[data-pcl-panel="radio"]');
  assert.ok(panel, 'fallback panel mounted');
  assert.match(panel.textContent, /Radio could not load\. Everything else in Layers still works\./);
  assert.ok(doc.querySelector('.pcl-deck [data-air]'), 'the rest of the deck rendered');
});

test('?radio=0 turns the flag back off', async () => {
  const a = await boot({ url: 'https://pointcast.xyz/?radio=1' });
  assert.equal(a.L.radio, true);
  a.w.history.replaceState(null, '', '/?radio=0');
  a.w.eval('delete window.PCLayers');
  a.w.eval(SRC);
  assert.equal(a.w.PCLayers.radio, false);
});

test('mood overlay paints the mood hue even with Sky off, ends on expiry of its own token only, never saves', async () => {
  const saved = { band: 7.2, master: 0.7, layers: { sky: { on: false, level: 0.4 } } };
  const { L, frames, calls, drawnSince, w } = await boot({ saved });
  const before = w.localStorage.getItem('pc-layers-v1');
  frames(1);
  let mark = calls.length;
  const t1 = L.mood({ hue: 325, sky: 0.55, ms: 30000 });
  frames(1);
  assert.ok(drawnSince(mark).some(s => s.startsWith('hsla(325')), 'wash drawn in the mood hue');
  const t2 = L.mood({ hue: 205, ms: 30000 });                // a later mood replaces the slot
  assert.equal(L.clearMood(t1), false, 'a replaced token cannot clear the new mood');
  mark = calls.length; frames(1);
  assert.ok(drawnSince(mark).some(s => s.startsWith('hsla(205')));
  assert.equal(L.clearMood(t2), true);
  mark = calls.length; frames(1);
  assert.equal(drawnSince(mark).length, 0, 'no wash after clearing (Sky is off)');
  assert.equal(w.localStorage.getItem('pc-layers-v1'), before, 'nothing about the mood was saved');
  // expiry
  const t3 = L.mood({ hue: 90, ms: 500 });
  await new Promise(r => setTimeout(r, 650));
  assert.equal(L.clearMood(t3), false, 'already expired');
});

test('manual Layers edits end a mood; panel controls do not', async () => {
  const { L, doc, frames, calls, drawnSince, w } = await boot();
  const el = doc.createElement('div'); el.innerHTML = '<input class="note"><button class="send">SEND</button>';
  L.addPanel({ id: 'radio', title: 'Radio · trial', el });
  doc.querySelector('.pcl-chip').click();
  L.mood({ hue: 325, ms: 30000 });
  const note = doc.querySelector('[data-pcl-panel="radio"] .note');
  note.dispatchEvent(new w.Event('input', { bubbles: true }));
  doc.querySelector('[data-pcl-panel="radio"] .send').click();
  let mark = calls.length; frames(1);
  assert.ok(drawnSince(mark).some(s => s.startsWith('hsla(325')), 'panel typing and clicks leave the mood alone');
  doc.querySelector('.pcl-deck [data-sw="grain"]').click();   // a manual edit
  mark = calls.length; frames(1);
  assert.ok(!drawnSince(mark).some(s => s.startsWith('hsla(325')), 'manual edit ended the mood');
  // band slider (an input) also ends it
  L.mood({ hue: 90, ms: 30000 });
  const band = doc.querySelector('.pcl-deck [data-band]');
  band.value = '8'; band.dispatchEvent(new w.Event('input', { bubbles: true }));
  mark = calls.length; frames(1);
  assert.ok(!drawnSince(mark).some(s => s.startsWith('hsla(90')));
});

test('Escape stops Radio from anywhere; inside the deck it now closes the deck too; page fields keep their Escape', async () => {
  const { L, doc, w, stops } = await boot();
  doc.querySelector('.pcl-chip').click();
  const deck = doc.querySelector('.pcl-deck');
  // Escape inside a deck range input used to be swallowed
  key(w, deck.querySelector('[data-band]'), 'Escape');
  assert.equal(deck.hidden, true, 'deck closed from inside its own input');
  assert.deepEqual(stops, ['escape']);
  // Escape in a page field: Radio still stops, but the deck is not closed from there
  doc.querySelector('.pcl-chip').click();
  L.mood({ hue: 325, ms: 30000 });
  key(w, doc.getElementById('page-field'), 'Escape');
  assert.equal(deck.hidden, false, 'page field Escape does not close the deck');
  assert.deepEqual(stops, ['escape', 'escape']);
  assert.equal(L.clearMood(), false, 'mood already ended by Escape');
});

test('the Off preset stops Radio', async () => {
  const { doc, stops } = await boot();
  doc.querySelector('.pcl-chip').click();
  doc.querySelector('.pcl-deck [data-pre="Off"]').click();
  assert.deepEqual(stops, ['off']);
});

test('panels survive deck re-renders and keep their element', async () => {
  const { L, doc } = await boot();
  const el = doc.createElement('div'); el.className = 'mine';
  L.addPanel({ id: 'radio', title: 'Radio · trial', el });
  doc.querySelector('.pcl-chip').click();
  doc.querySelector('.pcl-deck [data-pre="Quiet"]').click();   // presets re-render the deck
  assert.equal(doc.querySelectorAll('[data-pcl-panel="radio"]').length, 1);
  assert.equal(doc.querySelector('[data-pcl-panel="radio"] .mine'), el);
  assert.equal(doc.querySelector('[data-pcl-panel="radio"] h4').textContent, 'RADIO · TRIAL');
});

test('soft navigation (astro:after-swap) re-mounts the chip, deck, canvas and styles', async () => {
  const { doc, w } = await boot();
  doc.querySelector('.pcl-chip').click();
  // ClientRouter swaps <body> and prunes injected <head> nodes
  doc.head.querySelectorAll('style').forEach(s => s.remove());
  doc.body.innerHTML = '<div class="fb__right"></div><main>next page</main>';
  assert.equal(doc.querySelector('.pcl-chip'), null);
  doc.dispatchEvent(new w.Event('astro:after-swap'));
  assert.ok(doc.querySelector('.fb__right .pcl-chip'), 'chip back in the new footer bar');
  assert.ok(doc.querySelector('body > .pcl-deck') && doc.querySelector('body > .pcl-canvas'));
  assert.ok([...doc.head.querySelectorAll('style')].some(s => s.textContent.includes('.pcl-chip')), 'styles re-injected');
  assert.equal(doc.querySelector('.pcl-deck').hidden, false, 'an open deck stays open');
});

test('no footer bar: the chip floats, and duck() is a safe no-op before ON AIR', async () => {
  const { L, doc } = await boot({ footer: false });
  assert.ok(doc.querySelector('body > .pcl-chip.pcl-float'));
  assert.doesNotThrow(() => L.duck(3));
});

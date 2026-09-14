import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const compiled = await build({ entryPoints: [fileURLToPath(new URL('../src/lib/nouns-flow-ui.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022' });
const { mountNounsFlow } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const source = readFileSync(new URL('../src/pages/co-games/flow.astro', import.meta.url), 'utf8');
const markup = source.match(/<article class="starjam-page">[\s\S]*?<\/article>/)[0];
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture(t, { reduced = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games/flow', pretendToBeVisual: true });
  const win = dom.window, doc = win.document, root = doc.getElementById('nouns-flow');
  const q = selector => root.querySelector(selector);
  q('.flow-world-grid').innerHTML = '<button data-flow-world="garden">Garden</button><button data-flow-world="rush">Moon</button>';
  let now = 0, hidden = false, frameId = 0;
  const frames = new Map(), events = [];
  t.mock.method(win.performance, 'now', () => now);
  Object.defineProperty(doc, 'hidden', { get: () => hidden });
  const motion = new win.EventTarget(); motion.matches = reduced;
  win.matchMedia = () => motion;
  win.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  win.cancelAnimationFrame = id => frames.delete(id);
  win.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new win.Event('close')); };
  for (const type of ['nouns-flow:start', 'nouns-flow:pause', 'nouns-flow:finish', 'nouns-flow:world', 'nouns-drip:pop']) root.addEventListener(type, event => events.push({ type, detail: event.detail }));
  let mounted = true; const unmount = mountNounsFlow(root);
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  t.after(() => { cleanup(); win.close(); });
  const frame = time => { now = time; const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(time); };
  const at = time => { now = time; };
  const tap = button => button.dispatchEvent(new win.MouseEvent('pointerdown', { button: 0, bubbles: true }));
  const key = (key, fields = {}) => doc.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, ...fields }));
  const nouns = () => [...root.querySelectorAll('[data-drip-noun]')];
  const hide = value => { hidden = value; doc.dispatchEvent(new win.Event('visibilitychange')); };
  return { win, doc, root, q, frames, events, motion, frame, at, tap, key, nouns, hide, cleanup };
}

test('Drip is the explicit initial mode and Start makes its first three Nouns immediately tappable', t => {
  const f = fixture(t);
  assert.equal(f.root.dataset.mode, 'drip');
  assert.equal(f.q('[data-flow-mode="drip"]').getAttribute('aria-pressed'), 'true');
  assert.equal(f.q('[data-flow-start]').textContent, 'Let it drip!');
  assert.equal(f.frames.size, 0);
  assert.equal(f.nouns().length, 3);
  assert.ok(f.nouns().every(button => button.disabled));
  f.q('[data-flow-start]').click();
  assert.equal(f.frames.size, 1);
  assert.ok(f.nouns().every(button => !button.disabled));
  f.tap(f.nouns()[0]);
  assert.equal(f.q('[data-flow-score]').textContent, '1');
  assert.equal(f.events.filter(event => event.type === 'nouns-drip:pop')[0].detail.nodeId, '0');
});

test('newly falling Nouns pop at any height, distinct rapid taps count, and one Noun never counts twice', t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click(); f.frame(1000);
  const falling = f.nouns().at(-1), second = f.nouns()[0];
  assert.equal(falling.style.top, '6%');
  f.tap(falling); f.tap(second); f.tap(second); second.click();
  assert.equal(f.q('[data-flow-score]').textContent, '2');
  assert.equal(f.events.filter(event => event.type === 'nouns-drip:pop').length, 2);
  assert.equal(f.q('[data-drip-particles]').children.length, 1);
  for (let time = 2000; time < 12000; time += 1000) f.frame(time);
  assert.equal(f.nouns().length, 6);
  assert.equal(f.q('[data-flow-score]').textContent, '2', 'waiting never deducts points');
});

test('keyboard columns and focused native clicks work; repeats are ignored and focus survives a pop', t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click();
  f.key('D', { repeat: true }); f.key('D', { ctrlKey: true });
  assert.equal(f.q('[data-flow-score]').textContent, '0');
  f.key('D'); f.key('2');
  assert.equal(f.q('[data-flow-score]').textContent, '2');
  const last = f.nouns()[0]; last.focus(); last.click();
  assert.equal(f.q('[data-flow-score]').textContent, '3');
  assert.equal(f.doc.activeElement, f.q('[data-drip-canvas]'));
  f.key('Escape');
  assert.equal(f.root.dataset.state, 'paused');
});

test('pause, hidden pages and menus freeze active time and never auto-resume', async t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click(); f.frame(2000); f.q('[data-flow-pause]').click();
  const elapsed = f.root.dataset.flowElapsedMs;
  f.frame(100000); f.tap(f.nouns()[0]);
  assert.equal(f.root.dataset.flowElapsedMs, elapsed);
  assert.equal(f.q('[data-flow-score]').textContent, '0');
  assert.equal(f.frames.size, 0);
  f.q('[data-flow-start]').click(); f.frame(101000);
  assert.equal(f.root.dataset.flowElapsedMs, '3000');
  f.hide(true); assert.equal(f.root.dataset.state, 'paused');
  f.hide(false); assert.equal(f.root.dataset.state, 'paused');
  f.q('[data-flow-start]').click();
  f.q('dialog').open = true; await tick();
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.frames.size, 0);
});

test('a focused pop transfers focus to a Noun spawned in that same transition', t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click(); f.tap(f.nouns()[0]); f.tap(f.nouns()[0]);
  const last = f.nouns()[0]; last.focus();
  f.at(1000); last.click();
  assert.equal(f.nouns().length, 1);
  assert.equal(f.doc.activeElement, f.nouns()[0]);
});

test('Drip follows the native media clock through loading, buffering and explicit clock changes', t => {
  const f = fixture(t), media = f.q('[data-flow-track]');
  f.root.dataset.flowAudioClock = 'media';
  f.q('[data-flow-start]').click(); f.frame(60000);
  assert.equal(f.root.dataset.flowElapsedMs, '0');
  media.currentTime = 2; f.frame(60001);
  assert.equal(f.root.dataset.flowElapsedMs, '2000');
  f.frame(120000);
  assert.equal(f.root.dataset.flowElapsedMs, '2000');
  f.root.dataset.flowAudioClock = 'wall';
  f.root.dispatchEvent(new f.win.CustomEvent('nouns-flow:audio-clock'));
  f.frame(120500);
  assert.equal(f.root.dataset.flowElapsedMs, '2500');
});

test('reduced motion settles new Nouns without continuous travel and retains tappable buttons', t => {
  const f = fixture(t, { reduced: true });
  f.q('[data-flow-start]').click(); f.frame(1000);
  const newest = f.nouns().at(-1);
  assert.equal(newest.style.top, '30%');
  f.tap(newest);
  assert.equal(f.q('[data-flow-score]').textContent, '1');
  assert.match(source, /prefers-reduced-motion:reduce\)\{\.drip-particles\{display:none/);
});

test('a shower finishes once, focuses Encore, and reset starts with three fresh Nouns', t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click(); f.tap(f.nouns()[0]); f.frame(35000);
  assert.equal(f.root.dataset.state, 'won');
  assert.equal(f.frames.size, 0);
  assert.equal(f.q('[data-flow-result]').hidden, false);
  assert.equal(f.doc.activeElement, f.q('[data-flow-restart]'));
  f.frame(60000);
  assert.equal(f.events.filter(event => event.type === 'nouns-flow:finish').length, 1);
  f.q('[data-flow-restart]').click();
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.nouns().length, 3);
  assert.equal(f.q('[data-flow-score]').textContent, '0');
});

test('switching modes releases the prior loop and keeps rhythm and Drip independently usable', t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click(); f.tap(f.nouns()[0]);
  f.q('[data-flow-mode="rhythm"]').click();
  assert.equal(f.root.dataset.mode, 'rhythm');
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.nouns().length, 0);
  assert.equal(f.frames.size, 0);
  f.q('[data-flow-start]').click(); f.frame(1000);
  assert.equal(f.frames.size, 1);
  assert.ok(f.root.querySelectorAll('.flow-note').length > 0);
  f.q('[data-flow-mode="drip"]').click();
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.root.querySelectorAll('.flow-note').length, 0);
  assert.equal(f.nouns().length, 3);
  f.q('[data-flow-start]').click(); f.key('D');
  assert.equal(f.q('[data-flow-score]').textContent, '1');
  assert.equal(f.frames.size, 1);
  f.cleanup();
  assert.equal(f.nouns().length, 0); assert.equal(f.frames.size, 0);
  const count = f.events.length;
  f.q('[data-flow-start]').click(); f.key('D'); f.hide(true);
  assert.equal(f.events.length, count);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { coGameWorlds } from '../src/lib/co-games-worlds.ts';

const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/lib/co-games-worlds-ui.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
});
const { mountCoGamesWorlds } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const page = readFileSync(new URL('../src/pages/co-games.astro', import.meta.url), 'utf8');
const markup = page.match(/<article class="co-games-page">[\s\S]*?<\/article>/)[0];
const tick = () => new Promise(resolve => setImmediate(resolve));
const effectsKey = 'pointcast:co-games:effects';

function fixture(t, { storedEffects, reducedMotion = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games', pretendToBeVisual: true });
  const win = dom.window, root = win.document.getElementById('pointcast-co-games');
  const q = selector => root.querySelector(selector);
  const motion = new win.EventTarget();
  motion.matches = reducedMotion; motion.media = '(prefers-reduced-motion: reduce)';
  win.matchMedia = () => motion;
  if (storedEffects !== undefined) win.localStorage.setItem(effectsKey, storedEffects);
  const images = [];
  win.Image = class {
    onload = null; onerror = null; src = '';
    constructor() { images.push(this); }
  };
  const resizes = [];
  win.ResizeObserver = class {
    active = true;
    constructor(callback) { this.callback = callback; resizes.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.active = false; }
  };
  const timers = new Map();
  let timerId = 0;
  win.setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
  win.clearTimeout = id => timers.delete(id);
  root.dataset.encounter = 'garden'; root.dataset.busy = 'false';
  q('.cg-landscape').setAttribute('src', coGameWorlds.garden.src);
  Object.defineProperties(q('.cg-landscape'), { naturalWidth: { value: 1800 }, naturalHeight: { value: 900 } });
  const dimensions = { width: 1000, height: 450 };
  Object.defineProperties(q('.cg-stage'), {
    clientWidth: { get: () => dimensions.width }, clientHeight: { get: () => dimensions.height },
  });
  let unmount = mountCoGamesWorlds(root), mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  const remount = () => { cleanup(); unmount = mountCoGamesWorlds(root); mounted = true; };
  const visit = async id => { root.dataset.encounter = id; await tick(); };
  const setEffects = value => { q('[data-effects-control]').value = value; q('[data-effects-control]').dispatchEvent(new win.Event('change')); };
  const setMotion = value => { motion.matches = value; motion.dispatchEvent(new win.Event('change')); };
  t.after(() => { cleanup(); win.close(); });
  return { win, root, q, motion, images, resizes, timers, dimensions, cleanup, remount, visit, setEffects, setMotion };
}

test('the world picker exposes four distinct story destinations with accessible travel buttons', t => {
  const f = fixture(t);
  const cards = [...f.root.querySelectorAll('[data-visit-encounter]')];
  assert.deepEqual(cards.map(card => card.dataset.visitEncounter), ['garden', 'rush', 'shell', 'storm']);
  assert.deepEqual(cards.map(card => card.querySelector('strong').textContent), ['Lantern grove', 'Midnight diner', 'Tideglass ruins', 'Moon station']);
  assert.equal(new Set(cards.map(card => card.querySelector('img').src)).size, 4);
  for (const [index, card] of cards.entries()) {
    assert.equal(card.type, 'button');
    assert.equal(card.querySelector('small').textContent, `CHAPTER ${index + 1}`);
    assert.ok(card.querySelector('p').textContent.length > 20, 'each stop has a story');
    assert.equal(card.querySelector('img').alt, '', 'the adjacent world name labels its decorative image');
    assert.equal(card.getAttribute('aria-current'), String(index === 0));
    assert.equal(card.disabled, false);
  }
});

test('encounter changes update the story immediately but show each new landscape only after it loads', async t => {
  const f = fixture(t);
  for (const id of ['rush', 'shell', 'storm', 'garden']) {
    const before = f.q('.cg-landscape').getAttribute('src');
    await f.visit(id);
    const world = coGameWorlds[id];
    assert.equal(f.q('[data-world-name]').textContent, world.name);
    assert.equal(f.q('[data-world-story]').textContent, world.story);
    assert.equal(f.root.dataset.world, world.theme);
    assert.equal(f.q('.cg-landscape').getAttribute('src'), before, 'the visible scene survives while the next image loads');
    const loading = f.images.at(-1);
    assert.equal(loading.src, world.src);
    loading.onload();
    assert.equal(f.q('.cg-landscape').getAttribute('src'), world.src);
    assert.equal(f.root.classList.contains('cg-world-arrive'), true);
    assert.equal(f.root.querySelectorAll('[data-visit-encounter][aria-current="true"]').length, 1);
    assert.equal(f.q('[data-visit-encounter][aria-current="true"]').dataset.visitEncounter, id);
    assert.equal(f.timers.size, 1, 'a new arrival replaces the old animation timeout');
  }
});

test('a slow old image cannot overwrite a newer destination, including a return to the already-visible scene', async t => {
  const f = fixture(t);
  await f.visit('rush');
  const diner = f.images.at(-1), staleDinerLoad = diner.onload;
  await f.visit('shell');
  const tide = f.images.at(-1);
  assert.equal(diner.onload, null);
  assert.equal(diner.onerror, null);
  tide.onload();
  staleDinerLoad();
  assert.equal(f.q('.cg-landscape').getAttribute('src'), coGameWorlds.shell.src);
  assert.equal(f.q('[data-world-name]').textContent, 'Tideglass ruins');
  await f.visit('storm');
  const moon = f.images.at(-1), staleMoonLoad = moon.onload;
  await f.visit('shell');
  assert.equal(moon.onload, null);
  staleMoonLoad();
  assert.equal(f.q('.cg-landscape').getAttribute('src'), coGameWorlds.shell.src);
  assert.equal(f.q('[data-world-name]').textContent, 'Tideglass ruins');
});

test('busy AI turns disable every world entry and travel card without reloading the current scene', async t => {
  const f = fixture(t);
  f.root.dataset.busy = 'true'; await tick();
  const controls = [...f.root.querySelectorAll('[data-dialog="cg-worlds"],[data-visit-encounter]')];
  assert.ok(controls.length >= 5);
  assert.ok(controls.every(button => button.disabled));
  assert.equal(f.images.length, 0);
  assert.equal(f.q('[data-visit-encounter="garden"]').getAttribute('aria-current'), 'true');
  f.root.dataset.busy = 'false'; await tick();
  assert.ok(controls.every(button => !button.disabled));
  assert.equal(f.images.length, 0);
});

test('effects persist across remounts and device reduced motion overrides them without losing the preference', t => {
  const f = fixture(t, { storedEffects: 'full' });
  assert.equal(f.root.dataset.effects, 'full');
  assert.equal(f.q('[data-effects-control]').value, 'full');
  f.setMotion(true);
  assert.equal(f.root.dataset.effects, 'still');
  assert.equal(f.q('[data-effects-control]').value, 'full');
  assert.match(f.q('[data-motion-note]').textContent, /reduced-motion/);
  f.setEffects('gentle');
  assert.equal(f.root.dataset.effects, 'still');
  assert.equal(f.win.localStorage.getItem(effectsKey), 'gentle');
  f.setMotion(false);
  assert.equal(f.root.dataset.effects, 'gentle');
  f.setEffects('still'); f.remount();
  assert.equal(f.root.dataset.effects, 'still');
  assert.equal(f.q('[data-effects-control]').value, 'still');
  assert.equal(f.root.querySelectorAll('[data-visit-encounter]').length, 4);
});

test('invalid saved effects use gentle defaults while reduced motion is honored from first mount', t => {
  const f = fixture(t, { storedEffects: 'not-an-effect', reducedMotion: true });
  assert.equal(f.root.dataset.effects, 'still');
  assert.equal(f.q('[data-effects-control]').value, 'gentle');
  f.setMotion(false);
  assert.equal(f.root.dataset.effects, 'gentle');
});

test('image load and stage resize recompute a finite, bounded floor for the character feet', t => {
  const f = fixture(t);
  const floor = () => Number.parseFloat(f.root.style.getPropertyValue('--cg-floor-bottom'));
  const before = floor();
  assert.ok(Number.isFinite(before) && before >= 8 && before <= f.dimensions.height * .38);
  f.dimensions.width = 340; f.dimensions.height = 210;
  f.resizes[0].callback();
  assert.notEqual(floor(), before);
  assert.ok(floor() >= 8 && floor() <= f.dimensions.height * .38);
  f.dimensions.height = 240;
  f.q('.cg-landscape').dispatchEvent(new f.win.Event('load'));
  const resized = floor();
  assert.ok(Number.isFinite(resized) && resized >= 8 && resized <= f.dimensions.height * .38);
});

test('cleanup removes travel cards and stops pending images, timers, observers, and preference listeners', async t => {
  const f = fixture(t);
  await f.visit('rush'); f.images.at(-1).onload();
  assert.equal(f.timers.size, 1);
  await f.visit('shell');
  const pending = f.images.at(-1), queuedLoad = pending.onload;
  f.cleanup();
  assert.equal(pending.onload, null); assert.equal(pending.onerror, null);
  assert.equal(f.timers.size, 0);
  assert.equal(f.root.classList.contains('cg-world-arrive'), false);
  assert.equal(f.root.querySelectorAll('[data-visit-encounter]').length, 0);
  assert.ok(f.resizes.every(observer => !observer.active));
  const name = f.q('[data-world-name]').textContent;
  const source = f.q('.cg-landscape').getAttribute('src');
  const effects = f.root.dataset.effects;
  const floor = f.root.style.getPropertyValue('--cg-floor-bottom');
  queuedLoad(); await f.visit('storm');
  f.setEffects('full'); f.setMotion(true);
  f.dimensions.height = 200; f.win.dispatchEvent(new f.win.Event('resize'));
  f.q('.cg-landscape').dispatchEvent(new f.win.Event('load'));
  assert.equal(f.q('[data-world-name]').textContent, name);
  assert.equal(f.q('.cg-landscape').getAttribute('src'), source);
  assert.equal(f.root.dataset.effects, effects);
  assert.equal(f.win.localStorage.getItem(effectsKey), null);
  assert.equal(f.root.style.getPropertyValue('--cg-floor-bottom'), floor);
});

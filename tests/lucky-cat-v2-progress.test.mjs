import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { STORAGE_KEY, freshState, normalize, act } from '../public/lucky-cat/state.js';
import { CATS } from '../public/lucky-cat/catalog.js';

const PREFS_KEY = 'lucky-cat-v2-preferences';
const sceneFixture = `
function createScene(container, options = {}) {
  const record = globalThis.__sceneFixture = { designs: [], disposed: false };
  if (options.design) record.designs.push(options.design.id);
  return {
    setDesign(design) { record.designs.push(design.id); },
    setReducedMotion() {}, setMotion() {}, setPlaying() {},
    setLighting() {}, setFocus() {}, setOrbs() {}, catchSlot() { return false; },
    pet() {}, dispose() { record.disposed = true; }
  };
}
export const createSculptureScene = createScene;
export const createCatScene = createScene;
`;

async function bundleApp(version) {
  const path = version === 'v2' ? '../public/lucky-cat/v2/app.js' : '../public/lucky-cat/app.js';
  const result = await build({
    entryPoints: [new URL(path, import.meta.url).pathname],
    bundle: true, write: false, format: 'iife', platform: 'browser',
    plugins: [{
      name: 'human-progress-scene-fixture',
      setup(builder) {
        builder.onResolve({ filter: /(?:^|\/)(?:sculpture-scene|scene)\.js$/ }, () => ({ path: 'scene', namespace: 'fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: sceneFixture, loader: 'js' }));
      }
    }]
  });
  return result.outputFiles[0].text;
}

const [v2HTML, v1HTML, v2Bundle, v1Bundle] = await Promise.all([
  readFile(new URL('../src/lib/lucky-cat/v2-index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/lucky-cat/index.html', import.meta.url), 'utf8'),
  bundleApp('v2'), bundleApp('v1')
]);

async function until(predicate, diagnose) {
  const deadline = Date.now() + 15000;
  // A render can complete during a CPU stall. Check the observed state first.
  while (true) {
    if (predicate()) return;
    if (Date.now() >= deadline) throw new Error(`Human fixture did not become ready: ${JSON.stringify(diagnose())}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function fixture({ version = 'v2', saved = freshState() } = {}) {
  const dom = new JSDOM(version === 'v2' ? v2HTML : v1HTML, {
    url: `http://127.0.0.1:8814/lucky-cat/${version === 'v2' ? 'v2/' : ''}`,
    runScripts: 'outside-only'
  });
  const w = dom.window;
  const values = new Map([[STORAGE_KEY, JSON.stringify(saved)]]);
  const writes = [];
  const errors = [];
  const storage = {
    failWrites: false,
    getItem(key) { return values.get(String(key)) ?? null; },
    setItem(key, value) {
      writes.push({ key: String(key), value: String(value), failed: this.failWrites });
      if (this.failWrites) throw new w.DOMException('Storage quota exhausted', 'QuotaExceededError');
      values.set(String(key), String(value));
    }
  };
  Object.defineProperty(w, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(w, 'crypto', { configurable: true, value: webcrypto });
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  w.addEventListener('error', event => errors.push(event.error?.message || event.message));
  const doc = w.document;
  const luckSelector = version === 'v2' ? '#luck' : '#luck-balance';
  try {
    w.eval(version === 'v2' ? v2Bundle : v1Bundle);
    await until(() => doc.querySelectorAll('[data-goal]').length === saved.goals.length && doc.querySelector(luckSelector).textContent === String(saved.luck), () => ({
      luck: doc.querySelector(luckSelector)?.textContent,
      goals: doc.querySelectorAll('[data-goal]').length,
      errors
    }));
  } catch (error) {
    dom.window.close();
    throw error;
  }
  return {
    w, doc, storage, writes, values,
    luck() { return Number(doc.querySelector(luckSelector).textContent); },
    stored() { return JSON.parse(values.get(STORAGE_KEY)); },
    external(state) { values.set(STORAGE_KEY, JSON.stringify(state)); },
    close() {
      try { w.dispatchEvent(new w.Event('pagehide')); }
      finally { dom.window.close(); }
      assert.deepEqual(errors, [], 'Actual app event handlers must not throw');
    }
  };
}

function click(f, selector) {
  const element = f.doc.querySelector(selector);
  assert.ok(element, selector);
  assert.equal(element.disabled, false, `${selector} must be available`);
  element.click();
}
function goal(f, id) { return f.doc.querySelector(`[data-goal="${id}"]`); }
function sharedThirteen() {
  let state = act(freshState(), { type: 'surprise' }).state;
  state = act(state, { type: 'goal', id: state.goals[0].id }).state;
  assert.equal(state.luck, 13);
  return state;
}
function sharedCompanion() {
  const ocean = CATS.find(cat => cat.id === 'ocean');
  assert.ok(ocean, 'The existing Ocean identity remains in the real catalog');
  const state = freshState();
  state.luck = state.lifetimeLuck = ocean.cost + 33;
  const collected = act(state, { type: 'cat', id: ocean.id }).state;
  assert.equal(collected.luck, 33);
  return collected;
}
function cachedPageshow(f) {
  const event = new f.w.Event('pageshow');
  Object.defineProperty(event, 'persisted', { value: true });
  f.w.dispatchEvent(event);
}

// This catches the rollback caused by rereading stale storage after a quota error.
test('human v2 keeps both visit-only goals when reads work but writes fail', async () => {
  const initial = freshState();
  const f = await fixture({ saved: initial });
  try {
    assert.ok(f.writes.some(write => write.key === STORAGE_KEY && !write.failed), 'The initial snapshot was saved before storage failed');
    f.storage.failWrites = true;
    click(f, `[data-goal="${initial.goals[0].id}"]`);
    assert.equal(f.luck(), 5);
    click(f, `[data-goal="${initial.goals[1].id}"]`);
    assert.equal(f.luck(), 10);
    for (const item of initial.goals.slice(0, 2)) {
      assert.equal(goal(f, item.id).checked, true);
      assert.equal(goal(f, item.id).disabled, true);
    }
    assert.equal(f.doc.querySelectorAll('[data-goal]:checked').length, 2);
    assert.deepEqual(f.stored(), normalize(initial), 'The readable persisted snapshot remains stale; visit progress must not be replaced with it');
    assert.equal(f.writes.filter(write => write.key === STORAGE_KEY && write.failed).length, 2);
  } finally { f.close(); }
});

test('human v2 applies the next goal to the latest shared v1 snapshot', async () => {
  const f = await fixture();
  try {
    const latest = sharedThirteen();
    f.external(latest); // No storage event: dispatch itself must rebase the action.
    assert.equal(f.luck(), 0);
    click(f, `[data-goal="${latest.goals[1].id}"]`);
    assert.equal(f.luck(), 18);
    assert.equal(f.stored().luck, 18);
    assert.equal(f.stored().surpriseDay, latest.surpriseDay);
    assert.equal(goal(f, latest.goals[0].id).checked, true);
    assert.equal(goal(f, latest.goals[1].id).checked, true);
    assert.equal(f.stored().goals.filter(item => item.done).length, 2);
  } finally { f.close(); }
});

test('a human v2 wish-list target saves preferences without rewriting newer shared luck', async () => {
  const f = await fixture();
  try {
    click(f, '[data-cat="ocean"]');
    let latest = freshState();
    for (const score of [30, 30, 21]) latest = act(latest, { type: 'round', score, hits: score }).state;
    assert.equal(latest.luck, 33);
    assert.equal(latest.owned.includes('ocean'), false, 'The target is still available in the newer snapshot');
    f.external(latest);
    const before = f.writes.length;
    click(f, '#set-target');
    assert.equal(f.stored().luck, 33);
    assert.deepEqual(f.stored(), latest);
    assert.deepEqual(f.writes.slice(before).map(write => write.key), [PREFS_KEY]);
    assert.equal(JSON.parse(f.values.get(PREFS_KEY)).target, 'ocean');
    assert.equal(f.doc.querySelector('#cat-dialog').open, false);
  } finally { f.close(); }
});

test('a human v2 storage event refreshes balance and the selected companion', async () => {
  const f = await fixture();
  try {
    const latest = sharedCompanion();
    f.external(latest);
    const before = f.writes.length;
    f.w.dispatchEvent(new f.w.StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(latest) }));
    assert.equal(f.luck(), 33);
    assert.equal(f.doc.querySelector('#owned-count').textContent, '2');
    assert.equal(f.doc.querySelector('#cat-name').textContent, 'Ocean');
    assert.equal(f.w.__sceneFixture.designs.at(-1), 'ocean');
    assert.equal(f.writes.length, before, 'Reconciliation is read-only');
  } finally { f.close(); }
});

test('human v2 restores newer progress and its companion on a cached pageshow', async () => {
  const f = await fixture();
  try {
    const latest = sharedCompanion();
    f.external(latest);
    const before = f.writes.length;
    cachedPageshow(f);
    assert.equal(f.luck(), 33);
    assert.equal(f.doc.querySelector('#cat-name').textContent, 'Ocean');
    assert.equal(f.w.__sceneFixture.designs.at(-1), 'ocean');
    assert.equal(f.writes.length, before);
    assert.deepEqual(f.stored(), latest);
  } finally { f.close(); }
});

test('the cached legacy human page reads shared progress before its next goal', async () => {
  const f = await fixture({ version: 'v1' });
  try {
    const latest = sharedThirteen();
    f.external(latest);
    cachedPageshow(f);
    assert.equal(f.luck(), 13);
    assert.equal(goal(f, latest.goals[0].id).checked, true);
    click(f, `[data-goal="${latest.goals[1].id}"]`);
    assert.equal(f.luck(), 18);
    assert.equal(f.stored().luck, 18);
    assert.equal(f.doc.querySelectorAll('[data-goal]:checked').length, 2);
  } finally { f.close(); }
});

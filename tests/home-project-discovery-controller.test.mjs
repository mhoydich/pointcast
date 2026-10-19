import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { HOME_PROJECT_ROTATION_INTERVAL_MS, HOME_PROJECT_ROTATION_PAUSE_KEY, initializeHomeProjectRotation, initializeLatestProjectBrowser } from '../src/lib/home-project-discovery-controller.mjs';

function memoryStorage(initial) {
  const values = new Map(initial === undefined ? [] : [[HOME_PROJECT_ROTATION_PAUSE_KEY, initial]]);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

function page(t, { reduced = false, storage = memoryStorage() } = {}) {
  const panels = ['First, Second, Third', 'Fourth, Fifth, Sixth', 'Seventh, Eighth, First'].map((titles, index) => `<ol data-project-panel data-panel-titles="${titles}" data-active="${index === 0}" aria-hidden="${index !== 0}"${index === 0 ? '' : ' inert'}>${titles.split(', ').map((title, slot) => `<li><a href="/${title.toLowerCase()}/"${index === 0 ? slot === 0 ? ' tabindex="0"' : '' : ' tabindex="-1"'}>${title}</a></li>`).join('')}</ol>`).join('');
  const dom = new JSDOM(`<!doctype html><body><a id="outside" href="/outside/">Outside</a><section data-home-latest-projects>${panels}<div data-project-controls hidden><button data-project-previous>Previous</button><span data-project-counter>Set 1 of 3</span><button data-project-next>Next</button><button data-project-toggle>Pause rotation</button></div><p data-project-status role="status" aria-live="polite"></p></section>`, { url: 'https://pointcast.xyz/' });
  const { window } = dom;
  t.after(() => window.close());
  let visible = true;
  Object.defineProperty(window.document, 'visibilityState', { configurable: true, get: () => visible ? 'visible' : 'hidden' });
  const media = new window.EventTarget();
  media.matches = reduced;
  window.matchMedia = () => media;
  const timers = new Map();
  let timerId = 0;
  window.setTimeout = (callback, delay) => { assert.equal(delay, HOME_PROJECT_ROTATION_INTERVAL_MS); timers.set(++timerId, callback); return timerId; };
  window.clearTimeout = (id) => { timers.delete(id); };
  let observer;
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  const root = window.document.querySelector('[data-home-latest-projects]');
  const controls = root.querySelector('[data-project-controls]');
  const views = [...root.querySelectorAll('[data-project-panel]')];
  const toggle = root.querySelector('[data-project-toggle]');
  const controller = initializeHomeProjectRotation(root, { storage });
  t.after(() => controller?.destroy());
  return {
    dom, root, controls, views, toggle, controller, timers, storage,
    status: root.querySelector('[data-project-status]'),
    inView(value = true, ratio = value ? 1 : 0) { observer.callback([{ target: root, isIntersecting: value, intersectionRatio: ratio }]); },
    visibility(value) { visible = value; window.document.dispatchEvent(new window.Event('visibilitychange')); },
    motion(value) { media.matches = value; media.dispatchEvent(new window.Event('change')); },
    event(target, type) { target.dispatchEvent(new window.Event(type, { bubbles: true })); },
    tick() { const next = timers.entries().next().value; if (!next) return false; timers.delete(next[0]); next[1](); return true; },
    get observer() { return observer; },
  };
}

function guards(page, current) {
  assert.equal(page.views.filter((panel) => panel.dataset.active === 'true').length, 1);
  for (const [index, panel] of page.views.entries()) {
    const active = index === current;
    assert.equal(panel.dataset.active, String(active));
    assert.equal(panel.getAttribute('aria-hidden'), String(!active));
    assert.equal(panel.hasAttribute('inert'), !active);
    assert.equal(panel.hasAttribute('hidden'), false, 'every panel continues reserving grid height');
    assert.equal(panel.style.display, '');
    for (const anchor of panel.querySelectorAll('a')) assert.equal(anchor.tabIndex >= 0, active);
  }
}

test('automatic rotation requires visibility evidence and covers every set in order', (t) => {
  const p = page(t);
  assert.equal(p.controls.hidden, false);
  assert.equal(p.timers.size, 0);
  guards(p, 0);
  p.inView(true, 0.05);
  assert.equal(p.tick(), false);
  p.inView();
  for (const expected of [1, 2, 0, 1, 2, 0]) {
    assert.equal(p.timers.size, 1);
    p.tick();
    assert.equal(p.controller.currentIndex, expected);
    guards(p, expected);
  }
  assert.equal(p.views[0].querySelector('a').getAttribute('tabindex'), '0', 'authored tab stops survive round trips');
  assert.equal(p.status.textContent, '', 'automatic changes do not interrupt screen-reader output');
});

test('hover, leaving the viewport and a hidden tab suspend and restart a full interval', (t) => {
  const p = page(t);
  p.inView();
  for (const [stop, resume] of [
    [() => p.event(p.root, 'pointerenter'), () => p.event(p.root, 'pointerleave')],
    [() => p.inView(false), () => p.inView()],
    [() => p.visibility(false), () => p.visibility(true)],
  ]) {
    stop();
    assert.equal(p.timers.size, 0);
    assert.equal(p.tick(), false);
    resume();
    assert.equal(p.timers.size, 1);
  }
  assert.equal(p.controller.currentIndex, 0);
});

test('focused project links stop rotation without focus loss and blur does not restart it', (t) => {
  const p = page(t);
  p.inView();
  const anchor = p.views[0].querySelector('a');
  anchor.focus();
  assert.equal(p.controller.paused, true);
  assert.equal(p.timers.size, 0);
  p.controller.next();
  assert.equal(p.controller.currentIndex, 0, 'even a programmatic manual call cannot hide the focused link');
  assert.equal(p.dom.window.document.activeElement, anchor);
  p.dom.window.document.querySelector('#outside').focus();
  assert.equal(p.timers.size, 0);
  p.toggle.focus();
  p.toggle.click();
  assert.equal(p.controller.paused, false);
  assert.equal(p.timers.size, 1);
  p.tick();
  assert.equal(p.controller.currentIndex, 1);
  assert.equal(p.dom.window.document.activeElement, p.toggle);
});

test('previous and next wrap, announce and persist a stable manual reading view', (t) => {
  const storage = memoryStorage();
  const p = page(t, { storage });
  p.inView();
  const previous = p.root.querySelector('[data-project-previous]');
  previous.focus();
  previous.click();
  assert.equal(p.controller.currentIndex, 2);
  assert.equal(p.status.textContent, 'Showing set 3 of 3: Seventh, Eighth, First.');
  guards(p, 2);
  assert.equal(p.dom.window.document.activeElement, previous);
  p.controller.next();
  assert.equal(p.controller.currentIndex, 0);
  assert.equal(p.controller.paused, true);
  p.event(p.root, 'pointerleave');
  p.dom.window.document.querySelector('#outside').focus();
  p.visibility(false);
  p.visibility(true);
  p.inView();
  assert.equal(p.timers.size, 0);
  assert.equal(storage.getItem(HOME_PROJECT_ROTATION_PAUSE_KEY), 'paused');
  const revisit = page(t, { storage });
  revisit.inView();
  assert.equal(revisit.controller.paused, true);
  assert.equal(revisit.timers.size, 0);
});

test('clicking the visible Pause control preserves the pointer action across focus', (t) => {
  const p = page(t);
  p.inView();
  assert.equal(p.toggle.textContent, 'Pause rotation');
  p.event(p.toggle, 'pointerdown');
  p.toggle.focus();
  assert.equal(p.toggle.textContent, 'Play rotation');
  p.toggle.click();
  assert.equal(p.controller.paused, true);
  assert.equal(p.storage.getItem(HOME_PROJECT_ROTATION_PAUSE_KEY), 'paused');
  p.event(p.toggle, 'pointerdown');
  p.toggle.click();
  assert.equal(p.controller.paused, false);
  assert.equal(p.storage.getItem(HOME_PROJECT_ROTATION_PAUSE_KEY), 'playing');
});

test('reduced motion starts paused and preference changes never silently resume', (t) => {
  const p = page(t, { reduced: true, storage: memoryStorage('playing') });
  p.inView();
  assert.equal(p.controller.paused, true);
  assert.equal(p.toggle.disabled, true);
  assert.equal(p.controller.play(), false);
  p.controller.next();
  assert.equal(p.controller.currentIndex, 1);
  p.motion(false);
  assert.equal(p.toggle.disabled, false);
  assert.equal(p.controller.paused, true);
  assert.equal(p.timers.size, 0);
  assert.equal(p.controller.play(), true);
  assert.equal(p.timers.size, 1);
  p.motion(true);
  assert.equal(p.timers.size, 0);
  p.motion(false);
  assert.equal(p.timers.size, 0);
  p.controller.play();
  assert.equal(p.timers.size, 1);
});

test('a canceled pointer press cannot override a later keyboard Play action', (t) => {
  const p = page(t);
  p.inView();
  p.event(p.toggle, 'pointerdown');
  p.toggle.focus();
  p.event(p.toggle, 'keydown');
  p.toggle.click();
  assert.equal(p.controller.paused, false);
  assert.equal(p.timers.size, 1);
});

test('blocked storage and unavailable observers keep the manual controls usable', (t) => {
  const p = page(t, { storage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } });
  p.controller.next();
  assert.equal(p.controller.currentIndex, 1);
  p.controller.play();
  assert.equal(p.timers.size, 0);
  p.controller.destroy();
  p.dom.window.IntersectionObserver = undefined;
  const fallback = initializeHomeProjectRotation(p.root, { storage: null });
  assert.ok(fallback);
  fallback.next();
  assert.equal(fallback.currentIndex, 1);
  assert.equal(fallback.running, false);
  fallback.destroy();
});

test('duplicate initialization attaches one controller and lifecycle cleanup stops timers', (t) => {
  const p = page(t);
  p.inView();
  assert.equal(initializeHomeProjectRotation(p.root), p.controller);
  const next = p.root.querySelector('[data-project-next]');
  next.focus();
  next.click();
  assert.equal(p.controller.currentIndex, 1);
  p.controller.play();
  p.controller.destroy();
  assert.equal(p.timers.size, 0);
  assert.equal(p.observer.disconnected, true);
  assert.equal(p.controls.hidden, true);
  next.click();
  assert.equal(p.controller.currentIndex, 1, 'destroy removes listeners');
});

function latest(t) {
  const dom = new JSDOM(`<!doctype html><main data-latest-browser><form data-latest-filters hidden><input data-latest-search><select data-latest-group-filter><option value="">Every area</option><option>Ideas</option><option>Play</option></select><button type="button" data-latest-clear>Clear</button></form><p data-latest-count role="status"></p><section data-latest-group><h2>Ideas</h2><ol><li data-latest-entry data-project-group="Ideas" data-latest-text="Signal Lab Ideas Make the signal useful"><a href="/signal/">Signal Lab</a></li><li data-latest-entry data-project-group="Ideas" data-latest-text="Café Atlas Ideas Local cafés"><a href="/cafe/">Café Atlas</a></li></ol></section><section data-latest-group><h2>Play</h2><ol><li data-latest-entry data-project-group="Play" data-latest-text="Pocket Rocks Play Small treasures"><a href="/rocks/">Pocket Rocks</a></li></ol></section><p data-latest-empty hidden>No matches</p></main>`, { url: 'https://pointcast.xyz/latest/' });
  t.after(() => dom.window.close());
  const root = dom.window.document.querySelector('main');
  return { dom, root, entries: [...root.querySelectorAll('[data-latest-entry]')], sections: [...root.querySelectorAll('[data-latest-group]')], form: root.querySelector('form'), search: root.querySelector('input'), group: root.querySelector('select'), count: root.querySelector('[data-latest-count]'), empty: root.querySelector('[data-latest-empty]') };
}

test('Latest starts with every browsable link before JavaScript and enhances in place', (t) => {
  const p = latest(t);
  assert.equal(p.form.hidden, true);
  assert.ok(p.entries.every((entry) => !entry.hidden && entry.querySelector('a').tabIndex === 0));
  const before = p.entries.map((entry) => entry.querySelector('a').href);
  const controller = initializeLatestProjectBrowser(p.root);
  assert.ok(controller);
  assert.equal(initializeLatestProjectBrowser(p.root), controller);
  assert.equal(p.form.hidden, false);
  assert.equal(p.count.textContent, '3 of 3 published pages and projects.');
  assert.deepEqual(p.entries.map((entry) => entry.querySelector('a').href), before);
  controller.destroy();
});

test('Latest combines search and category filters, preserves focus and clears without reordering', (t) => {
  const p = latest(t);
  const controller = initializeLatestProjectBrowser(p.root);
  p.search.focus();
  p.search.value = 'CAFE';
  p.search.dispatchEvent(new p.dom.window.Event('input'));
  assert.deepEqual(p.entries.map((entry) => !entry.hidden), [false, true, false]);
  assert.equal(p.dom.window.document.activeElement, p.search);
  assert.equal(p.sections[1].hidden, true);
  p.group.value = 'Play';
  p.group.dispatchEvent(new p.dom.window.Event('change'));
  assert.equal(p.empty.hidden, false);
  assert.equal(p.count.textContent, '0 of 3 published pages and projects.');
  p.root.querySelector('[data-latest-clear]').click();
  assert.equal(p.search.value, '');
  assert.equal(p.group.value, '');
  assert.ok(p.entries.every((entry) => !entry.hidden));
  assert.ok(p.sections.every((section) => !section.hidden));
  p.search.value = 'rocks small';
  assert.equal(controller.filter(), 1);
  assert.equal(p.entries[2].hidden, false);
  controller.destroy();
});

test('an empty admitted catalog keeps the authored empty state and filters hidden', (t) => {
  const p = latest(t);
  p.entries.forEach((entry) => entry.remove());
  assert.equal(initializeLatestProjectBrowser(p.root), null);
  assert.equal(p.form.hidden, true);
  assert.equal(p.empty.hidden, true);
});

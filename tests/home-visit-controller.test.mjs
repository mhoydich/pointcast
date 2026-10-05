import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { initializeHomeVisitWindow } from '../src/lib/home-visit-controller.mjs';
import { HOME_VISIT_DECK_STORAGE_KEY } from '../src/lib/home-visit-deck.mjs';

const ids = ['signal-atlas', 'listening-garden', 'paper-constellation', 'tide-observatory', 'making-room', 'night-arcade'];
const titles = ['Signal Atlas', 'Listening Garden', 'Paper Constellation', 'Tide Observatory', 'Making Room', 'Night Arcade'];

function makePage(t, deckIds = ids) {
  const views = deckIds.map((id, index) => {
    const active = index === 0;
    return '<article data-home-visit-view data-view-id="' + id + '" data-view-title="' + titles[index] + '" data-active="' + active + '" aria-hidden="' + !active + '"' + (active ? '' : ' inert') + '><h3>' + titles[index] + '</h3><a href="/world/' + id + '"' + (active ? ' tabindex="0"' : ' tabindex="-1"') + '>Explore</a><a href="/share/home/' + id + '"' + (active ? '' : ' tabindex="-1"') + '>Share</a></article>';
  }).join('');
  const dom = new JSDOM('<!doctype html><html><head><title>PointCast</title><link rel="canonical" href="https://pointcast.xyz/"><meta property="og:image" content="https://pointcast.xyz/images/default.png"><meta property="og:url" content="https://pointcast.xyz/"><meta name="twitter:image" content="https://pointcast.xyz/images/default.png"></head><body><section data-home-visit data-view="' + deckIds[0] + '" data-ready="false">' + views + '<button type="button" data-home-visit-next hidden>Another view</button><p data-home-visit-status role="status" aria-live="polite"></p></section></body></html>', { url: 'https://pointcast.xyz/' });
  t.after(() => dom.window.close());
  const root = dom.window.document.querySelector('[data-home-visit]');
  return { dom, root, button: root.querySelector('[data-home-visit-next]'), status: root.querySelector('[data-home-visit-status]'), views: [...root.querySelectorAll('[data-home-visit-view]')] };
}

function memoryStorage() {
  const values = new Map();
  return {
    reads: 0,
    writes: 0,
    getItem(key) { this.reads++; return values.get(key) ?? null; },
    setItem(key, value) { this.writes++; values.set(key, value); },
  };
}

function assertVisibility(page, activeId) {
  assert.equal(page.root.dataset.view, activeId);
  assert.equal(page.root.dataset.ready, 'true');
  assert.equal(page.views.filter((view) => view.dataset.active === 'true').length, 1);
  for (const view of page.views) {
    const active = view.dataset.viewId === activeId;
    assert.equal(view.dataset.active, String(active));
    assert.equal(view.getAttribute('aria-hidden'), String(!active));
    assert.equal(view.hasAttribute('inert'), !active);
    assert.equal(view.hasAttribute('hidden'), false, 'visibility does not remove the reserved grid height');
    assert.equal(view.style.display, '');
    for (const link of view.querySelectorAll('a')) {
      if (active) assert.ok(link.tabIndex >= 0, 'active links remain keyboard reachable');
      else assert.equal(link.getAttribute('tabindex'), '-1', 'inactive links are outside the tab sequence');
    }
  }
}

test('repeated simulated visits share history and avoid the previously displayed view', (t) => {
  const storage = memoryStorage();
  let previousId;
  for (let visit = 0; visit < 12; visit++) {
    const page = makePage(t);
    const controller = initializeHomeVisitWindow(page.root, { storage, entropy: 0 });
    assert.ok(controller);
    if (previousId) assert.notEqual(controller.currentId, previousId);
    assertVisibility(page, controller.currentId);
    assert.equal(page.status.textContent, '', 'initial selection makes no live announcement');
    assert.equal(page.button.hidden, false);
    previousId = controller.currentId;
  }
  assert.equal(storage.reads, 12);
  assert.equal(storage.writes, 12);
  assert.equal(JSON.parse(storage.getItem(HOME_VISIT_DECK_STORAGE_KEY)).id, previousId);
});

test('a reader shuffle changes one view, restores focusability and announces its title', (t) => {
  const page = makePage(t);
  const controller = initializeHomeVisitWindow(page.root, { storage: null, entropy: 0 });
  assert.equal(controller.currentId, ids[0]);
  assertVisibility(page, ids[0]);
  page.button.focus();
  page.button.click();
  assert.equal(controller.currentId, ids[1]);
  assertVisibility(page, ids[1]);
  assert.equal(page.status.textContent, 'Now showing: Listening Garden.');
  assert.equal(page.dom.window.document.activeElement, page.button);
  page.button.click();
  assert.equal(controller.currentId, ids[0]);
  assertVisibility(page, ids[0]);
  assert.equal(page.views[0].querySelector('a').getAttribute('tabindex'), '0', 'authored active tab stop is restored');
});

test('blocked localStorage getter leaves explicit shuffles usable and repeat-free', (t) => {
  const page = makePage(t);
  Object.defineProperty(page.dom.window, 'localStorage', { configurable: true, get() { throw new Error('Storage denied'); } });
  const controller = initializeHomeVisitWindow(page.root, { entropy: 0 });
  let previousId = controller.currentId;
  for (let step = 0; step < 12; step++) {
    page.button.click();
    assert.notEqual(controller.currentId, previousId);
    assertVisibility(page, controller.currentId);
    previousId = controller.currentId;
  }
});

test('blocked storage reads, writes and method getters do not break voluntary shuffle', (t) => {
  const variants = [
    { getItem() { throw new Error('Read denied'); }, setItem() { throw new Error('Write denied'); } },
    { get getItem() { throw new Error('Read getter denied'); }, get setItem() { throw new Error('Write getter denied'); } },
    { getItem() { return null; }, setItem() { throw new Error('Write denied'); } },
  ];
  for (const storage of variants) {
    const page = makePage(t);
    const controller = initializeHomeVisitWindow(page.root, { storage, entropy: 0.6 });
    assert.ok(controller);
    for (let step = 0; step < 4; step++) {
      const previous = controller.currentId;
      page.button.click();
      assert.notEqual(controller.currentId, previous);
      assertVisibility(page, controller.currentId);
    }
  }
});

test('duplicate initialization keeps the reading view and attaches only one click listener', (t) => {
  const storage = memoryStorage();
  const page = makePage(t);
  const controller = initializeHomeVisitWindow(page.root, { storage, entropy: 0 });
  const snapshot = page.root.outerHTML;
  assert.equal(initializeHomeVisitWindow(page.root, { storage, entropy: 0.99 }), controller);
  assert.equal(page.root.outerHTML, snapshot);
  assert.equal(storage.reads, 1);
  assert.equal(storage.writes, 1);
  page.button.click();
  assert.equal(controller.currentId, ids[1], 'one listener performs one shuffle');
  assert.equal(storage.reads, 2);
  assert.equal(storage.writes, 2);
  const readingId = controller.currentId;
  const readingSnapshot = page.root.outerHTML;
  initializeHomeVisitWindow(page.root, { storage, entropy: 0.5 });
  assert.equal(controller.currentId, readingId);
  assert.equal(page.root.outerHTML, readingSnapshot);
});

test('browser crypto supplies entropy once per selection and never rotates without a click', (t) => {
  const page = makePage(t);
  let samples = 0;
  Object.defineProperty(page.dom.window, 'crypto', { configurable: true, value: {
    getRandomValues(values) { samples++; values[0] = 0x80000000; return values; },
  } });
  const controller = initializeHomeVisitWindow(page.root, { storage: null });
  assert.equal(samples, 1);
  assert.equal(controller.currentId, ids[3]);
  initializeHomeVisitWindow(page.root);
  assert.equal(samples, 1);
  page.button.click();
  assert.equal(samples, 2);
  assert.notEqual(controller.currentId, ids[3]);
});

test('unavailable crypto uses a guarded Math.random fallback', (t) => {
  const page = makePage(t);
  Object.defineProperty(page.dom.window, 'crypto', { configurable: true, get() { throw new Error('Crypto unavailable'); } });
  page.dom.window.Math = Object.create(Math);
  page.dom.window.Math.random = () => 0.99;
  const controller = initializeHomeVisitWindow(page.root, { storage: null });
  assert.equal(controller.currentId, ids[5]);
  page.button.click();
  assert.equal(controller.currentId, ids[4]);
});

test('throwing random sources still yield a usable stable view and explicit no-repeat shuffle', (t) => {
  const page = makePage(t);
  Object.defineProperty(page.dom.window, 'crypto', { configurable: true, get() { throw new Error('Crypto unavailable'); } });
  page.dom.window.Math = Object.create(Math);
  page.dom.window.Math.random = () => { throw new Error('Random unavailable'); };
  const controller = initializeHomeVisitWindow(page.root, { storage: null, entropy() { throw new Error('Injected source unavailable'); } });
  assert.equal(controller.currentId, ids[0]);
  page.button.click();
  assert.equal(controller.currentId, ids[1]);
});

test('initial choices and shuffles leave canonical, social metadata, URL and cookies unchanged', (t) => {
  const page = makePage(t);
  const document = page.dom.window.document;
  const head = document.head.outerHTML;
  const url = page.dom.window.location.href;
  document.cookie = 'existing=yes';
  const cookies = document.cookie;
  page.dom.window.fetch = () => { assert.fail('visit selection must not make network calls'); };
  page.dom.window.XMLHttpRequest = function () { assert.fail('visit selection must not make network calls'); };
  page.dom.window.setTimeout = () => { assert.fail('visit selection must not schedule rotation'); };
  page.dom.window.setInterval = () => { assert.fail('visit selection must not schedule rotation'); };
  initializeHomeVisitWindow(page.root, { storage: null, entropy: 0.9 });
  page.button.click();
  page.button.click();
  assert.equal(document.head.outerHTML, head);
  assert.equal(page.dom.window.location.href, url);
  assert.equal(document.cookie, cookies);
});

test('invalid decks keep the readable server default and hidden control unchanged', (t) => {
  for (const deckIds of [[], [ids[0]], [ids[0], ids[0]], [ids[0], 'invalid id']]) {
    const page = makePage(t, deckIds);
    const storage = memoryStorage();
    const snapshot = page.root.outerHTML;
    assert.equal(initializeHomeVisitWindow(page.root, { storage, entropy: 0.9 }), null);
    assert.equal(page.root.outerHTML, snapshot);
    assert.equal(page.button.hidden, true);
    assert.equal(storage.writes, 0);
    assert.equal(page.status.textContent, '');
  }
  const page = makePage(t);
  page.status.remove();
  const snapshot = page.root.outerHTML;
  assert.equal(initializeHomeVisitWindow(page.root), null);
  assert.equal(page.root.outerHTML, snapshot);
  assert.equal(initializeHomeVisitWindow(null), null);
});

test('an injected entropy sequence is sampled once for each voluntary choice', (t) => {
  const page = makePage(t);
  const sequence = [0, 0.99, 0.5];
  let samples = 0;
  const controller = initializeHomeVisitWindow(page.root, { storage: null, entropy: () => sequence[samples++] });
  assert.equal(controller.currentId, ids[0]);
  page.button.click();
  assert.equal(controller.currentId, ids[5]);
  page.button.click();
  assert.equal(controller.currentId, ids[2]);
  assert.equal(samples, 3);
});

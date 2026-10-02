import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderPickleballHome, pickleballLearning, pickleballCourtData } from '../src/lib/pickleball-home/render.js';
import { mountPickleballHome } from '../src/lib/pickleball-home/client.js';

function page(brand = 'pointcast') {
  const dom = new JSDOM(renderPickleballHome({ brand }), { url: 'https://pointcast.xyz/pickleball/home' });
  const doc = dom.window.document;
  return { dom, doc, root: doc.querySelector('[data-pickleball-home]') };
}

test('both identities retain all learning, court provenance, and useful tools before JavaScript', () => {
  for (const brand of ['rally', 'pointcast']) {
    const { dom, doc } = page(brand);
    assert.equal(doc.querySelectorAll('.pb-lesson').length, 12);
    assert.equal(doc.querySelectorAll('.pb-drill').length, 8);
    assert.equal(doc.querySelectorAll('[data-practice-panel]').length, 3);
    assert.equal(doc.querySelectorAll('[data-court-card]').length, pickleballCourtData.courts.length);
    assert.equal(doc.querySelectorAll('[data-learning-panel][hidden]').length, 0);
    for (const path of ['/tonight/', '/score/', '/bag/', '/desk/', '/guide/', '/pros/', '/paddle-fund/', '/paddle-calendar/']) {
      const url = brand === 'rally' ? path : `https://tez-rally.pages.dev${path}`;
      assert.ok(doc.querySelector(`a[href="${url}"]`), path);
    }
    for (const path of ['/pickleball', '/paddles', '/paddles/compare', '/brick-choir/third-shot', '/brick-choir/park', '/brick-choir/rally', '/games/noun-pickleball/']) {
      const url = brand === 'pointcast' ? path : `https://pointcast.xyz${path}`;
      assert.ok(doc.querySelector(`a[href="${url}"]`), path);
    }
    assert.match(doc.body.textContent, /does not show live availability/);
    assert.match(doc.body.textContent, /fictional/);
    assert.match(doc.body.textContent, /No reviews are published yet/);
    assert.equal(doc.querySelectorAll('main').length, brand === 'rally' ? 1 : 0);
    const ids = [...doc.querySelectorAll('[id]')].map(element => element.id);
    assert.equal(new Set(ids).size, ids.length, 'all anchors are unique');
    for (const court of pickleballCourtData.courts) {
      assert.ok(court.sources.length > 0);
      assert.equal(court.checkedDate, '2026-10-02');
      assert.ok(court.address && court.access && court.ownership);
    }
    dom.window.close();
  }
});

test('practice plans total exactly the offered duration and link to actual drills', () => {
  const drills = new Set(pickleballLearning.drills.map(drill => drill.id));
  assert.deepEqual(pickleballLearning.practicePlans.map(plan => plan.durationMinutes), [15, 30, 45]);
  for (const plan of pickleballLearning.practicePlans) {
    assert.equal(plan.blocks.reduce((sum, block) => sum + block.minutes, 0), plan.durationMinutes);
    for (const block of plan.blocks) if (block.drillId) assert.ok(drills.has(block.drillId));
  }
});

test('learning selection, search, empty state, and manual city filter work without location access', () => {
  const { dom, doc, root } = page();
  let locationRequests = 0;
  Object.defineProperty(dom.window.navigator, 'geolocation', { value: { getCurrentPosition() { locationRequests++; throw new Error('Location must stay manual'); } } });
  const unmount = mountPickleballHome(doc);
  doc.querySelector('[data-learning-tab="advanced"]').click();
  assert.equal(doc.querySelector('[data-learning-panel="advanced"]').hidden, false);
  assert.equal(doc.querySelector('[data-learning-panel="beginner"]').hidden, true);
  const search = doc.querySelector('[data-court-search]');
  search.value = 'a court that does not exist';
  search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(root.querySelectorAll('[data-court-card]:not([hidden])').length, 0);
  assert.equal(doc.querySelector('[data-court-empty]').hidden, false);
  doc.querySelector('[data-court-city="El Segundo"]').click();
  const visible = [...root.querySelectorAll('[data-court-card]:not([hidden])')];
  assert.ok(visible.length > 0);
  assert.ok(visible.every(card => card.dataset.city === 'El Segundo'));
  assert.equal(doc.querySelector('[data-court-empty]').hidden, true);
  const ownership = doc.querySelector('[data-court-ownership]');
  search.value = '';
  ownership.value = 'private';
  ownership.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.querySelectorAll('[data-court-card]:not([hidden])').length, 2);
  assert.equal(locationRequests, 0);
  unmount();
  dom.window.close();
});

test('blocked browser storage preserves a usable visit and announces the limitation', () => {
  const { dom, doc } = page();
  Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('Storage denied'); } });
  const unmount = mountPickleballHome(doc);
  const checkbox = doc.querySelector('[data-lesson-complete]');
  checkbox.checked = true;
  checkbox.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.match(doc.querySelector('[data-progress-note]').textContent, /1 of 12 lessons practiced/);
  assert.match(doc.querySelector('[data-progress-note]').textContent, /storage is unavailable/);
  assert.equal(doc.querySelector('[data-timer-controls]').hidden, false);
  unmount();
  dom.window.close();
});

test('practice clock follows elapsed time, pauses, and resets when choosing another plan', () => {
  const { dom, doc } = page();
  let now = 1_000_000;
  const originalNow = Date.now;
  Date.now = () => now;
  const callbacks = new Map();
  let nextId = 1;
  dom.window.setInterval = callback => { const id = nextId++; callbacks.set(id, callback); return id; };
  dom.window.clearInterval = id => callbacks.delete(id);
  const unmount = mountPickleballHome(doc);
  try {
    const select = doc.querySelector('[data-plan-select]');
    const output = doc.querySelector('[data-timer-output]');
    const start = doc.querySelector('[data-timer-start]');
    select.value = '15';
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(output.textContent, '15:00');
    start.click();
    assert.equal(start.textContent, 'Pause clock');
    now += 125_000;
    for (const tick of [...callbacks.values()]) tick();
    assert.equal(output.textContent, '12:55');
    assert.match(doc.querySelector('[data-timer-status]').textContent, /Serve, return, recover/);
    dom.window.dispatchEvent(new dom.window.Event('pagehide'));
    assert.equal(callbacks.size, 0);
    now += 60_000;
    dom.window.dispatchEvent(new dom.window.Event('pageshow'));
    assert.equal(output.textContent, '11:55', 'restored page follows the original deadline');
    assert.equal(callbacks.size, 1);
    start.click();
    assert.equal(start.textContent, 'Resume clock');
    assert.equal(callbacks.size, 0);
    dom.window.dispatchEvent(new dom.window.Event('pageshow'));
    assert.equal(callbacks.size, 0, 'restoring a paused clock stays paused');
    select.value = '45';
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(output.textContent, '45:00');
    assert.equal(start.textContent, 'Start clock');
    assert.equal(doc.querySelector('[data-practice-panel="45"]').hidden, false);
    assert.equal(doc.querySelector('[data-practice-panel="15"]').hidden, true);
    start.click();
    unmount();
    assert.equal(callbacks.size, 0, 'leaving the page cleans up its timer');
  } finally {
    Date.now = originalNow;
    unmount();
    dom.window.close();
  }
});

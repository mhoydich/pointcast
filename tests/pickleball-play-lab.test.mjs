import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderPlayLab } from '../src/lib/pickleball-play-lab/render.mjs';
import { mountPlayLab } from '../src/lib/pickleball-play-lab/client.mjs';
import { TOTAL_SECONDS } from '../src/lib/pickleball-play-lab/session.mjs';

function fixture() {
  const dom = new JSDOM(renderPlayLab(), { pretendToBeVisual: true });
  const doc = dom.window.document;
  let now = 0;
  let next = 0;
  const timers = new Map();
  dom.window.setInterval = callback => { timers.set(++next, callback); return next; };
  dom.window.clearInterval = id => timers.delete(id);
  const cleanup = mountPlayLab(doc, { now: () => now });
  return {
    dom, doc, timers, cleanup, q: selector => doc.querySelector(selector),
    advance(ms) { now += ms; [...timers.values()].forEach(callback => callback()); },
    close() { cleanup(); dom.window.close(); },
  };
}

test('without JavaScript all three games and all six blocks remain readable', () => {
  const dom = new JSDOM(renderPlayLab());
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('[data-game]:not([hidden])').length, 3);
  assert.equal(doc.querySelectorAll('[data-phase]').length, 6);
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.equal(TOTAL_SECONDS, 1200);
  assert.match(doc.body.textContent, /Custom practice rules/);
  assert.match(doc.body.textContent, /not official matches/);
  const ids = [...doc.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(new Set(ids).size, ids.length);
  dom.window.close();
});

test('clock starts only on demand, handles repeated toggles, and resets without duplicate intervals', () => {
  const f = fixture();
  try {
    assert.equal(f.timers.size, 0);
    f.q('[data-clock-toggle]').click();
    f.advance(125000);
    assert.equal(f.q('[data-clock]').textContent, '17:55');
    assert.equal(f.q('[data-phase-title]').textContent, 'Backhand Builder');
    f.q('[data-clock-toggle]').click();
    assert.equal(f.timers.size, 0);
    f.advance(60000);
    assert.equal(f.q('[data-clock]').textContent, '17:55');
    for (let i = 0; i < 6; i++) f.q('[data-clock-toggle]').click();
    assert.equal(f.timers.size, 0);
    f.q('[data-clock-toggle]').click();
    assert.equal(f.timers.size, 1);
    f.q('[data-clock-reset]').click();
    assert.equal(f.timers.size, 0);
    assert.equal(f.q('[data-clock]').textContent, '20:00');
    assert.equal(f.q('[data-clock-toggle]').textContent, 'Start session');
  } finally { f.close(); }
});

test('selecting a block pauses and uses its exact starting time', () => {
  const f = fixture();
  try {
    f.q('[data-clock-toggle]').click();
    f.advance(30000);
    f.q('[data-jump="3"]').click();
    assert.equal(f.q('[data-clock]').textContent, '8:00');
    assert.equal(f.q('[data-phase-title]').textContent, 'Green-Light Dinks');
    assert.equal(f.q('[data-phase-time]').textContent, '5:00 in this block');
    assert.equal(f.timers.size, 0);
    assert.equal(f.doc.activeElement, f.q('[data-clock-toggle]'));
    f.q('[data-clock-toggle]').click();
    f.advance(300000);
    assert.equal(f.q('[data-phase-title]').textContent, 'Play the favorite');
  } finally { f.close(); }
});

test('leaving the page pauses and returning does not restart the clock', () => {
  const f = fixture();
  try {
    f.q('[data-clock-toggle]').click();
    f.advance(45000);
    f.dom.window.dispatchEvent(new f.dom.window.Event('pagehide'));
    assert.equal(f.timers.size, 0);
    f.advance(180000);
    f.dom.window.dispatchEvent(new f.dom.window.Event('pageshow'));
    assert.equal(f.timers.size, 0);
    assert.equal(f.q('[data-clock]').textContent, '19:15');
    f.q('[data-clock-toggle]').click();
    f.advance(15000);
    Object.defineProperty(f.doc, 'visibilityState', { configurable: true, value: 'hidden' });
    f.doc.dispatchEvent(new f.dom.window.Event('visibilitychange'));
    assert.equal(f.timers.size, 0);
    assert.equal(f.q('[data-clock]').textContent, '19:00');
    f.q('[data-clock-toggle]').click();
    assert.equal(f.timers.size, 0, 'hidden page cannot restart');
  } finally { f.close(); }
});

test('delayed ticks finish once and reset permits a fresh session', () => {
  const f = fixture();
  try {
    f.q('[data-clock-toggle]').click();
    f.advance(1300000);
    assert.equal(f.q('[data-clock]').textContent, '0:00');
    assert.equal(f.q('[data-clock-toggle]').disabled, true);
    assert.equal(f.timers.size, 0);
    assert.match(f.q('[data-clock-status]').textContent, /Session complete/);
    f.q('[data-clock-reset]').click();
    assert.equal(f.q('[data-clock-toggle]').disabled, false);
    f.q('[data-clock-toggle]').click();
    assert.equal(f.timers.size, 1);
  } finally { f.close(); }
});

test('game buttons support click, arrows, home and end without changing the timer', () => {
  const f = fixture();
  try {
    const buttons = [...f.doc.querySelectorAll('[data-game-button]')];
    buttons[1].click();
    assert.equal(f.q('[data-game="drop"]').hidden, false);
    assert.equal(f.q('[data-game="backhand"]').hidden, true);
    buttons[1].dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(f.doc.activeElement, buttons[2]);
    assert.equal(buttons[2].getAttribute('aria-pressed'), 'true');
    buttons[2].dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    assert.equal(f.doc.activeElement, buttons[0]);
    buttons[0].dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    assert.equal(f.doc.activeElement, buttons[2]);
    assert.equal(f.q('[data-clock]').textContent, '20:00');
    assert.equal(f.timers.size, 0);
  } finally { f.close(); }
});

test('mounting twice is idempotent and cleanup restores readable content', () => {
  const f = fixture();
  try {
    assert.equal(mountPlayLab(f.doc), f.cleanup);
    f.q('[data-clock-toggle]').click();
    assert.equal(f.timers.size, 1);
    f.cleanup();
    f.cleanup();
    assert.equal(f.timers.size, 0);
    assert.equal(f.doc.querySelectorAll('[data-game]:not([hidden])').length, 3);
    assert.equal(f.q('[data-clock-controls]').hidden, true);
  } finally { f.close(); }
});


test('Drop-and-Go signals the halfway role swap once, including after a delayed tick', () => {
  const f = fixture();
  try {
    f.q('[data-jump="2"]').click();
    f.q('[data-clock-toggle]').click();
    f.advance(150000);
    assert.match(f.q('[data-phase-cue]').textContent, /Swap roles/);
    assert.match(f.q('[data-clock-status]').textContent, /swap roles/);
    assert.equal(f.q('[data-phase-time]').textContent, '2:30 in this block');
    f.q('[data-clock-toggle]').click();
    f.q('[data-clock-toggle]').click();
    f.advance(1000);
    assert.match(f.q('[data-clock-status]').textContent, /Session running/);
  } finally { f.close(); }
});

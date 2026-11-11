import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/pages/green-flash.astro', import.meta.url), 'utf8');
function setup(t, { stored = null, reduced = false } = {}) {
  const html = source.replace(/^---[\s\S]*?---/, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
  const dom = new JSDOM(html, { url: 'https://pointcast.test/green-flash', runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const win = dom.window;
  let now = 0, hidden = false, id = 0, wallTime = Date.parse('2026-11-03T00:00:00Z');
  const frames = new Map();
  const intervals = new Map();
  win.performance.now = () => now;
  win.Math.random = () => 0;
  Object.defineProperty(win.document, 'hidden', { get: () => hidden });
  win.requestAnimationFrame = (fn) => { frames.set(++id, fn); return id; };
  win.cancelAnimationFrame = (key) => frames.delete(key);
  win.setInterval = (fn) => { intervals.set(++id, fn); return id; };
  win.clearInterval = (key) => intervals.delete(key);
  win.Date = class extends Date {
    constructor(...args) { super(...(args.length ? args : [wallTime])); }
    static now() { return wallTime; }
  };
  const drawing = new Proxy({}, { get: (_, key) => key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} });
  const saved = [];
  Object.assign(win, {
    fitCanvas: () => drawing,
    tone() {}, audio() {},
    load: () => stored,
    save: (key, value) => saved.push({ key, value: JSON.parse(JSON.stringify(value)) }),
    typing: (event) => Boolean(event.target?.closest?.('input,textarea,select,[contenteditable]')),
    onControl: (event) => Boolean(event.target?.closest?.('button,a,summary,[role="button"]')),
    reducedMotion: () => reduced,
    townDay: (date) => date.toISOString().slice(0, 10),
    sunsetFor: (day) => new Date(`${day}T01:00:00Z`),
    pacificClock: (date) => date.toISOString().slice(0, 16),
    addDays: (day, amount) => new Date(Date.parse(day) + amount * 86400000).toISOString().slice(0, 10),
  });
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*?;\s*$/gm, '');
  vm.runInContext(script, dom.getInternalVMContext());
  const get = (id) => win.document.getElementById(id);
  return {
    win, saved, frames, intervals, get,
    now(value) { now = value; },
    frame(value) { now = value; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn(value)); },
    hidden(value) { hidden = value; win.document.dispatchEvent(new win.Event('visibilitychange')); },
    wallTime(value) { wallTime = Date.parse(value); },
    refresh() { [...intervals.values()].forEach((fn) => fn()); },
  };
}

test('one native button starts, catches, reports and restarts the sunset', (t) => {
  const room = setup(t);
  room.frame(0);
  assert.equal(room.frames.size, 0, 'idle scene does not animate endlessly');
  room.get('gf-go').click();
  assert.equal(room.get('gf-go').textContent, 'Catch the flash');
  room.now(5000);
  room.get('gf-go').click();
  assert.match(room.get('gf-read').textContent, /Missed it.*early/);
  assert.equal(room.get('gf-go').textContent, 'Watch another sunset');
  assert.equal(room.saved.length, 1);
  room.get('gf-go').click();
  assert.equal(room.get('gf-go').textContent, 'Catch the flash');
});

test('invalid saved records cannot break the result or poison its numeric fields', (t) => {
  for (const stored of [null, 'old', {}, { caught: -1, best: 'x' }, { caught: 1.5, best: -2 }, { caught: Number.MAX_VALUE, best: Infinity }]) {
    const room = setup(t, { stored });
    room.get('gf-go').click();
    room.now(5000);
    assert.doesNotThrow(() => room.get('gf-go').click());
    assert.equal(room.saved[0].value.caught, 0);
    assert.ok(Number.isFinite(room.saved[0].value.best));
    assert.match(room.get('gf-read').textContent, /Flashes caught here: 0/);
  }
});

test('a hidden tab pauses game time rather than turning a catch into a minute-late result', (t) => {
  const room = setup(t);
  room.get('gf-go').click();
  room.frame(10000);
  room.hidden(true);
  assert.equal(room.frames.size, 0);
  room.now(70000);
  room.hidden(false);
  room.now(75000);
  room.get('gf-go').click();
  assert.match(room.get('gf-read').textContent, /14\.29 s early/);
});

test('Back from the page cache resumes the remaining sunset time', (t) => {
  const room = setup(t);
  room.get('gf-go').click();
  room.frame(10000);
  room.win.dispatchEvent(new room.win.Event('pagehide'));
  assert.equal(room.frames.size, 0);
  room.now(70000);
  const returned = new room.win.Event('pageshow');
  Object.defineProperty(returned, 'persisted', { value: true });
  room.win.dispatchEvent(returned);
  room.now(75000);
  room.get('gf-go').click();
  assert.match(room.get('gf-read').textContent, /14\.29 s early/);
});

test('reduced motion stops optional motion after a result and repeated shortcuts do not replay it', (t) => {
  const room = setup(t, { reduced: true });
  room.frame(0);
  assert.equal(room.frames.size, 0);
  room.get('gf-go').click();
  room.now(29294.117647);
  room.get('gf-go').click();
  assert.match(room.get('gf-read').textContent, /Green flash!/);
  assert.equal(room.frames.size, 0, 'reduced-motion result stays still');
  room.win.dispatchEvent(new room.win.KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }));
  assert.equal(room.get('gf-go').textContent, 'Watch another sunset');
  const repeated = new room.win.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true });
  room.get('gf-go').dispatchEvent(repeated);
  assert.equal(repeated.defaultPrevented, true, 'held Enter cannot start/catch repeatedly');
});

test('the real sunset refreshes by minute, on starting, and after a hidden midnight', (t) => {
  const room = setup(t);
  assert.match(room.get('gf-real').textContent, /2026-11-03T01:00.*1 h 0 min/);
  assert.equal(room.intervals.size, 1);
  room.wallTime('2026-11-03T00:01:00Z');
  room.refresh();
  assert.match(room.get('gf-real').textContent, /59 min/);
  room.wallTime('2026-11-03T00:30:00Z');
  room.get('gf-go').click();
  assert.match(room.get('gf-real').textContent, /30 min/);
  room.hidden(true);
  assert.equal(room.intervals.size, 0, 'background page does not keep a refresh timer');
  room.wallTime('2026-11-04T00:30:00Z');
  room.hidden(false);
  assert.match(room.get('gf-real').textContent, /2026-11-04T01:00.*30 min/);
  assert.equal(room.intervals.size, 1);
  room.win.dispatchEvent(new room.win.Event('pagehide'));
  assert.equal(room.intervals.size, 0);
  const returned = new room.win.Event('pageshow');
  Object.defineProperty(returned, 'persisted', { value: true });
  room.win.dispatchEvent(returned);
  assert.equal(room.intervals.size, 1, 'cached Back restores one refresh timer');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import * as daily from '../src/lib/ten-doors/daily.mjs';

function room(t, slug, options = {}) {
  const source = readFileSync(new URL(`../src/pages/${slug}.astro`, import.meta.url), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?/g, '');
  const markup = source.replace(/^---[\s\S]*?---/, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '');
  const dom = new JSDOM(markup, { url: `https://pointcast.test/${slug}`, pretendToBeVisual: true, runScripts: 'outside-only' });
  const win = dom.window;
  const frames = new Map(); let frameID = 0, now = 0;
  win.requestAnimationFrame = fn => { frames.set(++frameID, fn); return frameID; };
  win.cancelAnimationFrame = id => frames.delete(id);
  Object.defineProperty(win.performance, 'now', { value: () => now });
  let reduce = Boolean(options.reducedMotion);
  let dateNow = options.at ?? Date.now();
  const NativeDate = win.Date;
  win.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : [dateNow])); } static now() { return dateNow; } };
  const drawing = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop() {} });
    return () => {};
  } });
  Object.assign(win, daily, {
    fitCanvas: () => drawing,
    pointerXY: () => ({ x: 70, y: 70 }),
    load: () => 'saved' in options ? options.saved : 0,
    save: (key, value) => { win.localStorage.setItem(key, JSON.stringify(value)); },
    audio: () => null, out: () => null, tone: () => null, noise: () => null,
    hz: n => 440 * 2 ** ((n - 69) / 12), reducedMotion: () => reduce,
  });
  win.Math.random = () => 0.5;
  win.eval(script);
  t.after(() => win.close());
  const get = id => win.document.getElementById(id);
  return {
    win, get, frames,
    frame(time) { now = time; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(time)); },
    key(target, key, extra = {}) { const e = new win.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...extra }); target.dispatchEvent(e); return e; },
    reduced(value) { reduce = value; },
    clock(value) { dateNow = value; },
  };
}

test('Kite validates saved best and exposes focusable, scoped keyboard controls', t => {
  const game = room(t, 'kite-line', { saved: 'corrupt' });
  assert.equal(game.get('kl-read').textContent, 'Best flight: none yet.');
  assert.equal(game.get('kl-beach').tabIndex, 0);
  const outside = game.key(game.win.document.body, 'ArrowUp');
  assert.equal(outside.defaultPrevented, false, 'the game leaves unrelated arrow keys alone');
  assert.equal(game.get('kl-pause').disabled, true);
  game.get('kl-go').click();
  assert.equal(game.win.document.activeElement, game.get('kl-beach'));
  assert.equal(game.get('kl-pause').disabled, false);
  const inside = game.key(game.get('kl-beach'), 'ArrowUp');
  assert.equal(inside.defaultPrevented, true);
});

test('Kite pauses score on explicit pause, lost window focus and pagehide; resumes without a jump', t => {
  const game = room(t, 'kite-line');
  game.get('kl-go').click();
  game.frame(0); game.frame(100);
  game.get('kl-pause').click();
  game.frame(500);
  const paused = game.get('kl-flight').textContent;
  game.frame(100000);
  assert.equal(game.get('kl-flight').textContent, paused);
  assert.equal(game.get('kl-pause').textContent, 'Resume flight');
  game.get('kl-pause').click(); game.frame(100016);
  assert.equal(game.get('kl-pause').textContent, 'Pause flight');
  game.win.dispatchEvent(new game.win.Event('blur'));
  assert.equal(game.get('kl-pause').textContent, 'Resume flight');
  game.get('kl-pause').click();
  game.win.dispatchEvent(new game.win.PageTransitionEvent('pagehide', { persisted: true }));
  assert.equal(game.get('kl-pause').textContent, 'Resume flight');
});

function routeForCurrentDay() { return daily.routeDay(daily.townDay(new Date())); }
function solve(round) {
  // BFS over actual puzzle state finds a shortest route independent of UI code.
  const blocked = daily.blockedFor(round), all = (1 << round.kids.length) - 1;
  const maskAt = n => round.kids.reduce((mask, k, i) => mask | (k === n ? 1 << i : 0), 0);
  const queue = [{ at: round.start, mask: 0, path: [] }], seen = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (cur.mask === all) return cur.path;
    const key = `${cur.at}:${cur.mask}`; if (seen.has(key)) continue; seen.add(key);
    for (const to of daily.neighbors(cur.at)) if (daily.canDrive(cur.at, to, blocked)) queue.push({ at: to, mask: cur.mask | maskAt(to), path: [...cur.path, to] });
  }
  throw new Error('Unsolvable source puzzle');
}
function driveRoute(game, round) {
  let at = round.start;
  for (const to of solve(round)) {
    const a = daily.coords(at), b = daily.coords(to);
    const direction = b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up';
    const button = game.get(`ic-${direction}`);
    assert.equal(button.disabled, false, 'legal route exposed by a native button');
    button.click(); at = to;
  }
}

test('Ice Cream exposes street-map text, native directions and complete next/retry flow', t => {
  const game = room(t, 'ice-cream-route', { saved: null });
  assert.match(game.get('ic-position').textContent, /Truck: row \d, column \d/);
  assert.match(game.get('ic-waiting').textContent, /Waiting kids: row/);
  assert.match(game.get('ic-oneways').textContent, /All streets run both ways/);
  const plan = routeForCurrentDay();
  driveRoute(game, plan.rounds[0]);
  assert.match(game.get('ic-read').textContent, /Every kid served/);
  assert.equal(game.get('ic-next').hidden, false);
  game.get('ic-next').click();
  assert.match(game.get('ic-read').textContent, /Round 2/);
  assert.equal(game.win.document.activeElement, game.get('ic-map'));
  assert.equal(game.get('ic-next').hidden, true);
  assert.match(game.get('ic-oneways').textContent, /one-way blocks/);
  game.get('ic-retry').click();
  assert.match(game.get('ic-read').textContent, /Round 2/);
});

test('Ice Cream ignores keys outside the map, held repeats and modifiers', t => {
  const game = room(t, 'ice-cream-route');
  const before = game.get('ic-position').textContent;
  assert.equal(game.key(game.win.document.body, 'ArrowRight').defaultPrevented, false);
  game.key(game.get('ic-map'), 'ArrowRight', { repeat: true });
  game.key(game.get('ic-map'), 'ArrowRight', { ctrlKey: true });
  assert.equal(game.get('ic-position').textContent, before);
});

test('Ice Cream repairs malformed records when a complete round is saved', t => {
  for (const saved of [null, 'bad', [], { [`${daily.townDay(new Date())}:1`]: 'invalid', '__proto__': 4 }]) {
    const game = room(t, 'ice-cream-route', { saved });
    driveRoute(game, routeForCurrentDay().rounds[0]);
    const record = JSON.parse(game.win.localStorage.getItem('ice-cream-route:v1'));
    assert.equal(Object.values(record).every(Number.isSafeInteger), true);
  }
});


test('Ice Cream announces a new Pacific day without discarding an active route, then refreshes on retry', t => {
  const game = room(t, 'ice-cream-route', { at: Date.parse('2026-11-03T07:59:00Z') });
  assert.match(game.get('ic-position').textContent, /Map: 2026-11-02/);
  game.clock(Date.parse('2026-11-03T08:01:00Z'));
  game.win.document.dispatchEvent(new game.win.Event('visibilitychange'));
  assert.equal(game.get('ic-daynotice').hidden, false);
  assert.equal(game.get('ic-retry').textContent, "Play today's map");
  const before = game.get('ic-position').textContent;
  const available = ['up', 'down', 'left', 'right'].map(d => game.get(`ic-${d}`)).find(b => !b.disabled);
  available.click();
  assert.match(game.get('ic-position').textContent, /Map: 2026-11-02/, 'active map does not silently change mid-route');
  assert.notEqual(game.get('ic-position').textContent, before);
  game.get('ic-retry').click();
  assert.match(game.get('ic-position').textContent, /Map: 2026-11-03/);
  assert.match(game.get('ic-read').textContent, /Round 1/);
  assert.equal(game.get('ic-daynotice').hidden, true);
  assert.equal(game.get('ic-retry').textContent, 'Retry round');
});

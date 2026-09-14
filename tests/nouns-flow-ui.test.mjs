import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createFlow } from '../src/lib/nouns-flow-engine.mjs';
import { coGameWorlds } from '../src/lib/co-games-worlds.ts';

const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/lib/nouns-flow-ui.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
});
const { mountNounsFlow } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const source = readFileSync(new URL('../src/pages/co-games/flow.astro', import.meta.url), 'utf8');
const markup = source.match(/<article class="starjam-page">[\s\S]*?<\/article>/)[0];
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture(t) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games/flow', pretendToBeVisual: true });
  const win = dom.window, root = win.document.getElementById('nouns-flow');
  const q = selector => root.querySelector(selector);
  // Render the one Astro loop; all other elements come from the actual page.
  q('.flow-world-grid').innerHTML = Object.entries(coGameWorlds).map(([id, world]) => `<button type="button" data-flow-world="${id}">${world.name}</button>`).join('');
  win.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  win.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new win.Event('close')); };
  let now = 0, hidden = false, nextFrame = 0, nextTimer = 0;
  const frames = new Map(), timers = new Map(), images = [], events = [];
  t.mock.method(win.performance, 'now', () => now);
  Object.defineProperty(win.document, 'hidden', { get: () => hidden });
  Object.defineProperty(q('[data-flow-notes]'), 'clientHeight', { value: 500 });
  win.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  win.cancelAnimationFrame = id => frames.delete(id);
  win.setTimeout = callback => { timers.set(++nextTimer, callback); return nextTimer; };
  win.clearTimeout = id => timers.delete(id);
  win.Image = class { onload = null; onerror = null; src = ''; constructor() { images.push(this); } };
  t.mock.method(globalThis, 'fetch', () => { throw new Error('STARJAM must stay local.'); });
  for (const name of ['start', 'beat', 'hit', 'miss', 'mistap', 'pause', 'finish', 'world']) {
    root.addEventListener(`nouns-flow:${name}`, event => events.push({ name, detail: event.detail }));
  }
  let stop = mountNounsFlow(root), mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; stop(); } };
  const remount = () => { cleanup(); stop = mountNounsFlow(root); mounted = true; };
  const at = time => { now = time; };
  const frame = time => {
    now = time;
    const pending = [...frames.values()]; frames.clear();
    for (const callback of pending) callback(now);
  };
  const key = (value, { repeat = false, target = win.document, ...other } = {}) => target.dispatchEvent(new win.KeyboardEvent('keydown', { key: value, bubbles: true, repeat, ...other }));
  const tap = lane => q(`[data-flow-lane="${lane}"]`).dispatchEvent(new win.MouseEvent('pointerdown', { button: 0, bubbles: true }));
  const hide = value => { hidden = value; win.document.dispatchEvent(new win.Event('visibilitychange')); };
  t.after(() => { cleanup(); win.close(); });
  return { win, root, q, frames, timers, images, events, cleanup, remount, at, frame, key, tap, hide };
}

test('mount is idle, the explicit Start/Pause/Resume button controls exactly one frame loop', t => {
  const f = fixture(t), start = f.q('[data-flow-start]');
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.frames.size, 0);
  assert.equal(f.events.length, 0);
  assert.ok([...f.root.querySelectorAll('[data-flow-lane]')].every(button => button.disabled));
  start.click();
  assert.equal(f.root.dataset.state, 'playing');
  assert.equal(start.disabled, false);
  assert.equal(start.textContent, 'Pause jam');
  assert.equal(f.frames.size, 1);
  f.frame(500); assert.equal(f.frames.size, 1);
  start.click();
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(start.textContent, 'Resume jam');
  assert.equal(f.frames.size, 0);
  f.at(10000); start.click();
  assert.equal(f.root.dataset.state, 'playing');
  assert.equal(f.frames.size, 1);
  assert.deepEqual(f.events.filter(event => event.name === 'start').map(event => event.detail.resumed), [false, true]);
  assert.equal(f.events.find(event => event.name === 'pause').detail.reason, 'manual');
});

test('note geometry reaches the82percent hit line and keyboard and touch earn real timed hits', t => {
  const f = fixture(t), chart = createFlow().notes;
  f.q('[data-flow-start]').click();
  f.frame(chart[0].at - 900);
  const note = f.q(`[data-note-id="${chart[0].id}"]`);
  assert.equal(Number.parseFloat(note.style.top), 205);
  assert.ok(Math.abs(Number.parseFloat(note.style.left) - (chart[0].lane + .5) / 3 * 100) < .001);
  f.frame(chart[0].at);
  assert.equal(Number.parseFloat(note.style.top), 410);
  f.key(String(chart[0].lane + 1));
  assert.equal(f.events.filter(event => event.name === 'hit').length, 1);
  assert.equal(f.events.find(event => event.name === 'hit').detail.grade, 'perfect');
  assert.equal(f.q(`[data-note-id="${chart[0].id}"]`), null);
  assert.equal(f.q(`[data-flow-lane="${chart[0].lane}"]`).dataset.active, 'true');
  assert.equal(f.root.dataset.lastGrade, 'perfect');
  const score = f.q('[data-flow-score]').textContent;
  f.key(String(chart[0].lane + 1), { repeat: true });
  assert.equal(f.q('[data-flow-score]').textContent, score);
  f.at(chart[1].at + 110); f.tap(chart[1].lane);
  assert.equal(f.events.filter(event => event.name === 'hit').length, 2);
  assert.equal(f.events.filter(event => event.name === 'hit')[1].detail.grade, 'good');
  assert.ok(Number(f.q('[data-flow-score]').textContent) > Number(score));
});

test('pause freezes active time across a long interruption and resume preserves note timing', t => {
  const f = fixture(t), first = createFlow().notes[0];
  f.q('[data-flow-start]').click(); f.frame(1000);
  f.q('[data-flow-pause]').click();
  const progress = f.q('[data-flow-progress]').value;
  f.at(1000000); f.tap(first.lane);
  assert.equal(f.q('[data-flow-progress]').value, progress);
  assert.equal(f.events.filter(event => event.name === 'miss').length, 0);
  f.q('[data-flow-start]').click();
  f.at(1000000 + first.at - 1000); f.tap(first.lane);
  assert.equal(f.events.find(event => event.name === 'hit').detail.grade, 'perfect');
  assert.equal(f.q('[data-flow-health]').textContent, '100');
});

test('leaving the page and opening a dialog pause without unseen misses or automatic resume', async t => {
  const f = fixture(t);
  f.q('[data-flow-start]').click(); f.frame(1000);
  f.at(60000); f.hide(true);
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.q('[data-flow-health]').textContent, '100');
  assert.equal(f.frames.size, 0);
  f.hide(false);
  assert.equal(f.root.dataset.state, 'paused');
  f.q('[data-flow-start]').click();
  f.q('#flow-settings').showModal(); await tick();
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.events.filter(event => event.name === 'pause').at(-1).detail.reason, 'dialog');
  f.q('[data-flow-start]').click();
  assert.equal(f.root.dataset.state, 'paused', 'Start is blocked behind an open dialog');
  f.q('#flow-settings').close(); await tick();
  assert.equal(f.root.dataset.state, 'paused');
});

test('audio interruption freezes the last presented frame and only explicit Resume retries the battle', t => {
  const f = fixture(t), first = createFlow().notes[0];
  f.q('[data-flow-start]').click(); f.frame(1000);
  const progress = f.q('[data-flow-progress]').value;
  f.at(60000);
  f.root.dispatchEvent(new f.win.CustomEvent('nouns-flow:audio-interrupted', { detail: { reason: 'interrupted' } }));
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.frames.size, 0);
  assert.equal(f.q('[data-flow-progress]').value, progress);
  assert.equal(f.q('[data-flow-health]').textContent, '100');
  const pause = f.events.filter(event => event.name === 'pause').at(-1);
  assert.equal(pause.detail.reason, 'audio');
  assert.equal(pause.detail.elapsedMs, 1000);
  f.frame(100000);
  f.root.dispatchEvent(new f.win.CustomEvent('nouns-flow:audio-interrupted', { detail: { reason: 'resume-failed' } }));
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.frames.size, 0);
  assert.equal(f.events.filter(event => event.name === 'pause').length, 1);
  assert.equal(f.events.filter(event => event.name === 'start').length, 1);
  f.q('[data-flow-start]').click();
  assert.equal(f.root.dataset.state, 'playing');
  assert.equal(f.events.filter(event => event.name === 'start').at(-1).detail.resumed, true);
  f.at(100000 + first.at - 1000); f.tap(first.lane);
  assert.equal(f.events.find(event => event.name === 'hit').detail.grade, 'perfect');
  assert.equal(f.q('[data-flow-health]').textContent, '100');
});

test('audio interruption is inert before play, while already paused, and after completion', t => {
  const f = fixture(t);
  const interrupt = () => f.root.dispatchEvent(new f.win.CustomEvent('nouns-flow:audio-interrupted', { detail: { reason: 'resume-failed' } }));
  interrupt();
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.events.length, 0);
  f.q('[data-flow-start]').click(); f.q('[data-flow-pause]').click();
  const events = f.events.length;
  interrupt();
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.events.length, events);
  f.q('[data-flow-start]').click(); f.frame(35000);
  assert.equal(f.root.dataset.state, 'lost');
  const finished = f.events.length;
  interrupt();
  assert.equal(f.root.dataset.state, 'lost');
  assert.equal(f.events.length, finished);
  assert.equal(f.frames.size, 0);
});

test('keyboard input ignores repeat, modifiers, form fields, and open dialogs; Escape pauses', t => {
  const f = fixture(t), first = createFlow().notes[0];
  f.q('[data-flow-start]').click(); f.at(first.at);
  const key = ['d', 'f', 'j'][first.lane];
  f.key(key, { repeat: true }); f.key(key, { ctrlKey: true });
  f.key(key, { target: f.q('[data-flow-pace]') });
  f.key(key, { target: f.q('[data-flow-volume]') });
  assert.equal(f.events.filter(event => event.name === 'hit').length, 0);
  f.key(key.toUpperCase());
  assert.equal(f.events.filter(event => event.name === 'hit').length, 1);
  f.key('Escape');
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.frames.size, 0);
});

test('restart and world travel reset the battle without starting another track', async t => {
  const f = fixture(t), first = createFlow().notes[0];
  f.q('[data-flow-start]').click(); f.at(first.at); f.tap(first.lane);
  f.q('[data-flow-restart]').click();
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.q('[data-flow-score]').textContent, '0');
  assert.equal(f.q('[data-flow-health]').textContent, '100');
  assert.equal(f.q('[data-flow-enemy]').textContent, '100');
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
  const starts = f.events.filter(event => event.name === 'start').length;
  f.q('#flow-worlds').showModal(); await tick();
  f.q('[data-flow-world="shell"]').click();
  assert.equal(f.q('#flow-worlds').open, false);
  assert.equal(f.root.dataset.world, 'shell');
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.q('[data-flow-world-name]').textContent, 'Tideglass ruins');
  f.images.at(-1).onload();
  assert.equal(f.q('[data-flow-landscape]').getAttribute('src'), coGameWorlds.shell.src);
  f.q('[data-flow-next-world]').click();
  assert.equal(f.root.dataset.world, 'storm');
  assert.equal(f.events.filter(event => event.name === 'start').length, starts);
});

test('pace and world controls are unavailable during play, and pace changes start a clean ready chart', t => {
  const f = fixture(t), select = f.q('[data-flow-pace]');
  f.q('[data-flow-start]').click();
  assert.equal(select.disabled, true);
  assert.ok([...f.root.querySelectorAll('[data-flow-world],[data-flow-next-world],[data-flow-shuffle]')].every(button => button.disabled));
  f.q('[data-flow-world="storm"]').click();
  assert.equal(f.root.dataset.world, 'garden');
  f.q('[data-flow-pause]').click();
  select.value = 'drift'; select.dispatchEvent(new f.win.Event('change'));
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(f.root.dataset.pace, 'drift');
  f.q('[data-flow-start]').click();
  assert.equal(f.events.filter(event => event.name === 'start').at(-1).detail.bpm, 72);
});

test('a played win and an unattended loss finish once, stop frames, and focus replay', t => {
  const f = fixture(t), chart = createFlow().notes;
  f.q('[data-flow-start]').click();
  for (const note of chart) {
    if (f.root.dataset.state !== 'playing') break;
    f.at(note.at); f.key(String(note.lane + 1));
  }
  assert.equal(f.root.dataset.state, 'won');
  assert.equal(f.frames.size, 0);
  assert.equal(f.q('[data-flow-result]').hidden, false);
  assert.equal(f.win.document.activeElement, f.q('[data-flow-restart]'));
  assert.equal(f.events.filter(event => event.name === 'finish').length, 1);
  f.key('1'); f.frame(35000);
  assert.equal(f.events.filter(event => event.name === 'finish').length, 1);
  f.q('[data-flow-restart]').click(); f.q('[data-flow-start]').click(); f.frame(70000);
  assert.equal(f.root.dataset.state, 'lost');
  assert.equal(f.frames.size, 0);
  assert.equal(f.events.filter(event => event.name === 'finish').length, 2);
  assert.equal(f.win.document.activeElement, f.q('[data-flow-restart]'));
});

test('cleanup cancels frames, flashes, image races, dialog observers, and input handlers; remount is singular', async t => {
  const f = fixture(t), first = createFlow().notes[0];
  f.q('[data-flow-world="rush"]').click();
  const pending = f.images.at(-1), lateLoad = pending.onload;
  f.q('[data-flow-start]').click(); f.at(first.at); f.tap((first.lane + 1) % 3);
  assert.equal(f.timers.size, 1);
  f.cleanup();
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  assert.equal(f.root.querySelectorAll('.flow-note').length, 0);
  assert.equal(pending.onload, null); assert.equal(pending.onerror, null);
  const events = f.events.length, source = f.q('[data-flow-landscape]').getAttribute('src');
  lateLoad(); f.q('[data-flow-start]').click(); f.tap(0); f.key('1');
  f.q('#flow-settings').showModal(); await tick();
  assert.equal(f.events.length, events);
  assert.equal(f.q('[data-flow-landscape]').getAttribute('src'), source);
  f.q('#flow-settings').close(); f.remount();
  f.q('[data-flow-start]').click();
  assert.equal(f.frames.size, 1);
  assert.equal(f.events.length, events + 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountTakeoff } from '../src/lib/ten-doors/takeoff-client.mjs';
import { NOTES, PLANS, FLIGHT_MS, MAX_PLANES } from '../src/lib/ten-doors/takeoff.mjs';

const STORAGE = 'takeoff-organ:v2';

/**
 * Reuse the production island's actual controls. Only Astro's three static
 * maps are expanded here; browser QA checks the real server-rendered version.
 * The production controller, engine, renderer and audio helper all run.
 */
function setup(t, options = {}) {
  const source = readFileSync(new URL('../src/pages/takeoff-organ.astro', import.meta.url), 'utf8');
  const markup = source.replace(/^---[\s\S]*?---/, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/takeoff-organ/', pretendToBeVisual: true });
  const win = dom.window, doc = win.document;
  const root = doc.querySelector('[data-takeoff-v2]');
  assert.ok(root, 'the actual page exposes its instrument root');
  const padTemplate = root.querySelector('[data-to-lane]');
  assert.ok(padTemplate, 'the production pad template exists');
  const pads = NOTES.map((note, lane) => {
    const button = padTemplate.cloneNode(true);
    button.dataset.toLane = String(lane);
    button.setAttribute('aria-label', `Launch lane ${lane + 1}, ${note}`);
    return button;
  });
  root.querySelector('.to-pads').replaceChildren(...pads);
  const goalTemplate = root.querySelector('[data-goal-slot]');
  assert.ok(goalTemplate, 'the production goal template exists');
  root.querySelector('#to-goals').replaceChildren(...PLANS[0].lanes.map(() => goalTemplate.cloneNode(true)));
  const stampTemplate = root.querySelector('[data-stamp]');
  const stampLabel = root.querySelector('#to-stamp-label');
  assert.ok(stampTemplate && stampLabel, 'the production stamp templates exist');
  root.querySelector('#to-stamps').replaceChildren(...PLANS.map(plan => {
    const stamp = stampTemplate.cloneNode(true);
    stamp.dataset.stamp = plan.id; stamp.title = plan.title;
    return stamp;
  }), stampLabel);

  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  globalThis.window = win; globalThis.document = doc;
  let now = 0, nextId = 0, disposed = false;
  const frames = new Map(), timers = new Map();
  Object.defineProperty(win.performance, 'now', { value: () => now });
  win.requestAnimationFrame = callback => { frames.set(++nextId, callback); return nextId; };
  win.cancelAnimationFrame = id => frames.delete(id);
  win.setTimeout = (callback, delay) => { timers.set(++nextId, { callback, at: now + Number(delay || 0) }); return nextId; };
  win.clearTimeout = id => timers.delete(id);
  const media = new win.EventTarget();
  media.matches = Boolean(options.reducedMotion);
  win.matchMedia = () => media;
  const drawing = new Proxy({}, { get(target, name) {
    if (name in target) return target[name];
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => ({ addColorStop() {} });
    return () => {};
  } });
  win.HTMLCanvasElement.prototype.getContext = () => options.canvas === false ? null : drawing;
  root.querySelector('canvas').getBoundingClientRect = () => ({ width: 900, height: 400, x: 0, y: 0 });
  if (options.rawRecord !== undefined) win.localStorage.setItem(STORAGE, options.rawRecord);
  else if (options.record !== undefined) win.localStorage.setItem(STORAGE, JSON.stringify(options.record));
  if (options.blockStorage) Object.defineProperty(win, 'localStorage', { get() { throw new win.DOMException('Storage blocked', 'SecurityError'); } });

  const sounds = { attempted: 0, created: 0, closed: 0, oscillators: [], gains: [], contexts: [] };
  const param = () => ({ value: 0, setValueAtTime(value) { this.value = value; }, exponentialRampToValueAtTime(value) { this.value = value; }, cancelScheduledValues() {} });
  win.AudioContext = class {
    constructor() {
      sounds.attempted++;
      if (options.brokenAudio) throw new Error('Audio unavailable');
      sounds.created++; sounds.contexts.push(this);
      this.state = 'running'; this.destination = {}; this.offset = 0; this.frozenTime = 0;
    }
    get currentTime() { return this.state === 'suspended' ? this.frozenTime : now / 1000 - this.offset; }
    createGain() {
      const gain = { gain: param(), targets: new Set(), disconnected: false,
        connect(target) { this.targets.add(target); },
        disconnect() { this.targets.clear(); this.disconnected = true; },
      };
      sounds.gains.push(gain); return gain;
    }
    createOscillator() {
      const context = this;
      const oscillator = Object.assign(new win.EventTarget(), {
        frequency: param(), detune: param(), stops: [], starts: [], ended: false, context,
        connect() {},
        start(at) { this.starts.push(at); },
        stop(at) { this.stops.push(at === undefined ? context.currentTime : at); },
      });
      sounds.oscillators.push(oscillator);
      return oscillator;
    }
    suspend() { this.frozenTime = this.currentTime; this.state = 'suspended'; return Promise.resolve(); }
    resume() { if (this.state === 'suspended') this.offset = now / 1000 - this.frozenTime; this.state = 'running'; return Promise.resolve(); }
    close() { if (this.state !== 'closed') { this.state = 'closed'; sounds.closed++; } return Promise.resolve(); }
  };
  let cleanup = mountTakeoff(root);
  assert.equal(typeof cleanup, 'function');
  function tick(at) {
    now = at;
    for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
    for (const oscillator of sounds.oscillators) {
      if (!oscillator.ended && oscillator.stops.length && oscillator.stops.at(-1) <= oscillator.context.currentTime) {
        oscillator.ended = true; oscillator.dispatchEvent(new win.Event('ended'));
      }
    }
    const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now));
  }
  function dispose() {
    if (disposed) return; disposed = true;
    cleanup();
    // The shared helper owns its context in the real page. Close the test's
    // fake contexts explicitly so no audio singleton leaks into another case.
    sounds.contexts.forEach(context => context.close());
    win.close();
    if (globalThis.window === win) {
      if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    }
  }
  t.after(dispose);
  const get = id => {
    const element = root.querySelector(`#to-${id}`);
    assert.ok(element, `production #to-${id} exists`); return element;
  };
  return {
    root, win, doc, get, pads, frames, timers, sounds, dispose,
    click(id) { get(id).click(); },
    lane(lane) { pads[lane].click(); },
    key(target, key, init = {}) {
      const event = new win.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...init });
      target.dispatchEvent(event); return event;
    },
    run(ms) { const until = now + ms; while (now < until) tick(Math.min(until, now + 20)); },
    frame: tick,
    reduce(value) { media.matches = value; media.dispatchEvent(new win.Event('change')); },
    hidden(value) { Object.defineProperty(doc, 'hidden', { configurable: true, value }); doc.dispatchEvent(new win.Event('visibilitychange')); },
    record() { return JSON.parse(win.localStorage.getItem(STORAGE) || 'null'); },
    cleanup() { cleanup(); },
    remount() { cleanup(); cleanup = mountTakeoff(root); },
    airborne() { return Number(root.dataset.inAir); },
    clearGoals() { return root.querySelectorAll('[data-goal-slot].is-clear').length; },
    earned() { return [...root.querySelectorAll('[data-stamp].is-earned')].map(stamp => stamp.dataset.stamp); },
    suspendAudio() { sounds.contexts.forEach(context => context.suspend()); },
  };
}

test('default play is silent, and only an explicit sound opt-in creates audio', t => {
  const room = setup(t);
  assert.equal(room.sounds.created, 0);
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'false');
  room.lane(0); room.lane(3); room.lane(5); room.run(FLIGHT_MS);
  assert.equal(room.root.dataset.phase, 'complete');
  assert.equal(room.sounds.attempted, 0, 'launches and the completion chime remain silent by default');
  room.click('sound');
  assert.equal(room.sounds.created, 1);
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'true');
  room.lane(2);
  assert.equal(room.sounds.oscillators.length, 3, 'one organ note has three bounded partials');
  room.click('sound');
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'false');
  assert.ok(room.sounds.oscillators.every(voice => voice.stops.some(at => at <= FLIGHT_MS / 1000 + 0.05)));
});

test('number shortcuts stay inside the instrument and ignore typing, Ctrl/Meta/Alt, repeat and Shift+Tab', t => {
  const room = setup(t);
  room.key(room.doc.body, '1');
  room.key(room.win, '2');
  const input = room.doc.createElement('input'); room.root.append(input);
  const editable = room.doc.createElement('div'); editable.setAttribute('contenteditable', 'true'); room.root.append(editable);
  room.key(input, '3'); room.key(editable, '4');
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) room.key(room.root, '5', { [modifier]: true });
  room.key(room.root, '6', { repeat: true });
  const tab = room.key(room.pads[0], 'Tab', { shiftKey: true });
  assert.equal(tab.defaultPrevented, false);
  assert.equal(room.airborne(), 0);
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'false');
  room.key(room.root, '8');
  assert.equal(room.airborne(), 1);
  assert.match(room.get('status').textContent, /Lane 8, G4 taking off/);
  const repeated = room.key(room.pads[0], 'Enter', { repeat: true });
  assert.equal(repeated.defaultPrevented, true, 'held Enter must not repeatedly activate a native pad');
  assert.equal(room.airborne(), 1);
  room.key(room.root, ' ');
  assert.equal(room.root.dataset.paused, 'true');
  room.key(input, ' ');
  assert.equal(room.root.dataset.paused, 'true', 'typing Space must not resume the sky');
  room.key(room.root, 'Escape');
  assert.equal(room.root.dataset.paused, 'false');
});

test('wrong and duplicate notes fly freely but only real target arrivals clear a chord', t => {
  const room = setup(t);
  room.lane(0); room.lane(0); room.lane(1);
  assert.equal(room.airborne(), 3);
  assert.equal(room.clearGoals(), 0);
  room.run(FLIGHT_MS - 1);
  assert.equal(room.clearGoals(), 0);
  room.run(1);
  assert.equal(room.clearGoals(), 1);
  assert.equal(room.get('next').disabled, true);
  room.lane(3); room.lane(5); room.run(FLIGHT_MS);
  assert.equal(room.clearGoals(), 3);
  assert.equal(room.root.dataset.phase, 'complete');
  assert.equal(room.get('next').disabled, false);
  assert.deepEqual(room.earned(), [PLANS[0].id]);
  assert.deepEqual(room.record(), { version: 2, planIndex: 0, stamps: [PLANS[0].id] });
  room.lane(0); room.run(FLIGHT_MS);
  assert.deepEqual(room.earned(), [PLANS[0].id]);
  assert.equal(room.record().stamps.length, 1);
});

test('reduced motion and switching the preference settle the same chord without an idle animation', t => {
  const room = setup(t, { reducedMotion: true });
  assert.equal(room.frames.size, 0);
  room.lane(0); room.lane(3); room.lane(5);
  assert.equal(room.airborne(), 0);
  assert.equal(room.clearGoals(), 3);
  assert.equal(room.root.dataset.phase, 'complete');
  assert.equal(room.frames.size, 0);
  room.click('next');
  room.reduce(false);
  for (const lane of PLANS[1].lanes) room.lane(lane);
  assert.equal(room.airborne(), 3);
  room.reduce(true);
  assert.equal(room.clearGoals(), 3);
  assert.equal(room.root.dataset.phase, 'complete');
  room.run(20);
  assert.equal(room.frames.size, 0);
  assert.deepEqual(room.earned(), [PLANS[0].id, PLANS[1].id]);
});

test('pause stops audio and Auto fly, freezes pending notes, and resumes only on request', t => {
  const room = setup(t);
  room.click('sound'); room.click('free-mode'); room.click('auto'); room.run(2500);
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'true');
  assert.equal(room.airborne(), 2);
  const created = room.sounds.oscillators.length;
  room.click('pause');
  const stoppedAt = 2.55;
  assert.equal(room.root.dataset.paused, 'true');
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'false');
  assert.equal(room.get('auto').disabled, true);
  assert.equal(room.frames.size, 0);
  assert.ok(room.sounds.oscillators.every(voice => voice.stops.some(at => at <= stoppedAt)));
  room.run(10000);
  assert.equal(room.airborne(), 2);
  assert.equal(room.sounds.oscillators.length, created);
  room.hidden(true); room.hidden(false);
  assert.equal(room.root.dataset.paused, 'true', 'returning to the tab does not start playback');
  room.click('pause');
  assert.equal(room.root.dataset.paused, 'false');
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'false');
  room.run(FLIGHT_MS);
  assert.equal(room.airborne(), 0);
  assert.deepEqual(room.earned(), [], 'automatic free play does not earn guided stamps');
});

test('pause disconnects sounding gains immediately even after the audio clock is suspended', t => {
  const room = setup(t);
  room.click('sound'); room.lane(0); room.run(200);
  const context = room.sounds.contexts[0];
  const master = room.sounds.gains.find(gain => gain.targets.has(context.destination));
  const sounding = room.sounds.gains.filter(gain => gain.targets.has(master));
  assert.equal(sounding.length, 1);
  room.suspendAudio();
  const frozenTime = context.currentTime;
  room.click('pause');
  assert.ok(sounding.every(gain => gain.disconnected), 'a fade scheduled on a frozen clock cannot provide immediate silence');
  assert.ok(room.sounds.oscillators.every(voice => voice.stops.at(-1) <= frozenTime));
  room.run(5000);
  assert.equal(context.currentTime, frozenTime);
  assert.equal(room.root.dataset.paused, 'true');
  const before = room.sounds.oscillators.length;
  room.click('pause');
  assert.equal(context.state, 'running');
  assert.equal(room.sounds.oscillators.length, before + 3, 'explicit Resume creates a fresh voice for the still-flying note');
});

test('reselecting the current mode preserves flights and active Auto fly', t => {
  const room = setup(t);
  room.lane(0); room.lane(3);
  room.click('guide-mode');
  assert.equal(room.airborne(), 2);
  room.run(FLIGHT_MS);
  assert.equal(room.clearGoals(), 2);
  room.click('free-mode'); room.click('auto');
  room.click('free-mode');
  assert.equal(room.airborne(), 1);
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'true');
});

test('clear sky and next chord stop old flights and their notes without delayed progress', t => {
  const room = setup(t);
  room.click('sound'); room.lane(0); room.lane(3); room.run(500);
  room.click('clear');
  assert.equal(room.airborne(), 0);
  assert.equal(room.clearGoals(), 0);
  assert.equal(room.frames.size, 0);
  const before = room.sounds.oscillators.length;
  room.run(5000);
  assert.equal(room.sounds.oscillators.length, before);
  assert.equal(room.root.dataset.phase, 'playing');
  room.lane(0); room.lane(3); room.lane(5); room.run(FLIGHT_MS);
  assert.equal(room.root.dataset.phase, 'complete');
  room.click('next');
  assert.equal(room.get('title').textContent, PLANS[1].title);
  assert.equal(room.airborne(), 0);
  assert.equal(room.clearGoals(), 0);
  assert.equal(room.root.dataset.phase, 'playing');
  const afterNext = room.sounds.oscillators.length;
  room.run(5000);
  assert.equal(room.sounds.oscillators.length, afterNext);
  assert.deepEqual(room.record(), { version: 2, planIndex: 1, stamps: [PLANS[0].id] });
});

test('cleanup and remount restore only earned progress with sound and Auto fly off', t => {
  const room = setup(t, { reducedMotion: true });
  room.lane(0); room.lane(3); room.lane(5); room.click('next');
  room.click('sound'); room.click('free-mode'); room.click('auto');
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'true');
  room.cleanup();
  assert.equal(room.frames.size, 0);
  assert.equal(room.timers.size, 0);
  assert.ok(room.pads.every(pad => pad.disabled));
  const count = room.sounds.oscillators.length;
  room.key(room.root, '1'); room.run(8000);
  assert.equal(room.sounds.oscillators.length, count, 'aborted listeners and schedules cannot create notes');
  room.remount();
  assert.equal(room.root.dataset.mode, 'guide');
  assert.equal(room.root.dataset.paused, 'false');
  assert.equal(room.root.dataset.phase, 'playing');
  assert.equal(room.airborne(), 0);
  assert.equal(room.get('title').textContent, PLANS[1].title);
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'false');
  assert.equal(room.get('sound').querySelector('[data-sound-label]').textContent, 'Sound off');
  assert.equal(room.get('auto').getAttribute('aria-pressed'), 'false');
  assert.equal(room.get('auto').hidden, true);
  assert.deepEqual(room.earned(), [PLANS[0].id]);
  assert.deepEqual(Object.keys(room.record()), ['version', 'planIndex', 'stamps']);
  room.lane(1);
  assert.equal(room.sounds.oscillators.length, count, 'a remounted instrument is silent until opted in again');
});

test('the controller rejects excess taps before creating more audio voices', t => {
  const room = setup(t);
  room.click('sound');
  for (let i = 0; i < MAX_PLANES + 40; i++) room.lane(i % NOTES.length);
  assert.equal(room.airborne(), MAX_PLANES);
  assert.equal(room.sounds.oscillators.length, MAX_PLANES * 3);
  assert.match(room.get('status').textContent, /sky is full/);
});

test('malformed stored progress is repaired without starting playback', t => {
  const room = setup(t, { rawRecord: '{not json' });
  assert.equal(room.get('title').textContent, PLANS[0].title);
  assert.deepEqual(room.earned(), []);
  assert.equal(room.airborne(), 0);
  assert.equal(room.sounds.attempted, 0);
});

test('blocked storage does not prevent playing and completing a quiet chord', t => {
  const room = setup(t, { blockStorage: true, reducedMotion: true });
  room.lane(0); room.lane(3); room.lane(5);
  assert.equal(room.root.dataset.phase, 'complete');
  assert.deepEqual(room.earned(), [PLANS[0].id]);
  room.click('next');
  assert.equal(room.get('title').textContent, PLANS[1].title);
});

test('unavailable Canvas and Audio expose quiet fallback while native notes still complete goals', t => {
  const room = setup(t, { canvas: false, brokenAudio: true });
  assert.equal(room.get('sky').hidden, true);
  assert.equal(room.root.querySelector('.to-scene-fallback').hidden, false);
  room.click('sound');
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'false');
  assert.match(room.get('status').textContent, /Sound is unavailable/);
  room.lane(0); room.lane(3); room.lane(5);
  assert.equal(room.root.dataset.phase, 'complete');
  assert.deepEqual(room.earned(), [PLANS[0].id]);
  assert.equal(room.frames.size, 0);
});

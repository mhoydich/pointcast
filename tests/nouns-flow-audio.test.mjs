import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountNounsFlowAudio } from '../src/lib/nouns-flow-audio.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const markup = `<section id="nouns-flow"><button data-flow-start>Start</button>
<button data-flow-sound></button><button data-flow-haptics></button><span data-flow-haptics-note></span>
<select data-flow-pace><option value="drift">Drift</option><option value="gentle" selected>Gentle</option><option value="playful">Playful</option></select>
<input type="range" data-flow-volume min="0" max="100"><span data-flow-volume-value></span>
<button data-flow-lane="0">D</button><button data-flow-lane="1">F</button><button data-flow-lane="2">J</button></section>`;
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { resolve, promise }; };
class Param {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class AudioNode {
  disconnected = false;
  connect(target) { return target; }
  disconnect() { this.disconnected = true; }
}
class Source extends AudioNode {
  frequency = new Param(); ended = []; started = false; stopped = false; startAt = null; stopAt = null;
  addEventListener(type, callback) { if (type === 'ended') this.ended.push(callback); }
  start(at = 0) { this.started = true; this.startAt = at; }
  stop(at) {
    this.stopAt = at;
    if (at === undefined && !this.stopped) { this.stopped = true; for (const callback of this.ended) callback(); }
  }
}
function fixture(t, { noAudio = false, vibration, delayedResume = false, storage = {} } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games/flow', pretendToBeVisual: true });
  const win = dom.window, doc = win.document, root = doc.querySelector('#nouns-flow');
  const q = selector => root.querySelector(selector);
  let visibility = 'visible';
  Object.defineProperty(doc, 'visibilityState', { get: () => visibility });
  const contexts = [], vibrations = [], pendingResumes = [];
  let timers = 0;
  t.mock.method(win, 'setTimeout', () => { timers++; throw new Error('Audio must follow controller events, not schedule a second clock.'); });
  if (vibration !== undefined) Object.defineProperty(win.navigator, 'vibrate', { value: value => { vibrations.push(value); return vibration; } });
  class Context {
    state = 'suspended'; currentTime = 10; destination = new AudioNode(); sources = []; gains = [];
    resumeCalls = 0; suspendCalls = 0; closeCalls = 0;
    constructor() { contexts.push(this); }
    addEventListener() {}
    createGain() { const node = new AudioNode(); node.gain = new Param(); this.gains.push(node); return node; }
    createBiquadFilter() { const node = new AudioNode(); node.frequency = new Param(); node.Q = new Param(); return node; }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    async resume() { this.resumeCalls++; if (delayedResume) { const request = deferred(); pendingResumes.push(request); await request.promise; } this.state = 'running'; }
    async suspend() { this.suspendCalls++; this.state = 'suspended'; }
    async close() { this.closeCalls++; this.state = 'closed'; }
  }
  if (!noAudio) win.AudioContext = Context;
  for (const [key, value] of Object.entries(storage)) win.localStorage.setItem(`pointcast:starjam:${key}`, value);
  const handlers = new Map();
  for (const node of [root, doc]) {
    const original = node.addEventListener;
    handlers.set(node, new Map());
    t.mock.method(node, 'addEventListener', function(type, listener, options) {
      const list = handlers.get(node);
      if (!list.has(type)) list.set(type, []);
      list.get(type).push(listener);
      return original.call(this, type, listener, options);
    });
  }
  const unmount = mountNounsFlowAudio(root);
  let mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  t.after(() => { cleanup(); dom.window.close(); });
  // JSDOM cannot generate trusted browser input. Invoke the actual captured
  // listener for gesture branches; synthetic-event checks dispatch real events.
  const trusted = (node, type, target, fields = {}) => {
    for (const callback of handlers.get(node)?.get(type) || []) callback({ target, isTrusted: true, ...fields });
  };
  const click = selector => trusted(root, 'click', q(selector));
  const lane = number => trusted(root, 'pointerdown', q(`[data-flow-lane="${number}"]`), { button: 0 });
  const key = (key, fields = {}) => trusted(doc, 'keydown', doc.body, { key, ...fields });
  const emit = (type, value = {}) => root.dispatchEvent(new win.CustomEvent(`nouns-flow:${type}`, { detail: { pace: 'gentle', world: 'garden', ...value } }));
  const start = value => { click('[data-flow-start]'); emit('start', { bpm: 96, durationMs: 35000, ...value }); };
  const hit = (value = {}) => emit('hit', { lane: 0, grade: 'perfect', combo: 1, elapsedMs: 2500, ...value });
  const active = () => contexts.flatMap(context => context.sources).filter(source => source.started && !source.stopped);
  const visible = value => { visibility = value ? 'visible' : 'hidden'; doc.dispatchEvent(new win.Event('visibilitychange')); };
  const volume = value => { q('[data-flow-volume]').value = String(value); q('[data-flow-volume]').dispatchEvent(new win.Event('input')); };
  return { win, doc, root, q, contexts, vibrations, pendingResumes, cleanup, click, lane, key, emit, start, hit, active, visible, volume, timers: () => timers };
}

test('page load, restored preferences and synthetic start/beat/hit events do not unlock sound or haptics', async t => {
  const f = fixture(t, { vibration: true, storage: { volume: '120' } });
  assert.equal(f.q('[data-flow-volume]').value, '100');
  assert.equal(f.q('[data-flow-haptics]').getAttribute('aria-pressed'), 'false');
  f.q('[data-flow-start]').click(); f.q('[data-flow-haptics]').click();
  f.emit('start'); f.emit('beat', { index: 0 }); f.hit(); await tick();
  assert.equal(f.contexts.length, 0);
  assert.equal(f.vibrations.filter(value => value !== 0).length, 0);
  assert.equal(f.timers(), 0);
});

test('trusted start plays two pads and controller beats without any separate clock or duplicate beat', async t => {
  const f = fixture(t);
  f.start(); await tick();
  assert.equal(f.contexts.length, 1);
  assert.equal(f.active().length, 2);
  f.emit('beat', { index: 0, intervalMs: 625 });
  const sources = f.contexts[0].sources.length;
  assert.equal(sources, 3);
  f.emit('beat', { index: 0, intervalMs: 625 });
  assert.equal(f.contexts[0].sources.length, sources);
  await tick(); assert.equal(f.contexts[0].sources.length, sources);
  assert.equal(f.timers(), 0);
});

test('lane gestures produce distinct musical notes while rapid hits stay within six effects plus two pads', async t => {
  const f = fixture(t);
  f.start({ pace: 'playful', bpm: 120 }); await tick();
  const frequencies = [];
  for (let lane = 0; lane < 3; lane++) {
    f.lane(lane); f.hit({ lane, grade: 'good', elapsedMs: 2500 + lane, pace: 'playful' });
    frequencies.push(f.contexts[0].sources.at(-1).frequency.value);
  }
  assert.ok(frequencies[0] < frequencies[1] && frequencies[1] < frequencies[2]);
  for (let index = 0; index < 30; index++) f.hit({ lane: index % 3, combo: 8, elapsedMs: 3000 + index });
  assert.ok(f.active().length <= 8);
  const count = f.contexts[0].sources.length;
  f.hit({ lane: 2, combo: 8, elapsedMs: 3029 });
  assert.equal(f.contexts[0].sources.length, count, 'duplicate hit emits no second sound');
});

test('mute immediately stops pending notes and pads, and volume changes cannot unmute or resume', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.hit({ combo: 8 });
  f.click('[data-flow-sound]'); await tick();
  assert.equal(f.active().length, 0);
  assert.equal(f.contexts[0].state, 'suspended');
  const calls = f.contexts[0].resumeCalls;
  f.root.dataset.state = 'playing';
  f.click('[data-flow-start]');
  f.volume(80); f.emit('beat', { index: 1 }); f.hit({ elapsedMs: 3000 });
  assert.equal(f.contexts[0].resumeCalls, calls);
  assert.equal(f.active().length, 0);
  assert.equal(f.q('[data-flow-sound]').getAttribute('aria-pressed'), 'false');
  assert.equal(f.win.localStorage.getItem('pointcast:starjam:sound'), 'off');
});

test('zero volume stops playback and a later lane gesture is required to restore it', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.volume(0); await tick();
  f.volume(40); f.emit('beat', { index: 1 }); await tick();
  assert.equal(f.active().length, 0);
  assert.equal(f.contexts[0].state, 'suspended');
  f.lane(1); await tick();
  assert.equal(f.contexts[0].state, 'running');
  assert.equal(f.active().length, 2);
  assert.equal(f.win.localStorage.getItem('pointcast:starjam:volume'), '40');
});

test('pause and hidden tabs stop sound; return and synthetic resume cannot restart a run', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.visible(false); await tick(); f.visible(true);
  f.emit('start', { resumed: true }); f.emit('beat', { index: 1 }); f.hit();
  assert.equal(f.active().length, 0);
  f.start({ resumed: true }); await tick();
  assert.equal(f.active().length, 2);
  f.emit('pause', { paused: true, reason: 'manual' }); await tick();
  assert.equal(f.active().length, 0);
  const calls = f.contexts[0].resumeCalls;
  f.emit('world', { world: 'storm' }); f.emit('beat', { index: 2 });
  assert.equal(f.contexts[0].resumeCalls, calls);
  assert.equal(f.root.dataset.flowAudioWorld, 'storm');
});

test('finish removes pads and schedules a finite musical phrase, with no further beat playback', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.emit('finish', { status: 'won' });
  assert.equal(f.active().length, 4);
  assert.ok(f.active().every(source => Number.isFinite(source.stopAt) && source.stopAt <= 10.61));
  const count = f.contexts[0].sources.length;
  f.emit('beat', { index: 8 }); f.hit({ elapsedMs: 35000 }); f.emit('finish', { status: 'won' });
  assert.equal(f.contexts[0].sources.length, count);
  f.cleanup(); assert.equal(f.active().length, 0);
});

test('haptics are opt-in and only follow a matching recent player hit during the owned run', async t => {
  const f = fixture(t, { vibration: true });
  f.click('[data-flow-haptics]');
  assert.equal(f.contexts.length, 0);
  assert.equal(f.vibrations.length, 0, 'enabling haptics has no unsolicited confirmation buzz');
  f.start(); await tick();
  f.hit(); assert.equal(f.vibrations.length, 0);
  f.lane(1); f.hit({ lane: 0, elapsedMs: 2600 }); assert.equal(f.vibrations.length, 0);
  f.hit({ lane: 1, elapsedMs: 2601 }); assert.equal(f.vibrations.at(-1), 12);
  const count = f.vibrations.length;
  f.hit({ lane: 1, elapsedMs: 2602 }); assert.equal(f.vibrations.length, count);
  f.lane(2); f.emit('miss', { lane: 2 }); f.hit({ lane: 2, elapsedMs: 2603 });
  assert.equal(f.vibrations.length, count, 'a miss clears the gesture instead of buzzing on a later unrelated hit');
  f.emit('pause'); assert.equal(f.vibrations.at(-1), 0);
  assert.match(f.q('[data-flow-haptics-note]').textContent, /Requires device vibration hardware/);
});

test('keyboard lanes unlock before controller events, while repeats and modifiers are ignored', async t => {
  const f = fixture(t);
  f.key('D', { repeat: true }); assert.equal(f.contexts.length, 0);
  f.key('F', { ctrlKey: true }); assert.equal(f.contexts.length, 0);
  f.key('J'); await tick();
  assert.equal(f.contexts.length, 1);
  assert.equal(f.active().length, 0, 'a pad alone does not start a song');
});

test('delayed browser resume plays only the newest beat instead of a burst of old beat cues', async t => {
  const f = fixture(t, { delayedResume: true });
  f.start();
  for (let index = 0; index < 8; index++) f.emit('beat', { index, intervalMs: 625 });
  f.pendingResumes[0].resolve(); await tick();
  assert.equal(f.contexts[0].sources.length, 3, 'two pads and the latest beat only');
  assert.equal(f.timers(), 0);
});

for (const end of ['mute', 'pause', 'unmount']) {
  test(`a delayed AudioContext resume cannot restart sound after ${end}`, async t => {
    const f = fixture(t, { delayedResume: true });
    f.start(); assert.equal(f.pendingResumes.length, 1);
    if (end === 'mute') f.click('[data-flow-sound]');
    else if (end === 'pause') f.emit('pause');
    else f.cleanup();
    f.pendingResumes[0].resolve(); await tick();
    assert.equal(f.active().length, 0);
    assert.equal(f.contexts[0].state, end === 'unmount' ? 'closed' : 'suspended');
  });
}

test('unsupported audio and rejected vibration are reported honestly', async t => {
  const f = fixture(t, { noAudio: true, vibration: false });
  assert.equal(f.q('[data-flow-sound]').disabled, true);
  f.click('[data-flow-haptics]'); f.start(); f.lane(0); f.hit();
  assert.equal(f.q('[data-flow-haptics]').disabled, true);
  assert.equal(f.q('[data-flow-haptics]').textContent, 'Haptic taps · unavailable');
  assert.equal(f.contexts.length, 0);
});

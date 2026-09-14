import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountCoGamesAudio } from '../src/lib/co-games-audio.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const markup = `<section id="game" data-mode="practice" data-status="playing" data-encounter="garden">
<button data-sound></button><select data-sound-mood><option value="drift">Drift</option><option value="gentle">Gentle</option><option value="playful">Playful</option></select>
<input data-volume type="range" min="0" max="100"><output data-volume-value></output>
<button data-haptics></button><p data-haptics-note></p>
<button data-card="ember" aria-pressed="false">Ember</button><button data-card="root" aria-pressed="false">Root</button><button data-card="focus" aria-pressed="false">Focus</button>
<button data-cast>Play</button><button data-request>Play with AI</button><button data-replay>Again</button><button data-cancel>Cancel</button>
</section>`;
function deferred() { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; }
class Parameter {
  value = 0; operations = [];
  setValueAtTime(value, at) { this.value = value; this.operations.push({ kind: 'set', value, at }); }
  linearRampToValueAtTime(value, at) { this.value = value; this.operations.push({ kind: 'linear', value, at }); }
  exponentialRampToValueAtTime(value, at) { this.value = value; this.operations.push({ kind: 'exponential', value, at }); }
  cancelScheduledValues() {}
}
class AudioNode {
  connections = []; disconnected = false;
  connect(target) { this.connections.push(target); return target; }
  disconnect() { this.disconnected = true; this.connections = []; }
}
class Source extends AudioNode {
  frequency = new Parameter(); type = 'sine'; stopped = false; started = false; stopAt = null; ended = [];
  addEventListener(type, listener) { if (type === 'ended') this.ended.push(listener); }
  start() { this.started = true; }
  stop(at) {
    this.stopAt = at;
    if (at === undefined && !this.stopped) { this.stopped = true; for (const listener of this.ended) listener(); }
  }
}
function fixture(t, { storage = {}, vibration, noAudio = false, delayedResume = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games', pretendToBeVisual: true });
  const win = dom.window, doc = win.document, root = doc.getElementById('game');
  let visibility = 'visible', now = 0, nextTimer = 1;
  const timers = new Map(), instances = [], vibrations = [], resumes = [];
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => visibility });
  win.setTimeout = (callback, delay = 0) => { const id = nextTimer++; timers.set(id, { callback, at: now + delay }); return id; };
  win.clearTimeout = id => timers.delete(id);
  if (vibration !== undefined) Object.defineProperty(win.navigator, 'vibrate', { configurable: true, value: pattern => { vibrations.push(pattern); return vibration; } });
  class Context {
    state = 'suspended'; currentTime = 1; sampleRate = 48000; destination = new AudioNode();
    sources = []; gains = []; buffers = []; listeners = []; resumeCalls = 0; suspendCalls = 0; closeCalls = 0;
    constructor() { instances.push(this); }
    addEventListener(type, callback) { if (type === 'statechange') this.listeners.push(callback); }
    changed() { for (const callback of this.listeners) callback(); }
    createGain() { const gain = new AudioNode(); gain.gain = new Parameter(); this.gains.push(gain); return gain; }
    createBiquadFilter() { const filter = new AudioNode(); filter.frequency = new Parameter(); filter.Q = new Parameter(); return filter; }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    createBufferSource() { const source = new Source(); source.kind = 'noise'; this.sources.push(source); return source; }
    createBuffer(channels, length) { const data = new Float32Array(length); const buffer = { getChannelData: () => data }; this.buffers.push(buffer); return buffer; }
    async resume() {
      this.resumeCalls++;
      if (delayedResume) { const ready = deferred(); resumes.push(ready); await ready.promise; }
      this.state = 'running'; this.changed();
    }
    async suspend() { this.suspendCalls++; this.state = 'suspended'; this.changed(); }
    async close() { this.closeCalls++; this.state = 'closed'; }
  }
  if (!noAudio) win.AudioContext = Context;
  for (const [key, value] of Object.entries(storage)) win.localStorage.setItem(`pointcast:co-games:${key}`, value);
  const q = selector => root.querySelector(selector);
  const handlers = new Map();
  for (const node of [root, doc, q('[data-sound-mood]'), q('[data-volume]')]) {
    const original = node.addEventListener;
    const list = new Map(); handlers.set(node, list);
    t.mock.method(node, 'addEventListener', function (type, listener, options) {
      if (!list.has(type)) list.set(type, []);
      list.get(type).push(listener);
      return original.call(this, type, listener, options);
    });
  }
  const unmount = mountCoGamesAudio(root);
  let mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  t.after(() => { cleanup(); win.close(); });
  // JSDOM cannot manufacture trusted browser events. Invoke the captured real
  // listeners with the same event fields, while synthetic-event tests dispatch normally.
  const trusted = (node, type, target, fields = {}) => {
    for (const handler of handlers.get(node)?.get(type) || []) handler.call(node, { isTrusted: true, target, ...fields });
  };
  const click = selector => trusted(root, 'click', q(selector));
  const mood = value => { q('[data-sound-mood]').value = value; trusted(q('[data-sound-mood]'), 'change', q('[data-sound-mood]')); };
  const volume = value => { q('[data-volume]').value = String(value); trusted(q('[data-volume]'), 'input', q('[data-volume]')); };
  const turn = overrides => root.dispatchEvent(new win.CustomEvent('co-games:turn', { detail: {
    human: 'ember', support: 'echo', round: 1, taken: 3, healing: 0, status: 'playing', ...overrides,
  } }));
  const match = encounter => root.dispatchEvent(new win.CustomEvent('co-games:match', { detail: { encounter } }));
  const advance = milliseconds => {
    const end = now + milliseconds; let calls = 0;
    while (true) {
      const entry = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      if (++calls > 100) throw new Error('Unbounded audio scheduling');
      now = entry[1].at; timers.delete(entry[0]); entry[1].callback();
    }
    now = end;
  };
  const visible = value => { visibility = value ? 'visible' : 'hidden'; doc.dispatchEvent(new win.Event('visibilitychange')); };
  const active = () => instances.flatMap(context => context.sources).filter(source => source.started && !source.stopped);
  return { win, doc, root, q, instances, vibrations, resumes, timers, click, mood, volume, turn, match, advance, visible, active, cleanup, trusted };
}

test('initial, synthetic and AI-only events cannot unlock audio or haptics', async t => {
  const f = fixture(t, { vibration: true });
  assert.equal(f.q('[data-sound-mood]').value, 'gentle');
  assert.equal(f.q('[data-volume]').value, '35');
  assert.equal(f.q('[data-haptics]').getAttribute('aria-pressed'), 'false');
  f.q('[data-cast]').click(); f.q('[data-haptics]').click(); f.turn({}); f.match('storm'); await tick();
  assert.equal(f.instances.length, 0);
  assert.equal(f.vibrations.filter(value => value !== 0).length, 0);
  assert.equal(f.root.dataset.audioState, 'locked');
  assert.equal(f.root.dataset.audioWorld, 'moon');
});

test('trusted play starts only two restrained pads and mute immediately stops all sound and pending cues', async t => {
  const f = fixture(t);
  f.click('[data-cast]'); await tick();
  assert.equal(f.instances.length, 1);
  const context = f.instances[0];
  assert.equal(f.active().length, 4, 'two carriers and two slow modulation oscillators');
  assert.equal(context.gains[0].gain.value, 0.28 * 0.35);
  f.turn({ combo: { name: 'Fireworks' }, status: 'won' }); f.advance(200);
  assert.ok(f.timers.size > 0);
  f.click('[data-sound]'); await tick();
  assert.equal(f.active().length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(context.gains[0].gain.value, 0);
  assert.equal(context.state, 'suspended');
  const count = context.sources.length;
  f.advance(5000); f.turn({ round: 2 }); f.match('shell');
  assert.equal(context.sources.length, count);
  assert.equal(f.win.localStorage.getItem('pointcast:co-games:sound'), 'off');
});

test('Drift stays soft, Gentle is melodic, and Playful retains bounded chiptune effects', async t => {
  const f = fixture(t);
  f.mood('drift'); await tick();
  const context = f.instances[0];
  const driftStart = context.sources.length;
  f.click('[data-cast]'); f.turn({ status: 'won', combo: { name: 'Fireworks' } }); f.advance(2000);
  assert.equal(context.sources.length - driftStart, 1, 'Drift uses one soft confirmation instead of a fanfare');
  assert.equal(context.sources.at(-1).type, 'sine');
  assert.equal(f.timers.size, 0);
  f.mood('gentle'); await tick(); f.match('garden');
  const gentleStart = context.sources.length;
  f.turn({}); f.advance(2000);
  const gentleNotes = context.sources.slice(gentleStart);
  assert.ok(gentleNotes.length > 1);
  assert.ok(gentleNotes.every(source => source.type === 'sine' && source.kind !== 'noise'));
  f.mood('playful'); await tick(); f.match('rush');
  const playfulStart = context.sources.length;
  f.turn({ status: 'won', combo: { name: 'Fireworks' } }); f.advance(3000);
  const playfulNotes = context.sources.slice(playfulStart);
  assert.ok(playfulNotes.some(source => source.type === 'square'));
  assert.ok(playfulNotes.some(source => source.kind === 'noise'));
  assert.ok(f.active().length <= 10, 'at most six effect voices plus two modulated pads');
  assert.equal(f.win.localStorage.getItem('pointcast:co-games:sound-mood'), 'playful');
});

test('world changes replace the pad palette and reset rounds without unlocking a muted context', async t => {
  const f = fixture(t);
  f.click('[data-cast]'); await tick();
  const context = f.instances[0], garden = f.active().filter(source => source.frequency.value > 1).map(source => source.frequency.value);
  f.match('shell');
  const tide = f.active().filter(source => source.frequency.value > 1).map(source => source.frequency.value);
  assert.notDeepEqual(tide, garden);
  assert.equal(f.root.dataset.audioWorld, 'tide');
  assert.equal(f.active().length, 4);
  f.turn({}); f.advance(2000); const played = context.sources.length;
  f.turn({}); f.advance(2000); assert.equal(context.sources.length, played, 'duplicate turn is silent');
  f.match('storm'); f.turn({}); f.advance(2000);
  assert.ok(context.sources.length > played);
  assert.equal(f.root.dataset.audioWorld, 'moon');
  f.click('[data-sound]'); const resumes = context.resumeCalls;
  f.match('rush'); await tick();
  assert.equal(f.root.dataset.audioWorld, 'diner');
  assert.equal(context.resumeCalls, resumes);
  assert.equal(f.active().length, 0);
});

test('volume is bounded and persisted, zero stops sound, and preference restoration never starts it', async t => {
  const f = fixture(t, { storage: { volume: '120', 'sound-mood': 'bad-value', sound: 'off' } });
  assert.equal(f.q('[data-volume]').value, '100');
  assert.equal(f.q('[data-sound-mood]').value, 'gentle');
  assert.equal(f.instances.length, 0);
  f.volume(15); assert.equal(f.instances.length, 0, 'volume does not override mute');
  f.click('[data-sound]'); await tick();
  assert.equal(f.instances[0].gains[0].gain.value, 0.28 * 0.15);
  f.volume(0); await tick();
  assert.equal(f.active().length, 0);
  assert.equal(f.instances[0].state, 'suspended');
  assert.equal(f.q('[data-volume]').getAttribute('aria-valuetext'), '0 percent');
  assert.equal(f.win.localStorage.getItem('pointcast:co-games:volume'), '0');
  f.q('[data-volume]').value = '99'; f.q('[data-volume]').dispatchEvent(new f.win.Event('input'));
  assert.equal(f.q('[data-volume]').value, '99', 'accessible input updates the preference');
  assert.equal(f.instances[0].state, 'suspended', 'preference changes cannot resume playback');
  assert.equal(f.active().length, 0);
});

test('hidden pages cancel pads, cues and vibration and remain silent until another trusted gesture', async t => {
  const f = fixture(t, { vibration: true });
  f.click('[data-haptics]'); f.click('[data-cast]'); await tick(); f.turn({ status: 'won' });
  f.visible(false); await tick();
  assert.equal(f.active().length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.vibrations.at(-1), 0);
  const context = f.instances[0], resumes = context.resumeCalls;
  f.visible(true); f.match('garden'); f.turn({}); await tick(); f.advance(3000);
  assert.equal(context.resumeCalls, resumes);
  assert.equal(f.active().length, 0);
  f.click('[data-cast]'); await tick();
  assert.equal(context.state, 'running');
  assert.equal(f.active().length, 4);
});

test('a late resume cannot restart playback after mute', async t => {
  const f = fixture(t, { delayedResume: true });
  f.click('[data-cast]');
  assert.equal(f.resumes.length, 1);
  f.click('[data-sound]');
  f.resumes[0].resolve(); await tick();
  assert.equal(f.instances[0].state, 'suspended');
  assert.equal(f.active().length, 0);
  f.cleanup(); await tick();
  assert.equal(f.instances[0].closeCalls, 1);
  assert.equal(f.instances[0].state, 'closed');
  assert.equal(f.timers.size, 0);
});

test('unmount closes a context even if an outstanding resume resolves afterward', async t => {
  const f = fixture(t, { delayedResume: true });
  f.click('[data-cast]');
  assert.equal(f.resumes.length, 1);
  f.cleanup();
  assert.equal(f.instances[0].state, 'closed');
  f.resumes[0].resolve(); await tick();
  assert.equal(f.instances[0].state, 'closed');
  assert.equal(f.active().length, 0);
  assert.equal(f.timers.size, 0);
  f.turn({}); f.match('storm');
  assert.equal(f.instances[0].resumeCalls, 1);
});

test('haptics report unsupported devices honestly and never opt in automatically', t => {
  const f = fixture(t, { noAudio: true });
  assert.equal(f.q('[data-sound]').disabled, true);
  assert.equal(f.q('[data-haptics]').disabled, true);
  assert.equal(f.q('[data-haptics]').textContent, 'Haptic taps · unavailable');
  assert.match(f.q('[data-haptics-note]').textContent, /unavailable/);
  f.click('[data-haptics]'); f.click('[data-cast]'); f.turn({});
  assert.equal(f.vibrations.length, 0);
  assert.equal(f.root.dataset.haptics, 'unavailable');
});

test('haptics need explicit trusted opt-in and pulse only selections and owned turns', t => {
  const f = fixture(t, { vibration: true });
  assert.equal(f.q('[data-haptics]').textContent, 'Haptic taps · off');
  f.q('[data-haptics]').click(); f.turn({});
  assert.equal(f.vibrations.filter(value => value !== 0).length, 0);
  f.click('[data-haptics]');
  assert.equal(f.q('[data-haptics]').getAttribute('aria-pressed'), 'true');
  assert.equal(f.q('[data-haptics]').textContent, 'Haptic taps · on');
  assert.match(f.q('[data-haptics-note]').textContent, /Requires device vibration hardware/);
  assert.equal(f.instances.length, 0, 'haptics opt-in does not enable audio');
  f.click('[data-card="root"]');
  assert.equal(f.vibrations.at(-1), 8);
  const before = f.vibrations.length;
  f.turn({ round: 2, combo: { name: 'Fireworks' } });
  assert.equal(f.vibrations.length, before, 'an unsolicited AI result cannot vibrate');
  f.click('[data-request]'); f.turn({ round: 3, combo: { name: 'Fireworks' } });
  assert.deepEqual(f.vibrations.at(-1), [8, 30, 8]);
  f.click('[data-request]'); f.turn({ round: 4, status: 'won' });
  assert.deepEqual(f.vibrations.at(-1), [12, 35, 12]);
  for (const pattern of f.vibrations) {
    const pulses = Array.isArray(pattern) ? pattern.filter((_, index) => index % 2 === 0) : [pattern];
    assert.ok(pulses.every(value => value <= 20));
    assert.ok(pulses.reduce((sum, value) => sum + value, 0) <= 24);
  }
  f.click('[data-haptics]'); assert.equal(f.vibrations.at(-1), 0);
  assert.equal(f.q('[data-haptics]').textContent, 'Haptic taps · off');
});

test('a browser that rejects vibration is shown as unavailable instead of claiming success', t => {
  const f = fixture(t, { vibration: false });
  f.click('[data-haptics]');
  assert.equal(f.q('[data-haptics]').disabled, true);
  assert.equal(f.q('[data-haptics]').getAttribute('aria-pressed'), 'false');
  assert.equal(f.q('[data-haptics]').textContent, 'Haptic taps · unavailable');
  assert.match(f.q('[data-haptics-note]').textContent, /unavailable/);
});

test('accessible preference changes persist while locked without creating or resuming audio', async t => {
  const f = fixture(t);
  f.q('[data-sound-mood]').value = 'drift';
  f.q('[data-sound-mood]').dispatchEvent(new f.win.Event('change'));
  f.q('[data-volume]').value = '22';
  f.q('[data-volume]').dispatchEvent(new f.win.Event('input'));
  assert.equal(f.root.dataset.soundMood, 'drift');
  assert.equal(f.q('[data-volume-value]').textContent, '22%');
  assert.equal(f.win.localStorage.getItem('pointcast:co-games:sound-mood'), 'drift');
  assert.equal(f.instances.length, 0);
  f.click('[data-cast]'); await tick();
  const context = f.instances[0];
  assert.equal(context.state, 'running');
  assert.ok(Math.abs(context.gains[0].gain.value - 0.28 * .22) < 1e-12);
  f.visible(false); await tick(); f.visible(true);
  const resumes = context.resumeCalls;
  f.q('[data-sound-mood]').value = 'playful';
  f.q('[data-sound-mood]').dispatchEvent(new f.win.Event('change'));
  f.q('[data-volume]').value = '30';
  f.q('[data-volume]').dispatchEvent(new f.win.Event('input'));
  assert.equal(f.root.dataset.soundMood, 'playful');
  assert.equal(context.resumeCalls, resumes);
  assert.equal(context.state, 'suspended');
  assert.equal(f.active().length, 0);
});

test('accessible mood changes update an already playing context without another resume', async t => {
  const f = fixture(t);
  f.click('[data-cast]'); await tick();
  const context = f.instances[0], resumes = context.resumeCalls;
  f.q('[data-sound-mood]').value = 'drift';
  f.q('[data-sound-mood]').dispatchEvent(new f.win.Event('change'));
  assert.equal(context.resumeCalls, resumes);
  assert.equal(f.active().length, 4);
  assert.equal(f.root.dataset.soundMood, 'drift');
});

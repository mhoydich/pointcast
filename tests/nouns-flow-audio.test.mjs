import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountNounsFlowAudio } from '../src/lib/nouns-flow-audio.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const markup = `<section id="nouns-flow" data-state="ready"><button data-flow-start>Start</button>
<button data-flow-sound></button><button data-flow-haptics></button><span data-flow-haptics-note></span>
<dialog open><button data-flow-test-sound>Test sound</button><p data-flow-audio-status></p></dialog>
<select data-flow-pace><option value="drift">Drift</option><option value="gentle" selected>Gentle</option><option value="playful">Playful</option></select>
<input type="range" data-flow-volume min="0" max="100"><span data-flow-volume-value></span>
<button data-flow-lane="0">D</button><button data-flow-lane="1">F</button><button data-flow-lane="2">J</button></section>`;
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { resolve, reject, promise }; };
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
  endQueue = null;
  addEventListener(type, callback) { if (type === 'ended') this.ended.push(callback); }
  start(at = 0) { this.started = true; this.startAt = at; }
  stop(at) {
    this.stopAt = at;
    if (at === undefined && !this.stopped) { this.stopped = true; if (this.endQueue) this.endQueue.push(() => { for (const callback of this.ended) callback(); }); else for (const callback of this.ended) callback(); }
  }
  end() { this.stopped = true; for (const callback of this.ended) callback(); }
}
function fixture(t, { noAudio = false, vibration, delayedResume = false, delayedSuspend = false, delayedEnd = false, storage = {}, sessionMode, sessionType = 'ambient', constructorFails = false, resumeRejects = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games/flow', pretendToBeVisual: true });
  const win = dom.window, doc = win.document, root = doc.querySelector('#nouns-flow');
  const q = selector => root.querySelector(selector);
  let visibility = 'visible';
  Object.defineProperty(doc, 'visibilityState', { get: () => visibility });
  const contexts = [], vibrations = [], pendingResumes = [], pendingSuspends = [], pendingEnds = [], order = [];
  let timerId = 0, now = 0;
  const timers = new Map();
  t.mock.method(win, 'setTimeout', (callback, delay) => { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; });
  t.mock.method(win, 'clearTimeout', id => timers.delete(id));
  t.mock.method(win.performance, 'now', () => now);
  class Session extends win.EventTarget {
    currentType = sessionType; state = 'inactive'; writes = [];
    get type() { if (sessionMode === 'throw-get') throw new Error('Type unavailable'); return this.currentType; }
    set type(value) {
      order.push(`session:${value}`); this.writes.push(value);
      if (sessionMode === 'throw-set') throw new Error('Type assignment denied');
      if (sessionMode !== 'ignore-set') this.currentType = value;
    }
    change(state) { this.state = state; this.dispatchEvent(new win.Event('statechange')); }
  }
  const session = sessionMode ? new Session() : null;
  if (session) Object.defineProperty(win.navigator, 'audioSession', { value: session });
  if (vibration !== undefined) Object.defineProperty(win.navigator, 'vibrate', { value: value => { vibrations.push(value); return vibration; } });
  class Context {
    state = 'suspended'; currentTime = 10; destination = new AudioNode(); sources = []; gains = [];
    resumeCalls = 0; suspendCalls = 0; closeCalls = 0; listeners = [];
    constructor() { order.push('context:create'); if (constructorFails) throw new Error('Device refused audio'); contexts.push(this); }
    addEventListener(type, callback) { if (type === 'statechange') this.listeners.push(callback); }
    change(state) { this.state = state; for (const callback of this.listeners) callback(); }
    createGain() { const node = new AudioNode(); node.gain = new Param(); this.gains.push(node); return node; }
    createBiquadFilter() { const node = new AudioNode(); node.frequency = new Param(); node.Q = new Param(); return node; }
    createOscillator() { const source = new Source(); source.endQueue = delayedEnd ? pendingEnds : null; this.sources.push(source); return source; }
    async resume() { order.push('context:resume'); this.resumeCalls++; if (resumeRejects) throw new Error('Resume denied'); if (delayedResume) { const request = deferred(); pendingResumes.push(request); await request.promise; } this.change('running'); }
    async suspend() { this.suspendCalls++; if (delayedSuspend) { const request = deferred(); pendingSuspends.push(request); await request.promise; } if (this.state !== 'closed') this.change('suspended'); }
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
  const emit = (type, value = {}) => {
    if (type === 'start') { q('dialog').removeAttribute('open'); root.dataset.state = 'playing'; }
    if (type === 'pause') root.dataset.state = 'paused';
    if (type === 'finish') root.dataset.state = value.status;
    if (type === 'world') root.dataset.state = 'ready';
    return root.dispatchEvent(new win.CustomEvent(`nouns-flow:${type}`, { detail: { pace: 'gentle', world: 'garden', ...value } }));
  };
  const start = value => { click('[data-flow-start]'); emit('start', { bpm: 96, durationMs: 35000, ...value }); };
  const hit = (value = {}) => emit('hit', { lane: 0, grade: 'perfect', combo: 1, elapsedMs: 2500, ...value });
  const active = () => contexts.flatMap(context => context.sources).filter(source => source.started && !source.stopped);
  const visible = value => { visibility = value ? 'visible' : 'hidden'; doc.dispatchEvent(new win.Event('visibilitychange')); };
  const volume = value => { q('[data-flow-volume]').value = String(value); q('[data-flow-volume]').dispatchEvent(new win.Event('input')); };
  const advance = ms => {
    now += ms;
    for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
  };
  return { win, doc, root, q, contexts, vibrations, pendingResumes, pendingSuspends, pendingEnds, session, order, cleanup, click, lane, key, emit, start, hit, active, visible, volume, advance, timers: () => timers.size };
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
  f.root.dataset.state = 'paused';
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
  f.q('dialog').removeAttribute('open');
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

test('trusted unlock requests playback before context creation and uses the repaired master gain', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  assert.deepEqual(f.session.writes, []);
  f.q('[data-flow-test-sound]').click(); await tick();
  assert.equal(f.contexts.length, 0);
  assert.deepEqual(f.session.writes, []);
  f.click('[data-flow-test-sound]'); await tick();
  assert.deepEqual(f.order.slice(0, 3), ['session:playback', 'context:create', 'context:resume']);
  assert.equal(f.session.type, 'playback');
  assert.equal(f.contexts[0].gains[0].gain.value, 1.2 * .35);
  assert.equal(f.active().length, 3);
  f.cleanup(); assert.equal(f.session.type, 'ambient');
});

test('one-second test chime does not start gameplay and reports source completion even with a running context', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  const starts = []; f.root.addEventListener('nouns-flow:start', event => starts.push(event));
  f.click('[data-flow-test-sound]'); await tick();
  assert.equal(f.root.dataset.state, 'ready');
  assert.equal(starts.length, 0);
  assert.equal(f.root.dataset.flowAudioOutput, 'test');
  assert.equal(f.active().length, 3);
  assert.ok(f.active().every(source => source.stopAt <= 11));
  for (const source of [...f.active()]) source.end();
  assert.equal(f.contexts[0].state, 'running');
  assert.equal(f.root.dataset.flowAudioOutput, 'idle');
  assert.match(f.q('[data-flow-audio-status]').textContent, /Test finished/);
  assert.equal(f.session.type, 'ambient');
  f.emit('beat', { index: 0 }); assert.equal(f.active().length, 0);
});

test('repeated sound tests replace the previous chime instead of accumulating voices', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  f.click('[data-flow-test-sound]'); await tick(); const old = [...f.active()];
  f.click('[data-flow-test-sound]'); await tick();
  assert.ok(old.every(source => source.stopped));
  assert.equal(f.active().length, 3);
  assert.equal(f.session.type, 'playback');
  assert.equal(f.contexts[0].resumeCalls, 1);
});

for (const action of ['close', 'pause', 'hide', 'mute', 'cleanup']) {
  test(`${action} cancels a pending cold sound test and late resume cannot revive it`, async t => {
    const f = fixture(t, { sessionMode: 'supported', delayedResume: true });
    f.click('[data-flow-test-sound]');
    assert.equal(f.root.dataset.flowAudioOutput, 'starting');
    if (action === 'close') f.q('dialog').removeAttribute('open');
    if (action === 'pause') f.emit('pause');
    if (action === 'hide') f.visible(false);
    if (action === 'mute') f.click('[data-flow-sound]');
    if (action === 'cleanup') f.cleanup();
    await tick(); f.pendingResumes[0].resolve(); await tick();
    assert.equal(f.active().length, 0);
    assert.equal(f.session.type, 'ambient');
    assert.equal(f.timers(), 0);
    assert.notEqual(f.root.dataset.state, 'playing');
  });
}

test('a cold preview waits beyond the beat deadline and times out visibly after two seconds', async t => {
  const f = fixture(t, { delayedResume: true, sessionMode: 'supported' });
  f.click('[data-flow-test-sound]'); f.advance(600);
  f.pendingResumes[0].resolve(); await tick();
  assert.equal(f.active().length, 3, 'a 600ms cold iPhone resume still plays the requested preview');
  f.q('dialog').removeAttribute('open'); await tick(); f.q('dialog').setAttribute('open', '');
  f.click('[data-flow-test-sound]'); f.advance(2001); await tick();
  assert.match(f.q('[data-flow-audio-status]').textContent, /could not start.*Test sound/);
  assert.equal(f.session.type, 'ambient');
  f.pendingResumes[1].resolve(); await tick();
  assert.equal(f.active().length, 0);
});

test('Test sound honors mute and zero volume without silently changing either preference', async t => {
  const f = fixture(t, { storage: { sound: 'off' }, sessionMode: 'supported' });
  f.click('[data-flow-test-sound]');
  assert.match(f.q('[data-flow-audio-status]').textContent, /muted/);
  assert.equal(f.contexts.length, 0); assert.deepEqual(f.session.writes, []);
  f.click('[data-flow-sound]'); f.volume(0); f.click('[data-flow-test-sound]');
  assert.match(f.q('[data-flow-audio-status]').textContent, /Volume is zero/);
  assert.equal(f.contexts.length, 0);
  f.volume(40); f.click('[data-flow-test-sound]'); await tick();
  assert.equal(f.active().length, 3);
});

for (const sessionMode of [undefined, 'throw-get', 'throw-set', 'ignore-set']) {
  test(`preview remains usable with ${sessionMode || 'unsupported'} Audio Session API`, async t => {
    const f = fixture(t, { sessionMode });
    f.click('[data-flow-test-sound]'); await tick();
    assert.equal(f.active().length, 3);
    assert.equal(f.root.dataset.flowAudioOutput, 'test');
    f.cleanup();
    assert.equal(f.active().length, 0);
  });
}

test('session restoration respects another owner and explicit recording types', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  f.click('[data-flow-test-sound]'); await tick();
  f.session.type = 'play-and-record'; f.cleanup();
  assert.equal(f.session.type, 'play-and-record', 'cleanup cannot replace a newer session type');
  const g = fixture(t, { sessionMode: 'supported', sessionType: 'play-and-record' });
  g.click('[data-flow-test-sound]'); await tick();
  assert.equal(g.active().length, 3);
  assert.deepEqual(g.session.writes, [], 'a game must not end an existing microphone session');
});

test('overlapping module owners restore the original session only after the final owner releases', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  const stopSecond = mountNounsFlowAudio(f.root);
  f.start(); await tick();
  assert.equal(f.contexts.length, 2);
  assert.equal(f.session.type, 'playback');
  f.cleanup(); assert.equal(f.session.type, 'playback');
  stopSecond(); assert.equal(f.session.type, 'ambient');
});

for (const source of ['context', 'session']) {
  test(`${source} interruption stops audio and asks the controller to pause without automatic recovery`, async t => {
    const f = fixture(t, { sessionMode: 'supported' });
    const events = []; f.root.addEventListener('nouns-flow:audio-interrupted', event => { events.push(event.detail); f.emit('pause'); });
    f.start(); await tick();
    if (source === 'context') f.contexts[0].change('interrupted'); else f.session.change('interrupted');
    f.advance(0); await tick();
    assert.deepEqual(events, [{ reason: 'interrupted' }]);
    assert.equal(f.root.dataset.state, 'paused');
    assert.equal(f.active().length, 0);
    assert.equal(f.session.type, 'ambient');
    const resumes = f.contexts[0].resumeCalls;
    f.session.change('active'); f.contexts[0].change('running'); await tick();
    assert.equal(f.active().length, 0);
    assert.equal(f.contexts[0].resumeCalls, resumes);
    assert.match(f.q('[data-flow-audio-status]').textContent, /interrupted/);
  });
}

for (const failure of ['constructor', 'resume']) {
  test(`${failure} failure reports recovery and defers the pause request until after the Start click`, async t => {
    const f = fixture(t, { sessionMode: 'supported', constructorFails: failure === 'constructor', resumeRejects: failure === 'resume' });
    const events = []; f.root.addEventListener('nouns-flow:audio-interrupted', event => { events.push(event.detail); f.emit('pause'); });
    f.start(); await tick(); f.advance(0); await tick();
    assert.deepEqual(events, [{ reason: 'resume-failed' }]);
    assert.equal(f.root.dataset.state, 'paused');
    assert.match(f.q('[data-flow-audio-status]').textContent, /could not start.*Test sound/);
    assert.equal(f.session.type, 'ambient');
    assert.equal(f.active().length, 0);
  });
}

test('voluntary mute and zero volume never emit an interruption that pauses the game', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  const events = []; f.root.addEventListener('nouns-flow:audio-interrupted', event => events.push(event.detail));
  f.start(); await tick(); f.volume(0); await tick(); f.volume(50);
  f.lane(0); await tick(); f.click('[data-flow-sound]'); await tick();
  assert.deepEqual(events, []);
  assert.equal(f.root.dataset.state, 'playing');
});

test('native Start keeps its gesture lease across the microtask checkpoint between capture and target listeners', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  f.click('[data-flow-test-sound]'); await tick();
  for (const source of [...f.active()]) source.end();
  f.q('dialog').removeAttribute('open'); await tick();
  f.click('[data-flow-start]');
  // A real browser can run microtasks after a native capture callback returns,
  // before the controller's target callback emits start. JSDOM .click cannot.
  await Promise.resolve();
  f.emit('start', { bpm: 96, durationMs: 35000 }); await tick();
  f.advance(0);
  assert.equal(f.root.dataset.flowAudioOutput, 'playing');
  assert.equal(f.active().length, 2);
  assert.equal(f.session.type, 'playback');
  assert.equal(f.timers(), 0, 'consuming start cancels its expiry task');
});

test('a constructor failure waits through the native checkpoint until the controller starts, then pauses once', async t => {
  const f = fixture(t, { constructorFails: true, sessionMode: 'supported' });
  const events = [];
  f.root.addEventListener('nouns-flow:audio-interrupted', event => { events.push(event.detail); f.emit('pause'); });
  f.q('dialog').removeAttribute('open');
  f.click('[data-flow-start]'); await Promise.resolve();
  assert.deepEqual(events, [], 'a microtask must not consume the failure before target dispatch');
  f.emit('start'); f.advance(0); await tick();
  assert.deepEqual(events, [{ reason: 'resume-failed' }]);
  assert.equal(f.root.dataset.state, 'paused');
  assert.equal(f.timers(), 0);
});

test('an older queued interruption cannot pause a newer explicitly resumed run', async t => {
  const f = fixture(t);
  const events = []; f.root.addEventListener('nouns-flow:audio-interrupted', event => events.push(event.detail));
  f.start(); await tick(); f.contexts[0].change('interrupted');
  assert.equal(f.timers(), 1);
  f.root.dataset.state = 'paused';
  f.start({ resumed: true }); await tick(); f.advance(0);
  assert.deepEqual(events, []);
  assert.equal(f.root.dataset.flowAudioOutput, 'playing');
  assert.equal(f.active().length, 2);
  assert.equal(f.timers(), 0);
});

test('an unconsumed Start lease expires at the task boundary and cannot authorize a later synthetic start', async t => {
  const f = fixture(t, { sessionMode: 'supported' });
  f.q('dialog').removeAttribute('open');
  f.click('[data-flow-start]'); await Promise.resolve();
  f.advance(0); await tick();
  f.emit('start'); f.emit('beat', { index: 0 }); await tick();
  assert.equal(f.active().length, 0);
  assert.equal(f.session.type, 'ambient');
  assert.equal(f.timers(), 0);
});

test('trusted unmute during a pending suspend replaces the old context without a delayed auto-resume', async t => {
  const f = fixture(t, { delayedSuspend: true });
  const events = []; f.root.addEventListener('nouns-flow:audio-interrupted', event => events.push(event.detail));
  f.start(); await tick(); const previous = f.contexts[0];
  f.click('[data-flow-sound]');
  assert.equal(previous.state, 'running', 'some devices retain running while suspend is pending');
  f.click('[data-flow-sound]'); await tick();
  assert.equal(f.contexts.length, 2);
  assert.equal(previous.state, 'closed');
  assert.equal(f.active().length, 2);
  assert.equal(f.root.dataset.flowAudioOutput, 'playing');
  for (const pending of f.pendingSuspends) pending.resolve(); await tick();
  assert.equal(f.contexts[1].state, 'running');
  assert.equal(f.active().length, 2);
  assert.deepEqual(events, []);
});

test('Test sound immediately after a pending suspend plays on its replacement context', async t => {
  const f = fixture(t, { delayedSuspend: true, sessionMode: 'supported' });
  f.click('[data-flow-test-sound]'); await tick();
  f.q('dialog').removeAttribute('open'); await tick();
  assert.equal(f.pendingSuspends.length, 1);
  f.q('dialog').setAttribute('open', '');
  f.click('[data-flow-test-sound]'); await tick();
  assert.equal(f.contexts.length, 2);
  assert.equal(f.active().length, 3, 'fresh-context unlock must not invalidate this new preview');
  assert.equal(f.root.dataset.flowAudioOutput, 'test');
  assert.equal(f.session.type, 'playback');
  f.pendingSuspends[0].resolve(); await tick();
  assert.equal(f.active().length, 3);
  assert.equal(f.root.dataset.state, 'ready');
});

test('late ended callbacks from an old preview cannot cancel its newer pending retry', async t => {
  const f = fixture(t, { delayedEnd: true, delayedResume: true, sessionMode: 'supported' });
  f.click('[data-flow-test-sound]'); f.pendingResumes[0].resolve(); await tick();
  f.q('dialog').removeAttribute('open'); await tick();
  assert.equal(f.pendingEnds.length, 3);
  f.q('dialog').setAttribute('open', ''); f.click('[data-flow-test-sound]');
  for (const ended of f.pendingEnds.splice(0)) ended();
  f.pendingResumes[1].resolve(); await tick();
  assert.equal(f.active().length, 3);
  assert.equal(f.root.dataset.flowAudioOutput, 'test');
  assert.equal(f.session.type, 'playback');
});

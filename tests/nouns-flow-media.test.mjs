import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountNounsFlowAudio } from '../src/lib/nouns-flow-audio.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const markup = `<section id="nouns-flow" data-state="ready" data-world="garden" data-pace="gentle">
<audio data-flow-track src="/audio/starjam/garden-gentle.m4a"></audio>
<audio data-flow-hit-audio="0" src="/audio/starjam/hit-0.m4a"></audio>
<audio data-flow-hit-audio="1" src="/audio/starjam/hit-1.m4a"></audio>
<audio data-flow-hit-audio="2" src="/audio/starjam/hit-2.m4a"></audio>
<button data-flow-start>Start</button><button data-flow-sound></button>
<button data-flow-haptics></button><span data-flow-haptics-note></span>
<dialog><button data-flow-test-sound>Test sound</button><p data-flow-audio-status></p>
<audio data-flow-speaker-test src="/audio/starjam/welcome.m4a" controls></audio></dialog>
<select data-flow-pace><option value="drift">Drift</option><option value="gentle" selected>Groove</option><option value="playful">Arcade</option></select>
<input type="range" data-flow-volume min="0" max="100"><span data-flow-volume-value></span>
<button data-flow-lane="0">D</button><button data-flow-lane="1">F</button><button data-flow-lane="2">J</button>
</section>`;

function fixture(t, { storage = {}, vibration = true } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games/flow', pretendToBeVisual: true });
  const win = dom.window, doc = win.document, root = doc.getElementById('nouns-flow');
  const q = selector => root.querySelector(selector);
  let visibility = 'visible', timerId = 0, now = 0;
  Object.defineProperty(doc, 'visibilityState', { get: () => visibility });
  const timers = new Map(), nativeTasks = [], vibrations = [], interruptions = [], clocks = [];
  t.mock.method(win, 'setTimeout', (callback, delay = 0) => {
    const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id;
  });
  t.mock.method(win, 'clearTimeout', id => timers.delete(id));
  Object.defineProperty(win.navigator, 'vibrate', { value: value => { vibrations.push(value); return vibration; } });
  win.AudioContext = class { constructor() { throw new Error('Native media dispatch must not create Web Audio.'); } };
  for (const [key, value] of Object.entries(storage)) win.localStorage.setItem(`pointcast:starjam:${key}`, value);
  const media = [...root.querySelectorAll('audio')].map(element => {
    const state = { element, paused: true, ended: false, readyState: 0, currentTime: 0, plays: [], pauses: 0, loads: 0, plans: [] };
    for (const key of ['paused', 'ended', 'readyState']) Object.defineProperty(element, key, { get: () => state[key] });
    Object.defineProperty(element, 'currentTime', { get: () => state.currentTime, set: value => { state.currentTime = value; } });
    const queue = type => nativeTasks.push(() => element.dispatchEvent(new win.Event(type)));
    state.ready = () => { state.paused = false; state.readyState = 4; queue('playing'); };
    state.event = type => element.dispatchEvent(new win.Event(type));
    t.mock.method(element, 'play', () => {
      state.plays.push({ currentTime: state.currentTime });
      const plan = state.plans.shift();
      if (plan instanceof Error) throw plan;
      state.paused = false; state.ended = false; queue('play');
      if (!plan) state.ready();
      return plan?.promise ?? Promise.resolve();
    });
    t.mock.method(element, 'pause', () => {
      state.pauses++;
      if (!state.paused) { state.paused = true; queue('pause'); }
    });
    t.mock.method(element, 'load', () => {
      state.loads++; state.currentTime = 0; state.readyState = 0;
      if (!state.paused) { state.paused = true; queue('pause'); }
    });
    return state;
  });
  const getMedia = selector => media.find(item => item.element.matches(selector));
  const track = getMedia('[data-flow-track]'), welcome = getMedia('[data-flow-speaker-test]');
  const effects = [0, 1, 2].map(lane => getMedia(`[data-flow-hit-audio="${lane}"]`));
  const handlers = new Map();
  for (const node of [root, doc]) {
    const original = node.addEventListener;
    handlers.set(node, new Map());
    t.mock.method(node, 'addEventListener', function (type, listener, options) {
      const list = handlers.get(node);
      if (!list.has(type)) list.set(type, []);
      list.get(type).push({ listener, options });
      return original.call(this, type, listener, options);
    });
  }
  root.addEventListener('nouns-flow:audio-interrupted', event => interruptions.push(event.detail));
  root.addEventListener('nouns-flow:audio-clock', event => clocks.push(event.detail.mode));
  const unmount = mountNounsFlowAudio(root);
  let mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  t.after(() => { cleanup(); win.close(); });
  // Real trusted input is unavailable in JSDOM. Exercise the actual captured
  // gesture listeners, preserving their native capture/target ordering.
  const trusted = (node, type, target, fields = {}) => {
    for (const { listener, options } of handlers.get(node)?.get(type) || []) {
      if (!options?.signal?.aborted) listener({ target, isTrusted: true, ...fields });
    }
  };
  const click = selector => trusted(root, 'click', q(selector));
  const lane = (value, fields = {}) => trusted(root, 'pointerdown', q(`[data-flow-lane="${value}"]`), { button: 0, ...fields });
  const key = (value, fields = {}) => trusted(doc, 'keydown', doc.body, { key: value, ...fields });
  const emit = (type, detail = {}) => {
    if (type === 'start') root.dataset.state = 'playing';
    if (type === 'pause') root.dataset.state = 'paused';
    if (type === 'world') root.dataset.state = 'ready';
    if (type === 'finish') root.dataset.state = detail.status ?? 'won';
    root.dispatchEvent(new win.CustomEvent(`nouns-flow:${type}`, { detail }));
  };
  const start = () => { q('dialog').removeAttribute('open'); click('[data-flow-start]'); emit('start'); };
  const hit = (detail = {}) => emit('hit', { lane: 0, grade: 'perfect', combo: 1, ...detail });
  const flushMedia = () => { for (const callback of nativeTasks.splice(0)) callback(); };
  const advance = amount => {
    now += amount;
    for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
  };
  const visible = value => { visibility = value ? 'visible' : 'hidden'; doc.dispatchEvent(new win.Event('visibilitychange')); };
  const volume = value => { q('[data-flow-volume]').value = String(value); q('[data-flow-volume]').dispatchEvent(new win.Event('input')); };
  return { win, doc, root, q, track, welcome, effects, media, timers, interruptions, clocks, vibrations, cleanup, click, lane, key, emit, start, hit, flushMedia, advance, visible, volume };
}

test('production audio dispatch uses native media and never autoplays on mount or synthetic game events', async t => {
  const f = fixture(t, { storage: { volume: '120' } });
  assert.equal(f.root.dataset.flowAudioState, 'media');
  assert.equal(f.q('[data-flow-volume]').value, '100');
  f.q('[data-flow-start]').click(); f.emit('start'); f.emit('beat', { index: 0, intervalMs: 625 }); f.hit();
  await tick(); f.advance(0); f.flushMedia();
  assert.equal(f.media.reduce((sum, item) => sum + item.plays.length, 0), 0);
  assert.equal(f.timers.size, 0);
  assert.deepEqual(f.vibrations, []);
});

test('Start plays synchronously and its intent survives the capture-to-target microtask checkpoint', async t => {
  const f = fixture(t);
  f.click('[data-flow-start]');
  assert.equal(f.track.plays.length, 1, 'play must occur in the trusted capture callback');
  assert.equal(f.root.dataset.flowAudioClock, 'media');
  await Promise.resolve();
  assert.equal(f.track.paused, false, 'native microtasks must not expire Start intent');
  f.emit('start'); f.flushMedia(); f.advance(0);
  assert.equal(f.root.dataset.flowAudioOutput, 'playing');
  assert.equal(f.track.plays.length, 1);
  assert.equal(f.timers.size, 0);
});

test('unconsumed Start intent expires at the next task and cannot authorize a later start', async t => {
  const f = fixture(t);
  f.click('[data-flow-start]'); await Promise.resolve(); f.advance(0);
  assert.equal(f.track.paused, true);
  assert.equal(f.root.dataset.flowAudioClock, 'wall');
  f.emit('start'); f.emit('beat', { index: 1, intervalMs: 625 }); f.flushMedia();
  assert.equal(f.track.plays.length, 1);
  assert.equal(f.track.paused, true);
  assert.equal(f.timers.size, 0);
});

test('Resume seeks to the exact controller pause time and ignores older queued native pause events', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia();
  f.emit('beat', { index: 4, intervalMs: 625 });
  f.track.currentTime = 2.875;
  f.emit('pause', { elapsedMs: 2875 });
  assert.equal(f.track.paused, true);
  assert.equal(f.root.dataset.flowAudioClock, 'wall');
  f.start(); await Promise.resolve(); f.flushMedia(); f.advance(0);
  assert.equal(f.track.plays.at(-1).currentTime, 2.875);
  assert.equal(f.root.dataset.flowAudioOutput, 'playing');
  assert.deepEqual(f.interruptions, []);
});

for (const rejection of ['throw', 'promise']) {
  test(`${rejection} playback failure waits until the native target starts before requesting one pause`, async t => {
    const f = fixture(t), pending = deferred();
    f.track.plans.push(rejection === 'throw' ? new Error('Playback denied') : pending);
    f.click('[data-flow-start]');
    if (rejection === 'promise') pending.reject(new Error('Playback denied'));
    await Promise.resolve();
    assert.deepEqual(f.interruptions, []);
    f.emit('start'); f.advance(0); f.flushMedia();
    assert.deepEqual(f.interruptions, [{ reason: 'media-playback' }]);
    assert.equal(f.track.paused, true);
    assert.equal(f.root.dataset.flowAudioClock, 'wall');
  });
}

test('an old play rejection and old timeout cannot interrupt a newer explicit Resume', async t => {
  const f = fixture(t), pending = deferred();
  f.track.plans.push(pending); f.start();
  f.emit('pause', { elapsedMs: 1000 }); f.start(); await tick(); f.flushMedia();
  pending.reject(new Error('Aborted old request')); await tick(); f.advance(9000); f.flushMedia();
  assert.deepEqual(f.interruptions, []);
  assert.equal(f.root.dataset.flowAudioOutput, 'playing');
  assert.equal(f.track.paused, false);
  assert.equal(f.track.plays.at(-1).currentTime, 1);
});

test('loading timeout pauses a stalled run and late resolution cannot start it again', async t => {
  const f = fixture(t), pending = deferred();
  f.track.plans.push(pending); f.start(); f.flushMedia();
  assert.equal(f.root.dataset.flowAudioOutput, 'starting');
  f.advance(8000); f.advance(0);
  assert.deepEqual(f.interruptions, [{ reason: 'media-playback' }]);
  pending.resolve(); await tick(); f.flushMedia();
  assert.equal(f.track.paused, true);
  assert.equal(f.root.dataset.flowAudioClock, 'wall');
});

test('muted and zero-volume Start stay visual; changing volume alone cannot autoplay', async t => {
  for (const storage of [{ sound: 'off' }, { volume: '0' }]) {
    const f = fixture(t, { storage });
    f.start(); await tick(); f.advance(0);
    assert.equal(f.track.plays.length, 0);
    assert.equal(f.root.dataset.flowAudioClock, 'wall');
    f.volume(55); await tick();
    assert.equal(f.track.plays.length, 0);
    assert.deepEqual(f.interruptions, []);
  }
});

test('voluntary mute and zero volume do not interpret queued media pause events as interruptions', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia();
  f.click('[data-flow-sound]'); f.flushMedia(); f.advance(0);
  assert.equal(f.root.dataset.flowAudioClock, 'wall');
  assert.equal(f.track.paused, true);
  f.click('[data-flow-sound]'); await tick(); f.flushMedia();
  assert.equal(f.track.plays.length, 2, 'trusted unmute may resume the running soundtrack');
  f.volume(0); f.flushMedia(); f.advance(0);
  assert.equal(f.track.paused, true);
  assert.deepEqual(f.interruptions, []);
  assert.equal(f.root.dataset.state, 'playing');
});

test('trusted unmute uses the current visual position rather than the previous beat boundary', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia();
  f.emit('beat', { index: 4, intervalMs: 625 });
  f.click('[data-flow-sound]'); f.flushMedia();
  f.root.dataset.flowElapsedMs = '3187';
  f.click('[data-flow-sound]'); await tick(); f.flushMedia();
  assert.equal(f.track.plays.at(-1).currentTime, 3.187);
  assert.equal(f.root.dataset.flowAudioClock, 'media');
  assert.deepEqual(f.interruptions, []);
});

for (const nativeFailure of ['pause', 'error', 'ended']) {
  test(`unexpected native ${nativeFailure} requests a pause and never restarts media itself`, async t => {
    const f = fixture(t);
    f.start(); await tick(); f.flushMedia();
    f.track.currentTime = 3;
    if (nativeFailure === 'pause') { f.track.element.pause(); f.flushMedia(); }
    else { if (nativeFailure === 'ended') f.track.ended = true; f.track.event(nativeFailure); }
    f.advance(0); f.flushMedia();
    assert.deepEqual(f.interruptions, [{ reason: 'media-playback' }]);
    assert.equal(f.track.paused, true);
    assert.equal(f.root.dataset.flowAudioClock, 'wall');
    f.track.event('playing'); f.advance(9000); f.flushMedia();
    assert.equal(f.track.plays.length, 1);
    assert.equal(f.track.paused, true);
  });
}

test('Test sound is an explicit audible opt-in and starts synchronously from its trusted button', async t => {
  const f = fixture(t, { storage: { sound: 'off', volume: '0' } });
  f.q('dialog').setAttribute('open', '');
  f.q('[data-flow-test-sound]').click();
  assert.equal(f.welcome.plays.length, 0);
  f.click('[data-flow-test-sound]');
  assert.equal(f.welcome.plays.length, 1);
  assert.equal(f.welcome.element.muted, false);
  assert.equal(f.welcome.element.volume, .35);
  await tick(); f.flushMedia();
  assert.equal(f.root.dataset.flowAudioOutput, 'test');
  assert.equal(f.track.plays.length, 0);
});

test('native preview status follows buffering, playing and the player pause control', async t => {
  const f = fixture(t), pending = deferred();
  f.q('dialog').setAttribute('open', '');
  f.welcome.plans.push(pending); f.click('[data-flow-test-sound]'); f.flushMedia();
  assert.notEqual(f.root.dataset.flowAudioOutput, 'test', 'loading is not audible playback');
  f.welcome.ready(); pending.resolve(); await tick(); f.flushMedia();
  assert.equal(f.root.dataset.flowAudioOutput, 'test');
  f.welcome.element.pause(); f.flushMedia();
  assert.notEqual(f.root.dataset.flowAudioOutput, 'test', 'native pause must clear the playback indicator');
});

for (const boundary of ['close', 'cancel', 'visibility', 'pagehide', 'cleanup']) {
  test(`${boundary} stops a preview and a late play resolution cannot revive it`, async t => {
    const f = fixture(t), pending = deferred();
    f.q('dialog').setAttribute('open', ''); f.welcome.plans.push(pending); f.click('[data-flow-test-sound]');
    if (boundary === 'close' || boundary === 'cancel') {
      f.q('dialog').removeAttribute('open'); f.q('dialog').dispatchEvent(new f.win.Event(boundary));
    } else if (boundary === 'visibility') f.visible(false);
    else if (boundary === 'pagehide') f.win.dispatchEvent(new f.win.Event('pagehide'));
    else f.cleanup();
    pending.resolve(); await tick(); f.flushMedia();
    assert.equal(f.welcome.paused, true);
    assert.equal(f.timers.size, 0);
    f.visible(true); f.advance(10000);
    assert.equal(f.welcome.plays.length, 1);
  });
}

test('visibility and pagehide stop all media without automatic recovery', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia(); f.lane(0); f.hit();
  f.visible(false); f.flushMedia(); f.advance(0);
  assert.ok(f.media.every(item => item.paused));
  assert.equal(f.root.dataset.flowAudioClock, 'wall');
  f.visible(true); f.flushMedia();
  assert.equal(f.track.plays.length, 1);
  f.emit('pause', { elapsedMs: 2300 }); f.start(); await tick(); f.flushMedia();
  f.win.dispatchEvent(new f.win.Event('pagehide')); f.flushMedia();
  assert.ok(f.media.every(item => item.paused));
  assert.equal(f.timers.size, 0);
});

test('a menu pause saves elapsed time, suppresses hit accents and requires an explicit Resume', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia();
  f.q('dialog').setAttribute('open', '');
  // The game controller owns menu-driven pausing and emits this event.
  f.emit('pause', { reason: 'dialog', elapsedMs: 4876 }); f.flushMedia();
  f.lane(0); f.hit();
  assert.equal(f.effects[0].plays.length, 0);
  assert.equal(f.track.paused, true);
  f.q('dialog').removeAttribute('open'); await tick();
  assert.equal(f.track.plays.length, 1);
  f.start(); await tick();
  assert.equal(f.track.plays.at(-1).currentTime, 4.876);
});

test('only a successful matching hit consumes a trusted lane gesture, including across native microtasks', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia(); f.click('[data-flow-haptics]');
  f.hit(); f.lane(0); f.hit({ lane: 1 }); f.hit({ grade: 'miss' });
  assert.ok(f.effects.every(item => item.plays.length === 0));
  await Promise.resolve(); f.hit(); f.hit();
  assert.equal(f.effects[0].plays.length, 1);
  assert.deepEqual(f.vibrations.filter(value => value > 0), [12]);
  f.lane(1); f.advance(0); f.hit({ lane: 1 });
  assert.equal(f.effects[1].plays.length, 0, 'an expired lane gesture cannot authorize an accent');
  f.key('F', { repeat: true }); f.hit({ lane: 1 });
  f.key('F', { ctrlKey: true }); f.hit({ lane: 1 });
  assert.equal(f.effects[1].plays.length, 0);
  f.key('F'); f.hit({ lane: 1, grade: 'good' });
  assert.equal(f.effects[1].plays.length, 1);
  assert.deepEqual(f.vibrations.filter(value => value > 0), [12, 8]);
});

test('finish and cleanup release media sources, timers and input listeners', async t => {
  const f = fixture(t);
  f.start(); await tick(); f.flushMedia(); f.lane(2); f.hit({ lane: 2 });
  f.emit('finish'); f.flushMedia();
  assert.ok(f.media.every(item => item.paused));
  assert.equal(f.timers.size, 0);
  f.cleanup();
  assert.ok(f.media.every(item => !item.element.hasAttribute('src') && item.loads >= 1));
  const plays = f.track.plays.length;
  f.root.dataset.state = 'ready'; f.click('[data-flow-start]'); f.emit('start');
  f.track.event('playing'); f.visible(false); f.advance(10000); await tick();
  assert.equal(f.track.plays.length, plays);
  assert.equal(f.timers.size, 0);
});

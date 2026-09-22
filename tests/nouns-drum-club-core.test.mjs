import assert from 'node:assert/strict';
import test from 'node:test';
import { NounsDrumClubAudio, PAD_BY_CODE, PAD_DEFINITIONS, PAD_KEYS } from '../src/lib/nouns-drum-club-audio.ts';
import {
  SCORE_PRESETS, SCORE_STEPS, TEMPO_MAX, TEMPO_MIN, createScore, decodeScore, encodeScore,
  normalizeScore, scheduleScore, scheduleWindow, setStep, stepTime, toggleStep,
} from '../src/lib/nouns-drum-club-score.ts';

test('keyboard contract has 36 unique, ordered, network-safe pads', () => {
  assert.equal(PAD_DEFINITIONS.length, 36);
  assert.equal(PAD_KEYS, '1234567890QWERTYUIOPASDFGHJKLZXCVBNM');
  assert.equal(new Set(PAD_DEFINITIONS.map(({ id }) => id)).size, 36);
  assert.equal(new Set(PAD_DEFINITIONS.map(({ code }) => code)).size, 36);
  for (const pad of PAD_DEFINITIONS) {
    assert.match(pad.id, /^[a-z0-9-]+$/);
    assert.equal(PAD_BY_CODE.get(pad.code), pad);
  }
  assert.deepEqual(PAD_DEFINITIONS.reduce((counts, pad) => ({ ...counts, [pad.family]: (counts[pad.family] ?? 0) + 1 }), {}), {
    drums: 10, bass: 10, mallets: 9, chords: 6, 'ear-candy': 1,
  });
});

test('score mutations are immutable, bounded, and remove empty lanes', () => {
  const original = createScore({ name: '  My\u0000 groove  ', tempo: 999, swing: -2 });
  assert.equal(original.name, 'My groove');
  assert.equal(original.tempo, TEMPO_MAX);
  assert.equal(original.swing, 0);
  const on = toggleStep(original, 'kick', 3, 0.72);
  assert.equal(original.lanes.length, 0);
  assert.equal(on.lanes[0].steps[3], 0.72);
  const off = toggleStep(on, 'kick', 3);
  assert.equal(off.lanes.length, 0);
  assert.deepEqual(setStep(on, 'not-a-pad', 2, 1), on);
  assert.deepEqual(setStep(on, 'kick', SCORE_STEPS, 1), on);
});

test('all presets survive URL-safe round trips and corrupt shares safely fall back', () => {
  for (const preset of Object.values(SCORE_PRESETS)) {
    const encoded = encodeScore(preset);
    assert.match(encoded, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(decodeScore(encoded), preset);
  }
  assert.deepEqual(decodeScore('not valid ***'), SCORE_PRESETS.clubhouse);
  assert.deepEqual(decodeScore('A'.repeat(12_001)), SCORE_PRESETS.clubhouse);
  const futureVersion = Buffer.from(JSON.stringify({ version: 2, name: 'Future', tempo: 90, swing: 0, lanes: [] })).toString('base64url');
  assert.deepEqual(decodeScore(futureVersion), SCORE_PRESETS.clubhouse, 'unsupported schema versions do not silently reinterpret data');
  const hostile = normalizeScore({ name: 10, tempo: NaN, swing: Infinity, lanes: [
    { padId: 'kick', steps: [3, -2, 'yes', null] }, { padId: 'kick', steps: [1] }, { padId: '__proto__', steps: [1] }, null,
  ] });
  assert.equal(hostile.tempo, 108);
  assert.deepEqual(hostile.lanes[0].steps.slice(0, 4), [1, 0, 0, 0]);
  assert.equal(hostile.lanes.length, 1);
});

test('share codec ignores partial browser Buffer polyfills that lack base64url', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Buffer');
  const partialBuffer = { from() { throw new TypeError('Unknown encoding: base64url'); } };
  Object.defineProperty(globalThis, 'Buffer', { configurable: true, writable: true, value: partialBuffer });
  try {
    const encoded = encodeScore(SCORE_PRESETS.parade);
    assert.match(encoded, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(decodeScore(encoded), SCORE_PRESETS.parade);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'Buffer', descriptor);
    else delete globalThis.Buffer;
  }
});

test('scheduler keeps swing musical while preserving exact bar boundaries', () => {
  assert.equal(stepTime(10, 0, 120, 0.2), 10);
  assert.equal(stepTime(10, 1, 120, 0.2), 10.15);
  assert.equal(stepTime(10, 2, 120, 0.2), 10.25);
  assert.equal(stepTime(10, 16, 120, 0.2), 12);
  assert.equal(stepTime(0, 1, 20, 3), 0.375, 'tempo and swing are clamped');
  const ticks = scheduleWindow(10, 10.25, 10.9, 120, 0.2);
  assert.deepEqual(ticks.map(({ step }) => step), [2, 3, 4, 5, 6]);
  const hits = scheduleScore(SCORE_PRESETS.clubhouse, scheduleWindow(10, 10, 10.51, 120, 0.2));
  assert.ok(hits.some(({ padId, step, when }) => padId === 'kick' && step === 0 && when === 10));
  assert.ok(hits.every(({ velocity }) => velocity > 0 && velocity <= 1));
  assert.deepEqual(scheduleScore(SCORE_PRESETS.clubhouse, [{ step: -1, when: 10, duration: 1 }, { step: 20, when: 10, duration: 1 }]), []);
  assert.deepEqual(scheduleWindow(0, 2, 1, TEMPO_MIN), []);
});

class Param {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  disconnected = false;
  connect(target) { return target; }
  disconnect() { this.disconnected = true; }
}
class Source extends Node {
  frequency = new Param(); detune = new Param(); listeners = []; starts = []; stops = []; type = 'sine'; buffer = null;
  start(at = 0) { this.starts.push(at); }
  stop(at) { this.stops.push(at); }
  addEventListener(type, callback) { if (type === 'ended') this.listeners.push(callback); }
}
class Context {
  state = 'suspended'; currentTime = 12; sampleRate = 100; destination = new Node(); sources = []; closeCalls = 0; resumeCalls = 0;
  createGain() { const node = new Node(); node.gain = new Param(); return node; }
  createDynamicsCompressor() { const node = new Node(); node.threshold = new Param(); node.knee = new Param(); node.ratio = new Param(); node.attack = new Param(); node.release = new Param(); return node; }
  createAnalyser() { const node = new Node(); node.fftSize = 256; node.getByteTimeDomainData = data => data.fill(136); return node; }
  createOscillator() { const source = new Source(); this.sources.push(source); return source; }
  createBufferSource() { const source = new Source(); this.sources.push(source); return source; }
  createBiquadFilter() { const node = new Node(); node.frequency = new Param(); node.Q = new Param(); return node; }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  async resume() { this.resumeCalls++; this.state = 'running'; }
  async close() { this.closeCalls++; this.state = 'closed'; }
}

test('audio requires enable, plays every family, clamps controls, caps voices and disposes', async () => {
  const context = new Context();
  const audio = new NounsDrumClubAudio({ contextFactory: () => context, maxVoices: 8 });
  assert.equal(audio.hit('kick'), false);
  assert.equal(context.sources.length, 0, 'construction and pre-gesture hits are silent');
  assert.equal(await audio.enable(), true);
  assert.equal(context.resumeCalls, 1);
  assert.equal(audio.currentTime, 12);
  assert.ok(audio.level > 0 && audio.level <= 1, 'analyser exposes bounded real output energy');
  audio.setVolume(4); assert.equal(audio.volume, 1);
  audio.setMuted(true); assert.equal(audio.hit('snare'), false); assert.equal(audio.level, 0);
  assert.equal(audio.currentTime, 12, 'muting does not break the scheduler clock');
  audio.setMuted(false);
  assert.equal(audio.hit('kick', 0), false);
  assert.equal(audio.hit('kick', 1, context.currentTime + 2.01), false, 'far-future voices cannot accumulate');
  for (const pad of PAD_DEFINITIONS) assert.equal(audio.hit(pad.id, 2, 11), true);
  assert.ok(context.sources.length > PAD_DEFINITIONS.length, 'layered synthesis creates richer voices');
  assert.ok(context.sources.some((source) => source.stops.includes(undefined)), 'old voices are stopped at the cap');
  assert.equal(audio.hit('missing'), false);
  await audio.dispose();
  assert.equal(context.closeCalls, 1);
  assert.equal(audio.hit('kick'), false);
  assert.equal(await audio.enable(), false);
});

test('mute cancels already scheduled voices and dispose wins an in-flight unlock', async () => {
  const context = new Context();
  const audio = new NounsDrumClubAudio({ contextFactory: () => context });
  await audio.enable();
  audio.hit('sparkle', 1, context.currentTime + 1);
  const scheduled = [...context.sources];
  audio.stop();
  assert.ok(scheduled.every((source) => source.stops.includes(undefined)), 'stop cancels future sources without changing sound settings');
  assert.equal(audio.muted, false);
  audio.hit('sparkle', 1, context.currentTime + 1);
  const mutedSources = context.sources.slice(scheduled.length);
  audio.setMuted(true);
  assert.ok(mutedSources.every((source) => source.stops.includes(undefined)), 'muting cancels future sources so unmute cannot reveal them');

  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  class SlowContext extends Context {
    async resume() { this.resumeCalls++; await gate; if (this.state !== 'closed') this.state = 'running'; }
  }
  const slow = new SlowContext();
  const pendingAudio = new NounsDrumClubAudio({ contextFactory: () => slow });
  const enabling = pendingAudio.enable();
  const concurrent = pendingAudio.enable();
  const disposing = pendingAudio.dispose();
  release();
  await disposing;
  assert.equal(await enabling, false);
  assert.equal(await concurrent, false);
  assert.equal(slow.state, 'closed');
});

test('partial Web Audio initialization is closed and can be retried cleanly', async () => {
  class BrokenContext extends Context {
    createDynamicsCompressor() { throw new Error('device graph unavailable'); }
  }
  const broken = new BrokenContext(), healthy = new Context();
  const queue = [broken, healthy];
  const audio = new NounsDrumClubAudio({ contextFactory: () => queue.shift() });
  assert.equal(await audio.enable(), false);
  assert.equal(broken.closeCalls, 1);
  assert.equal(await audio.enable(), true);
  assert.equal(audio.hit('kick'), true);
  await audio.dispose();
});

import test from 'node:test';
import assert from 'node:assert/strict';

// The PMM sound engine (public/pmm/sound/sound.js) with Web Audio, document, navigator.vibrate
// and the clock stubbed, so its gating, folding, voice cap and master chain run in Node. The
// engine keeps module state, so the tests run in order and each one moves the clock on.

let now = 0, hidden = false, made = 0, failNext = false;
const vibes = [];
const param = (value = 0) => ({ value, ramps: [], setValueAtTime() {}, linearRampToValueAtTime(v) { this.ramps.push(v); }, exponentialRampToValueAtTime() {},
  setTargetAtTime(v) { this.target = v; }, cancelScheduledValues() {} });
const node = (extra) => ({ connect: (n) => n, disconnect() {}, ...extra });
class FakeContext {
  constructor() {
    if (failNext) { failNext = false; throw new Error('no audio device'); }
    made++; this.state = 'running'; this.currentTime = 0; this.sampleRate = 48000; this.destination = node(); this.sources = []; this.gains = [];
    FakeContext.last = this;
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { const g = node({ gain: param(1) }); this.gains.push(g); return g; }
  createBiquadFilter() { return node({ type: '', frequency: param(), Q: param(), gain: param() }); }
  createDynamicsCompressor() { return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }); }
  createPeriodicWave() { return {}; }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  source() { const s = node({ start() {}, stop() { this.stopped = true; }, frequency: param(), detune: param(), setPeriodicWave() {} }); this.sources.push(s); return s; }
  createOscillator() { return this.source(); }
  createBufferSource() { return this.source(); }
}
const listeners = {};
globalThis.document = { get hidden() { return hidden; }, addEventListener: (ev, fn) => { listeners[ev] = fn; } };
Object.defineProperty(globalThis, 'navigator', { value: { vibrate: (p) => { vibes.push(p); return true; } }, configurable: true });
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const S = await import('../public/pmm/sound/sound.js');
let engine = null; // the context the engine made, as opposed to ones a test builds itself
const tick = (ms = 10000) => { now += ms; };
const delta = (before) => { const s = S.stats(); return Object.fromEntries(['played', 'coalesced', 'capped', 'muted'].map((k) => [k, s[k] - before[k]])); };

test('before unlock: no sound, no buzz, no context', () => {
  const b = S.stats();
  assert.equal(S.play('send', { mood: 'calm' }), false);
  assert.equal(vibes.length, 0);
  assert.equal(made, 0);
  assert.deepEqual(delta(b), { played: 0, coalesced: 0, capped: 0, muted: 1 });
});

test('unlock settles false when there is no Web Audio, or the constructor throws', async () => {
  assert.equal(await S.unlock(), false);
  globalThis.AudioContext = FakeContext; failNext = true;
  assert.equal(await S.unlock(), false);
  assert.equal(S.stats().state, 'locked', 'a failed constructor leaves no half-built context');
  assert.equal(await S.unlock(), true);
  engine = FakeContext.last;
  assert.equal(made, 1);
  assert.equal(await S.unlock(), true);
  assert.equal(made, 1, 'one context, however many gestures');
});

test('the master chain: high shelf, compressor, volume', () => {
  const ctx = new FakeContext();
  const { master } = S.buildChain(ctx, 0.5);
  assert.equal(master.gain.value, 0.45);
  const comp = [];
  const spy = Object.assign(new FakeContext(), { createDynamicsCompressor() { const c = FakeContext.prototype.createDynamicsCompressor.call(this); comp.push(c); return c; } });
  S.buildChain(spy, 1);
  assert.deepEqual([comp[0].threshold.value, comp[0].knee.value, comp[0].ratio.value], [-14, 8, 5]);
});

test('twenty receives at once: one cue, nineteen folded, one buzz', () => {
  tick(); vibes.length = 0;
  const b = S.stats();
  for (let i = 0; i < 20; i++) S.play('receive', { mood: 'calm', theirMood: 'hyped' });
  assert.deepEqual(delta(b), { played: 1, coalesced: 19, capped: 0, muted: 0 });
  assert.deepEqual(vibes, [S.haptic('receive', 'hyped')], "one buzz, in the sender's pattern");
});

test('a muted cue does not open the fold window or grow the streak', () => {
  tick(); S.setEnabled(false);
  const b = S.stats();
  assert.equal(S.play('react', { mood: 'calm' }), false);
  S.setEnabled(true);
  assert.equal(S.play('react', { mood: 'calm' }), true, 'the next one plays at once');
  assert.deepEqual(delta(b), { played: 1, coalesced: 0, capped: 0, muted: 1 });
});

test('setEnabled(false) is silent but still buzzes; setHaptics(false) stops the buzz', () => {
  tick(); vibes.length = 0; S.setEnabled(false);
  const b = S.stats();
  assert.equal(S.play('send', { mood: 'calm' }), false);
  assert.equal(vibes.length, 1);
  tick(); S.setHaptics(false);
  S.play('send', { mood: 'calm' });
  assert.equal(vibes.length, 1);
  assert.equal(delta(b).played, 0);
  S.setEnabled(true); S.setHaptics(true);
});

test('hidden: everything is muted except receive, and receive only when opted in', () => {
  tick(); hidden = true; vibes.length = 0;
  const b = S.stats();
  assert.equal(S.play('send', { mood: 'calm' }), false);
  assert.equal(S.play('receive', { theirMood: 'low' }), false);
  S.setHiddenReceive(true); tick();
  assert.equal(S.play('receive', { theirMood: 'low' }), true);
  assert.equal(vibes.length, 0, 'no buzz while hidden');
  assert.deepEqual(delta(b), { played: 1, coalesced: 0, capped: 0, muted: 2 });
  hidden = false; S.setHiddenReceive(false);
});

test('the voice cap drops an ordinary cue but a priority cue clears the board', () => {
  tick();
  // Sources in the stub never end, so voices pile up until something stops them.
  S.setEnabled(false); S.setEnabled(true); // stopAll
  const b = S.stats();
  assert.equal(S.play('boot', { mood: 'calm' }), true); // 8 voices
  assert.equal(S.play('settle', { mood: 'calm' }), true); // 14
  assert.equal(S.stats().voices, S.MAX_VOICES);
  assert.equal(S.play('react', { mood: 'calm' }), false);
  assert.equal(S.play('fail'), true);
  assert.equal(S.stats().voices, S.plan('fail').length);
  assert.deepEqual(delta(b), { played: 3, coalesced: 0, capped: 1, muted: 0 });
});

test('a streak recedes for any planner, the lab sketches included', () => {
  tick(); S.setEnabled(false); S.setEnabled(true);
  const ctx = engine, seen = [];
  const sketch = (event, opts) => { seen.push(opts.streak); return [{ t: 0, freq: 440, dur: 0.1, wave: 'sine', gain: 0.2 }]; };
  const peaks = [];
  for (let i = 0; i < 4; i++) {
    tick(500);
    const from = ctx.gains.length;
    assert.equal(S.play('send', { mood: 'calm', plan: sketch }), true);
    peaks.push(Math.max(...ctx.gains.slice(from).flatMap((g) => g.gain.ramps)));
  }
  assert.deepEqual(seen, [0, 0, 0, 0], 'the planner is asked for the full-level cue');
  assert.deepEqual(peaks, [0.2, 0.19, 0.18, 0.17], 'the engine lowers it 5% per repeat');
  assert.equal(S.recede([{ gain: 1 }], 99)[0].gain, 0.55);
});

test('the atmosphere bed fades out when the page hides and back when it shows', () => {
  tick(); S.setEnabled(false); S.setEnabled(true);
  const ctx = engine, from = ctx.gains.length;
  assert.equal(S.startAtmosphere({ mood: 'calm', theirMood: 'low' }), true);
  const bed = ctx.gains[from];
  hidden = true; listeners.visibilitychange();
  assert.equal(bed.gain.target, 0);
  hidden = false; listeners.visibilitychange();
  assert.equal(bed.gain.target, 1);
  S.stopAtmosphere();
  S.setEnabled(false);
  assert.equal(S.startAtmosphere({ mood: 'calm', theirMood: 'low' }), false, 'no bed while sound is off');
  S.setEnabled(true);
});

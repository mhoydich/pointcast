import assert from 'node:assert/strict';
import test from 'node:test';
import { createVoicePlayback } from '../src/components/shwa/lib/voice-playback.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function fixture(t, { resume = () => Promise.resolve() } = {}) {
  const states = [], calls = [], plans = [];
  let current = true;
  class Stream { constructor(tracks) { this.tracks = tracks; } getTracks() { return this.tracks; } }
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaStream');
  Object.defineProperty(globalThis, 'MediaStream', { value: Stream, configurable: true });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, 'MediaStream', descriptor); else delete globalThis.MediaStream; });
  class Audio extends EventTarget {
    paused = true; muted = false; volume = 1; srcObject = null;
    play() {
      calls.push('play');
      const plan = plans.shift();
      if (plan instanceof Error) throw plan;
      return (plan?.promise ?? Promise.resolve()).then(() => { this.paused = false; });
    }
    event(name) { this.dispatchEvent(new Event(name)); }
  }
  class Track extends EventTarget {
    kind = 'audio'; readyState = 'live'; muted = false; enabled = true;
    event(name) {
      if (name === 'mute') this.muted = true;
      if (name === 'unmute') this.muted = false;
      if (name === 'ended') this.readyState = 'ended';
      this.dispatchEvent(new Event(name));
    }
  }
  const audio = new Audio();
  const playback = createVoicePlayback({ audio, resume: () => { calls.push('resume'); return resume(); }, isCurrent: () => current, onState: value => states.push(value) });
  t.after(() => playback.dispose());
  return { audio, Track, playback, states, calls, plans, state: () => states.at(-1), relinquish() { current = false; } };
}

test('blocked playback is recoverable through a synchronous user retry without another session', async t => {
  const f = fixture(t), denied = deferred();
  f.plans.push(denied);
  const track = new f.Track(), stream = f.playback.attach(track);
  assert.equal(f.audio.srcObject, stream);
  assert.deepEqual(stream.getTracks(), [track]);
  denied.reject(new DOMException('Gesture required', 'NotAllowedError'));
  await tick();
  assert.equal(f.state().status, 'blocked');
  f.calls.length = 0;
  f.playback.retry();
  assert.deepEqual(f.calls, ['resume', 'play'], 'Both start inside retry, with no asynchronous gate');
  await tick();
  assert.equal(f.state().status, 'ready');
  assert.match(f.state().message, /in your browser/);
});

test('a connected session without a remote track stays waiting and retry creates no stream or playback', t => {
  const f = fixture(t);
  f.playback.retry();
  assert.equal(f.state().status, 'waiting');
  assert.deepEqual(f.calls, ['resume']);
  assert.equal(f.audio.srcObject, null);
});

for (const event of ['pause', 'error', 'waiting', 'stalled']) {
  test(`a later ${event} is visible even after play succeeded and a new playing event recovers`, async t => {
    const f = fixture(t);
    f.playback.attach(new f.Track()); await tick();
    assert.equal(f.state().status, 'ready');
    if (event === 'pause') f.audio.paused = true;
    f.audio.event(event);
    assert.equal(f.state().status, ['waiting', 'stalled'].includes(event) ? 'waiting' : 'interrupted');
    f.audio.paused = false; f.audio.event('playing');
    assert.equal(f.state().status, 'ready');
  });
}

test('track mute, unmute, and end have distinct states and an ended stream is not replayed', async t => {
  const f = fixture(t), track = new f.Track();
  track.muted = true;
  f.playback.attach(track); await tick();
  assert.equal(f.state().status, 'waiting', 'A resolved play is not evidence that a muted stream contains voice');
  track.event('unmute'); await tick();
  assert.equal(f.state().status, 'ready');
  track.event('mute'); assert.equal(f.state().status, 'waiting');
  track.event('ended'); assert.equal(f.state().status, 'ended');
  const plays = f.calls.filter(call => call === 'play').length;
  f.playback.retry();
  assert.equal(f.calls.filter(call => call === 'play').length, plays);
  assert.equal(f.state().status, 'ended');
});

for (const reason of ['new attempt', 'replacement track', 'dispose', 'different call']) {
  test(`a late rejection cannot overwrite state after ${reason}`, async t => {
    const f = fixture(t), pending = deferred();
    f.plans.push(pending);
    f.playback.attach(new f.Track());
    if (reason === 'new attempt') f.playback.retry();
    if (reason === 'replacement track') f.playback.attach(new f.Track());
    if (reason === 'dispose') f.playback.dispose();
    if (reason === 'different call') f.relinquish();
    await tick();
    const states = f.states.length, status = f.state().status;
    pending.reject(new DOMException('Old denial', 'NotAllowedError')); await tick();
    assert.equal(f.states.length, states);
    assert.equal(f.state().status, status);
  });
}

test('a pending play resolution cannot erase a newer interruption', async t => {
  const f = fixture(t), pending = deferred();
  f.plans.push(pending); f.playback.attach(new f.Track());
  f.audio.event('error');
  pending.resolve(); await tick();
  assert.equal(f.state().status, 'interrupted');
});

for (const failure of ['rejection', 'throw']) {
  test(`meter context ${failure} never overrides actual media playback`, async t => {
    const f = fixture(t, { resume: () => {
      if (failure === 'throw') throw Error('Context unavailable');
      return Promise.reject(Error('Context unavailable'));
    } });
    f.playback.attach(new f.Track()); await tick();
    f.playback.retry(); await tick();
    assert.equal(f.state().status, 'ready');
    assert.deepEqual(f.calls.slice(-2), ['resume', 'play']);
  });
}

test('muted or zero-volume media remains recoverable and retry restores page output', async t => {
  const f = fixture(t);
  f.playback.attach(new f.Track()); await tick();
  f.audio.muted = true; f.audio.volume = 0; f.audio.event('volumechange');
  assert.equal(f.state().status, 'blocked');
  f.playback.retry(); await tick();
  assert.equal(f.audio.muted, false); assert.equal(f.audio.volume, 1);
  assert.equal(f.state().status, 'ready');
});

test('a volume event while playback is pending is not evidence that playback started', async t => {
  const f = fixture(t), pending = deferred();
  f.plans.push(pending); f.playback.attach(new f.Track());
  f.audio.paused = false; f.audio.event('volumechange');
  assert.equal(f.state().status, 'waiting');
  pending.resolve(); await tick();
  assert.equal(f.state().status, 'ready');
});

test('replacing a track and disposal detach old events without stopping root-owned media', async t => {
  const f = fixture(t), old = new f.Track(), latest = new f.Track();
  f.playback.attach(old); await tick();
  const stream = f.playback.attach(latest); await tick();
  old.event('ended'); assert.equal(f.state().status, 'ready');
  f.playback.dispose(); f.playback.dispose();
  const states = f.states.length, calls = f.calls.length;
  latest.event('ended'); f.audio.event('error'); f.playback.retry();
  assert.equal(f.states.length, states); assert.equal(f.calls.length, calls);
  assert.equal(f.audio.srcObject, stream, 'Root owns actual pause, srcObject reset, and track cleanup');
});

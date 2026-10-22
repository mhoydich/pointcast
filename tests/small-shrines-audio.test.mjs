import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createShrineAudio } from '../src/lib/small-shrines-audio.ts';
const tick = () => new Promise(resolve => setImmediate(resolve));
class Param {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  disconnected = false;
  connect(node) { return node; }
  disconnect() { this.disconnected = true; }
}
class Source extends EventTarget {
  frequency = new Param(); started = false; stopped = false; disconnected = false;
  connect(node) { return node; }
  disconnect() { this.disconnected = true; }
  start() { this.started = true; }
  stop(at) { if (at === undefined) { this.stopped = true; this.dispatchEvent(new Event('ended')); } }
}
function fixture(t, { delayed = false, reject = false } = {}) {
  const dom = new JSDOM('', { pretendToBeVisual: true });
  const doc = dom.window.document;
  let visible = true, id = 0;
  Object.defineProperty(doc, 'visibilityState', { get: () => visible ? 'visible' : 'hidden' });
  const timers = new Map(), intervals = new Map(), contexts = [], states = [], pending = [];
  t.mock.method(globalThis, 'setTimeout', fn => { timers.set(++id, fn); return id; });
  t.mock.method(globalThis, 'clearTimeout', id => timers.delete(id));
  t.mock.method(globalThis, 'setInterval', fn => { intervals.set(++id, fn); return id; });
  t.mock.method(globalThis, 'clearInterval', id => intervals.delete(id));
  class Context extends EventTarget {
    state = 'suspended'; currentTime = 0; sampleRate = 48000; destination = new Node(); sources = []; gains = []; nodes = []; closeCalls = 0;
    createGain() { const node = new Node(); node.gain = new Param(); this.gains.push(node); this.nodes.push(node); return node; }
    createDynamicsCompressor() { const node = new Node(); for (const field of ['threshold','knee','ratio','attack','release']) node[field] = new Param(); this.nodes.push(node); return node; }
    createBiquadFilter() { const node = new Node(); node.frequency = new Param(); node.Q = new Param(); this.nodes.push(node); return node; }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    createBufferSource() { return this.createOscillator(); }
    createBuffer(channels, size) { const data = new Float32Array(size); return { getChannelData: () => data }; }
    async resume() {
      if (reject) throw Error('browser declined');
      if (delayed) await new Promise(resolve => pending.push(resolve));
      this.state = 'running'; this.dispatchEvent(new Event('statechange'));
    }
    async close() { this.closeCalls++; this.state = 'closed'; }
  }
  const audio = createShrineAudio({ document: doc, contextFactory: () => { const c = new Context(); contexts.push(c); return c; }, onStateChange: s => states.push(s) });
  t.after(() => { audio.dispose(); dom.window.close(); });
  const active = () => contexts.flatMap(c => c.sources).filter(s => s.started && !s.stopped && !s.disconnected);
  const hide = () => { visible = false; doc.dispatchEvent(new dom.window.Event('visibilitychange')); };
  const show = () => { visible = true; doc.dispatchEvent(new dom.window.Event('visibilitychange')); };
  return { audio, contexts, states, timers, intervals, pending, active, hide, show, doc, win: dom.window };
}
test('construction and preference changes are silent; every mode starts only when explicitly requested', async t => {
  const f = fixture(t);
  f.audio.setVolume(.2); f.audio.setMuted(true); f.audio.setMuted(false);
  assert.equal(f.contexts.length, 0);
  assert.equal(f.audio.getState().status, 'idle');
  for (const mode of ['tide', 'drone', 'bowl', 'pulse']) {
    assert.equal(await f.audio.start(mode), true);
    assert.equal(f.audio.getState().mode, mode);
    assert.ok(f.active().length > 0 && f.active().length <= 4);
    f.audio.stop();
    assert.equal(f.active().length, 0);
    assert.equal(f.intervals.size, 0);
  }
});
test('Stop cancels a pending resume immediately and a late resolution never starts sources', async t => {
  const f = fixture(t, { delayed: true });
  const starting = f.audio.start('tide');
  f.audio.stop();
  assert.equal(await starting, false);
  f.pending[0](); await tick();
  assert.equal(f.contexts[0].sources.length, 0);
  assert.equal(f.audio.getState().status, 'idle');
  assert.equal(f.timers.size, 0);
  assert.ok(f.contexts[0].closeCalls >= 1);
});
test('a second Play replaces a pending mode; old completion cannot close or start the new mode', async t => {
  const f = fixture(t, { delayed: true });
  const one = f.audio.start('tide');
  const two = f.audio.start('bowl');
  f.pending[1](); assert.equal(await two, true);
  f.pending[0](); assert.equal(await one, false); await tick();
  assert.equal(f.audio.getState().mode, 'bowl');
  assert.equal(f.contexts[0].sources.length, 0);
  assert.equal(f.contexts[1].state, 'running');
  assert.equal(f.active().length, 3);
});
test('resume timeout is recoverable and cancels the abandoned graph', async t => {
  const f = fixture(t, { delayed: true });
  const attempt = f.audio.start('pulse');
  [...f.timers.values()][0]();
  assert.equal(await attempt, false);
  assert.equal(f.audio.getState().status, 'error');
  f.pending[0](); await tick();
  assert.equal(f.active().length, 0);
  const retry = f.audio.start('drone'); f.pending[1]();
  assert.equal(await retry, true);
  assert.equal(f.audio.getState().status, 'playing');
});
test('volume is finite and bounded, mute controls the master, preferences never create another context', async t => {
  const f = fixture(t); await f.audio.start('drone');
  f.audio.setVolume(999); assert.equal(f.audio.getState().volume, 1);
  f.audio.setVolume(NaN); assert.equal(f.audio.getState().volume, 1);
  f.audio.setMuted(true); assert.equal(f.contexts[0].gains[0].gain.value, 0);
  f.audio.setMuted(false); assert.equal(f.contexts[0].gains[0].gain.value, .28);
  f.audio.setVolume(-1); assert.equal(f.contexts[0].gains[0].gain.value, 0);
  assert.equal(f.contexts.length, 1);
});
test('hidden page, pagehide and Astro navigation stop everything and returning stays silent', async t => {
  const f = fixture(t); await f.audio.start('bowl');
  f.hide(); assert.equal(f.active().length, 0); assert.equal(f.intervals.size, 0);
  f.show(); await tick(); assert.equal(f.contexts.length, 1);
  await f.audio.start('tide'); f.win.dispatchEvent(new f.win.Event('pagehide'));
  assert.equal(f.active().length, 0);
  await f.audio.start('drone'); f.doc.dispatchEvent(new f.win.Event('astro:before-swap'));
  assert.equal(f.active().length, 0);
  assert.equal(f.audio.getState().status, 'idle');
});
test('hiding during pending resume does not revive audio when resume resolves', async t => {
  const f = fixture(t, { delayed: true }); const starting = f.audio.start('tide');
  f.hide(); f.pending[0](); assert.equal(await starting, false);
  f.show(); await tick(); assert.equal(f.active().length, 0);
  assert.equal(f.audio.getState().status, 'idle');
});
test('interruption reports a retryable state and Dispose releases listeners and prevents restart', async t => {
  const f = fixture(t); await f.audio.start('bowl');
  f.contexts[0].state = 'suspended'; f.contexts[0].dispatchEvent(new Event('statechange'));
  assert.equal(f.audio.getState().status, 'error'); assert.equal(f.active().length, 0);
  assert.equal(await f.audio.start('pulse'), true);
  f.audio.dispose(); assert.equal(f.active().length, 0); assert.equal(f.intervals.size, 0);
  assert.equal(await f.audio.start('tide'), false);
  f.show(); assert.equal(f.audio.getState().status, 'disposed');
});
test('percussion does not catch up missed beats or allocate unbounded active voices', async t => {
  const f = fixture(t); await f.audio.start('bowl');
  const c = f.contexts[0], pulse = [...f.intervals.values()][0];
  c.currentTime = 1000; pulse();
  assert.equal(c.sources.length, 6, 'one new bowl after a long timer delay');
  for (let i = 0; i < 20; i++) { c.currentTime += 8; pulse(); assert.ok(f.active().length <= 3); }
  f.audio.setMuted(true); const before = c.sources.length; c.currentTime += 8; pulse();
  assert.equal(c.sources.length, before);
  f.audio.stop(); pulse(); assert.equal(f.active().length, 0);
});
test('rejected browser resume closes its graph without throwing to the page', async t => {
  const f = fixture(t, { reject: true });
  assert.equal(await f.audio.start('tide'), false);
  assert.equal(f.audio.getState().status, 'error');
  assert.equal(f.active().length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.contexts[0].state, 'closed');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoomSound, pentatonicHz, SOUND_NAMES } from '../public/loom/kit/sound.mjs';

function harness({ saved = {}, blocked = false, random = () => 0.5 } = {}) {
  const values = new Map(Object.entries(saved));
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const calls = { create: 0, resume: 0, close: 0, gains: [], sources: [], oscillators: [], shapers: [] };
  const audioParam = () => ({
    value: 0,
    setValueAtTime(value) { this.value = value; },
    setTargetAtTime(value) { this.target = value; },
    linearRampToValueAtTime(value) { this.linear = value; },
    exponentialRampToValueAtTime(value) { this.exponential = value; },
  });
  const node = () => ({ connect(out) { this.out = out; }, disconnect() { this.out = null; } });
  const source = () => {
    const n = { ...node(), start(at) { this.startAt = at; }, stop(at) { this.stopAt = at; } };
    calls.sources.push(n);
    return n;
  };
  const ctx = {
    state: 'suspended', currentTime: 0, sampleRate: 8000, destination: {},
    resume() {
      calls.resume++;
      if (blocked && calls.resume === 1) return Promise.reject(new Error('blocked'));
      this.state = 'running';
      return Promise.resolve();
    },
    close() { calls.close++; this.state = 'closed'; return Promise.resolve(); },
    createOscillator() {
      const n = { ...source(), frequency: audioParam() };
      calls.sources[calls.sources.length - 1] = n;
      calls.oscillators.push(n);
      return n;
    },
    createGain() {
      const n = { ...node(), gain: audioParam() };
      calls.gains.push(n);
      return n;
    },
    createWaveShaper() { const n = node(); calls.shapers.push(n); return n; },
    createBiquadFilter() { return { ...node(), frequency: audioParam(), Q: audioParam() }; },
    createBufferSource: source,
    createBuffer(_channels, size) {
      const data = new Float32Array(size);
      return { getChannelData: () => data };
    },
  };
  const page = Object.assign(new EventTarget(), { hidden: false });
  let tick = 0;
  const kit = createLoomSound({
    storage, now: () => tick, page, random, createContext: () => { calls.create++; return ctx; },
  });
  return {
    kit, calls, values, ctx, page,
    advance(ms) {
      tick += ms;
      ctx.currentTime = tick / 1000;
      for (const n of calls.sources) {
        if (n.stopAt <= ctx.currentTime && !n.ended) {
          n.ended = true;
          n.onended?.();
        }
      }
    },
  };
}

test('sound defaults off and does not synthesize or unlock until opt-in', async () => {
  const { kit, calls, values } = harness();
  assert.equal(kit.enabled, false);
  assert.equal(kit.fireBed, false);
  assert.equal(await kit.unlock(), false);
  assert.equal(kit.play('tap'), false);
  assert.equal(calls.create, 0);
  const enabling = kit.setEnabled(true);
  assert.equal(calls.resume, 1, 'resume was called synchronously in the user gesture');
  assert.equal(await enabling, true);
  assert.equal(values.get('loom-kit:sound'), '1');
  assert.equal(kit.play('tap'), true);
  await kit.setEnabled(false);
  assert.equal(values.get('loom-kit:sound'), '0');
  assert.equal(calls.gains[0].gain.target, 0);
  assert.equal(kit.play('send'), false);
});

test('remembered preference still needs a gesture; rejected unlock can retry', async () => {
  const { kit, calls } = harness({ saved: { 'loom-kit:sound': '1' }, blocked: true });
  assert.equal(kit.enabled, true);
  assert.equal(kit.play('receive'), false);
  assert.equal(calls.create, 0);
  assert.equal(await kit.unlock(), false);
  assert.equal(await kit.unlock(), true);
  assert.equal(calls.create, 1);
  assert.equal(calls.resume, 2);
});

test('not supported or storage denied does not break the host view', async () => {
  const kit = createLoomSound({
    storage: { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } },
    createContext: () => null,
  });
  assert.equal(kit.enabled, false);
  assert.equal(await kit.setEnabled(true), false);
  assert.equal(kit.play('error'), false);
  assert.doesNotThrow(() => kit.dispose());
});

test('yes steps up the pentatonic scale and resets at two seconds idle', async () => {
  const h = harness();
  await h.kit.setEnabled(true);
  for (let i = 0; i < 3; i++) {
    assert.equal(h.kit.play('yes'), true);
    assert.equal(h.calls.oscillators[3 * i].frequency.value, pentatonicHz(i));
    if (i < 2) h.advance(300);
  }
  h.advance(2000);
  assert.equal(h.kit.play('yes'), true);
  assert.equal(h.calls.oscillators[9].frequency.value, pentatonicHz(0));
});

test('same sound waits 60 ms, polyphony is bounded, and sounds are not queued', async () => {
  const h = harness();
  await h.kit.setEnabled(true);
  assert.equal(h.kit.play('yes'), true);
  h.advance(59);
  assert.equal(h.kit.play('yes'), false);
  h.advance(1);
  assert.equal(h.kit.play('yes'), true);
  assert.equal(h.kit.play('send'), true);
  assert.equal(h.kit.play('error'), false);
  const voices = h.calls.sources.length;
  h.advance(500);
  assert.equal(h.calls.sources.length, voices);
  assert.equal(h.kit.play('error'), true);
});

test('all seven transient recipes are short and the pitch and level vary within spec', async () => {
  const h = harness({ random: () => 1 });
  await h.kit.setEnabled(true);
  for (const name of SOUND_NAMES.filter(name => name !== 'fire-bed')) {
    const s = h.calls.sources.length, g = h.calls.gains.length;
    assert.equal(h.kit.play(name), true);
    const sources = h.calls.sources.slice(s);
    assert.ok(Math.max(...sources.map(n => n.stopAt)) - Math.min(...sources.map(n => n.startAt)) < 0.25);
    assert.equal(h.calls.gains[g].gain.value, 10 ** (2 / 20));
    h.advance(2000);
  }
  assert.equal(h.kit.play('receive'), true);
  assert.equal(h.calls.oscillators.at(-1).frequency.value, pentatonicHz(2) * 1.03);
  const limiter = h.calls.shapers[0];
  assert.equal(h.calls.gains[0].out, limiter);
  assert.equal(limiter.out, h.ctx.destination);
  assert.ok(Math.max(...limiter.curve.map(Math.abs)) < 10 ** (-6 / 20));
});

test('fire bed is a separate saved opt-in and stops while hidden or muted', async () => {
  const h = harness();
  await h.kit.setEnabled(true);
  assert.equal(h.calls.sources.length, 0);
  await h.kit.setFireBed(true);
  assert.equal(h.calls.sources.length, 1);
  assert.equal(h.calls.sources[0].loop, true);
  assert.equal(h.values.get('loom-kit:fire-bed'), '1');
  h.page.hidden = true;
  h.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.calls.sources[0].stopAt, 0.12);
  assert.equal(h.kit.play('yes'), false);
  h.page.hidden = false;
  h.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.calls.sources.length, 2);
  await h.kit.setFireBed(false);
  assert.equal(h.calls.sources[1].stopAt, 0.12);
  assert.equal(h.values.get('loom-kit:fire-bed'), '0');
  assert.equal(h.kit.play('tap'), true);
  h.kit.dispose();
  assert.equal(h.calls.close, 1);
  assert.equal(h.kit.play('tap'), false);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createHearthAudio, hearthCue } from '../src/lib/loom/hearth-elements.mjs';
import * as browserModule from '../public/sketches/hearth-elements/hearth-elements.mjs';

const human = { from: { kind: 'human' }, body: 'Hello' };
const agent = { from: { kind: 'agent' }, body: 'Hello' };
const done = { ...agent, body: 'DONE · Sample status' };
const minted = { ...agent, body: 'MINTED: sample receipt' };
const plus = { op: 'plus' };

function audioHarness({ resume } = {}) {
  const calls = { create: 0, resume: 0, close: 0, gains: [], sources: [] };
  const node = () => ({ connect() {}, disconnect() { this.disconnected = true; } });
  const param = () => ({
    value: 0,
    setValueAtTime(value, time) { this.start = [value, time]; },
    linearRampToValueAtTime(value, time) { this.ramp = [value, time]; },
    exponentialRampToValueAtTime(value, time) { this.decay = [value, time]; },
  });
  const context = {
    currentTime: 1,
    state: 'suspended',
    destination: {},
    async resume() {
      calls.resume++;
      if (resume) await resume();
      this.state = 'running';
    },
    async close() { calls.close++; this.state = 'closed'; },
    createGain() {
      const gain = { ...node(), gain: param() };
      calls.gains.push(gain);
      return gain;
    },
    createOscillator() {
      const source = {
        ...node(),
        frequency: param(),
        start(when) { this.started = when; },
        stop(when) { this.stopped = when; },
      };
      calls.sources.push(source);
      return source;
    },
  };
  const page = Object.assign(new EventTarget(), { hidden: false });
  const audio = createHearthAudio({
    page,
    createContext: () => { calls.create++; return context; },
  });
  return { audio, calls, page };
}

test('Loom events choose the intended cue and keep all Collator inputs silent', () => {
  assert.equal(createHearthAudio, browserModule.createHearthAudio);
  assert.equal(hearthCue, browserModule.hearthCue);
  assert.deepEqual([done, minted, human, agent, plus].map(hearthCue), ['gong', 'gong', 'bell', 'chime', 'drop']);
  assert.equal(hearthCue({ ...human, body: 'done.' }), 'gong');
  assert.equal(hearthCue({ ...human, body: 'That note said DONE' }), 'bell');
  assert.equal(hearthCue({ ...agent, body: 'MINTEDLY' }), 'chime');
  assert.equal(hearthCue(null), null);
  for (const from of [{ kind: 'robot' }, { kind: 'agent', name: '  Collator ' }, { kind: 'human', address: '@collator' }]) {
    for (const event of [done, minted, human, agent, plus]) assert.equal(hearthCue({ ...event, from }), null);
  }
});

test('sound starts off; opt-in schedules distinct bounded local tones', async () => {
  const { audio, calls } = audioHarness();
  assert.equal(audio.enabled, false);
  assert.equal(audio.play(done), false);
  assert.equal(calls.create, 0);
  const enabling = audio.setEnabled(true);
  assert.equal(calls.resume, 1, 'resume is called in the gesture before yielding');
  assert.equal(await enabling, true);
  assert.equal(audio.play(human), true);
  const [d, a] = calls.sources.map(source => source.frequency.start[0]);
  assert.ok(Math.abs(d - 587.33) < 0.01);
  assert.equal(a, 880);
  assert.equal(audio.play(agent), true);
  assert.equal(calls.sources.length, 5);
  assert.equal(audio.play(plus), true);
  assert.equal(calls.sources[5].frequency.decay[0], 330);
  assert.equal(audio.play(done), false, 'overlapping cues are dropped at the voice limit');
  for (const source of calls.sources) source.onended();
  assert.equal(audio.play(done), true);
  assert.equal(audio.play(minted), true);
  assert.deepEqual(calls.sources.slice(7, 12).map(source => source.frequency.start[0]), [93, 147, 218, 343, 551]);
  assert.ok(calls.gains[0].gain.value > 0 && calls.gains[0].gain.value < 0.5);
  audio.dispose();
});

test('mute, hidden tabs and disposal silence active cues without queuing work', async () => {
  const { audio, calls, page } = audioHarness();
  assert.equal(await audio.setEnabled(true), true);
  assert.equal(audio.play(agent), true);
  page.hidden = true;
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(calls.gains[0].gain.value, 0);
  assert.ok(calls.sources.every(source => source.disconnected));
  assert.equal(audio.play(human), false);
  page.hidden = false;
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(calls.sources.length, 3);
  assert.equal(audio.play(human), true);
  await audio.setEnabled(false);
  assert.equal(calls.gains[0].gain.value, 0);
  assert.equal(audio.play(plus), false);
  audio.dispose();
  audio.dispose();
  assert.equal(calls.close, 1);
  assert.equal(await audio.setEnabled(true), false);
});

test('a blocked resume can retry and disabling wins over a pending opt-in', async () => {
  let attempts = 0;
  let resumePending;
  const { audio, calls } = audioHarness({
    resume: () => {
      if (++attempts === 1) throw new Error('Audio is blocked');
      return new Promise(resolve => { resumePending = resolve; });
    },
  });
  assert.equal(await audio.setEnabled(true), false);
  assert.equal(audio.enabled, false);
  const pending = audio.setEnabled(true);
  assert.equal(await audio.setEnabled(false), false);
  resumePending();
  assert.equal(await pending, false);
  assert.equal(audio.play(human), false);
  assert.equal(calls.create, 1);
  audio.dispose();
  const noAudio = createHearthAudio({ createContext: () => null });
  assert.equal(await noAudio.setEnabled(true), false);
  noAudio.dispose();
});

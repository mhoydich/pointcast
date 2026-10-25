import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNarrator } from '../public/open-channel/narrator.mjs';

function setup({ voices = [], locale = 'en-US', speech = true, audioAvailable = true } = {}) {
  const states = [], audio = [], utterances = [], listeners = new Set(), timers = new Map();
  let timerId = 0, now = 0, cancellations = 0, currentVoices = voices;
  class Audio {
    constructor(src) { this.src = src; this.pauses = 0; audio.push(this); }
    play() { return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); }
    pause() { this.pauses++; }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.loaded = true; }
  }
  class Utterance { constructor(text) { this.text = text; } }
  const synthesis = {
    getVoices: () => currentVoices,
    speak: item => utterances.push(item),
    cancel: () => { cancellations++; },
    addEventListener: (_, callback) => listeners.add(callback),
    removeEventListener: (_, callback) => listeners.delete(callback),
  };
  const browser = {
    navigator: { language: locale, languages: [locale] },
    setTimeout(callback, ms) { const id = ++timerId; timers.set(id, { callback, at: now + ms }); return id; },
    clearTimeout: id => timers.delete(id),
    ...(speech ? { speechSynthesis: synthesis, SpeechSynthesisUtterance: Utterance } : {}),
    ...(audioAvailable ? { Audio } : {}),
  };
  const narrator = createNarrator({ window: browser, onState: state => states.push(state), startTimeoutMs: 1000, voicesWaitMs: 100 });
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, item] = next; now = item.at; timers.delete(id); item.callback();
    }
    now = end;
  }
  function setVoices(next) { currentVoices = next; for (const callback of listeners) callback(); }
  return { narrator, states, audio, utterances, listeners, setVoices, advance, cancellations: () => cancellations };
}
const voice = (name, lang = 'en-US', extras = {}) => ({ name, lang, voiceURI: `voice:${name}`, localService: true, default: false, ...extras });
const flush = () => Promise.resolve();

test('recorded narration works without browser synthesis and only starts after play is requested', async () => {
  const c = setup({ speech: false });
  assert.equal(c.audio.length, 0); assert.equal(c.states.length, 0);
  c.narrator.play({ text: 'An authored line.', audioUrl: '/voice/line.mp3' });
  assert.equal(c.audio.length, 1); assert.equal(c.audio[0].src, '/voice/line.mp3');
  assert.deepEqual(c.states.at(-1), { status: 'loading', source: 'recording' });
  assert.equal(c.audio[0].playbackRate, 1); assert.equal(c.audio[0].preservesPitch, true);
  c.audio[0].resolve(); await flush();
  assert.deepEqual(c.states.at(-1), { status: 'speaking', source: 'recording' });
  c.audio[0].onended(); assert.deepEqual(c.states.at(-1), { status: 'ended', source: 'recording' });
  c.advance(2000); assert.equal(c.states.at(-1).status, 'ended');
});

test('stopping or replacing audio rejects late events and late play resolution', async () => {
  const c = setup();
  c.narrator.play({ audioUrl: '/one.mp3' }); const first = c.audio[0];
  const latePlaying = first.onplaying, lateEnd = first.onended, lateError = first.onerror;
  c.narrator.play({ audioUrl: '/two.mp3' }); const second = c.audio[1];
  assert.equal(first.src, ''); assert.ok(first.pauses > 0);
  second.resolve(); await flush();
  const count = c.states.length;
  latePlaying(); lateEnd(); lateError(); first.resolve(); await flush();
  assert.equal(c.states.length, count); assert.equal(c.states.at(-1).status, 'speaking');
  c.narrator.stop(); assert.equal(second.src, ''); assert.ok(second.pauses > 0);
  assert.equal(c.states.at(-1).status, 'stopped');
});

test('missing, rejected, and timed-out recordings never silently fall back to browser speech', async () => {
  const c = setup({ voices: [voice('Natural Narrator')] });
  c.narrator.play({ text: 'Missing recording.' }); assert.equal(c.states.at(-1).status, 'error');
  assert.match(c.states.at(-1).message, /Browser voice/);
  c.narrator.play({ text: 'A line.', audioUrl: '/blocked.mp3' });
  c.audio[0].reject({ name: 'NotAllowedError' }); await flush();
  assert.match(c.states.at(-1).message, /Tap Hear again/);
  c.narrator.play({ text: 'Another line.', audioUrl: '/slow.mp3' }); c.advance(1000);
  assert.match(c.states.at(-1).message, /did not start/);
  const count = c.states.length; c.audio[1].resolve(); await flush();
  assert.equal(c.states.length, count); assert.equal(c.utterances.length, 0);
});

test('browser voice ranking prefers quality names and matching English locale, not localService', () => {
  const c = setup({ locale: 'en-GB', voices: [
    voice('Albert', 'en-GB', { default: true }), voice('Plain', 'en-GB'),
    voice('Natural Remote', 'en-GB', { localService: false }), voice('Natural American'),
    voice('French Premium', 'fr-FR'), voice('Bells', 'en-GB'),
  ] });
  assert.deepEqual(c.narrator.getVoices().map(item => item.name), ['Natural Remote', 'Natural American', 'Plain', 'Albert', 'Bells']);
  c.narrator.play({ text: 'A browser line.', mode: 'browser' });
  assert.equal(c.utterances[0].voice.name, 'Natural Remote'); assert.equal(c.utterances[0].lang, 'en-GB');
  assert.equal(c.utterances[0].pitch, 1); assert.equal(c.utterances[0].rate, 1);
  c.narrator.play({ text: 'User choice.', mode: 'browser', voiceURI: 'voice:Plain', rate: 1.1 });
  assert.equal(c.utterances[1].voice.name, 'Plain'); assert.equal(c.utterances[1].rate, 1.1);
});

test('voices arriving asynchronously are selected before speaking, and cancellation prevents delayed starts', () => {
  const c = setup(); const updates = [];
  const unsubscribe = c.narrator.onVoicesChanged(list => updates.push(list.map(item => item.name)));
  c.narrator.play({ text: 'Wait for the voices.', mode: 'browser' }); assert.equal(c.utterances.length, 0);
  c.setVoices([voice('Enhanced Voice')]); assert.equal(c.utterances.length, 1);
  assert.equal(c.utterances[0].voice.name, 'Enhanced Voice'); assert.equal(updates.length, 2);
  unsubscribe(); c.setVoices([]); assert.equal(updates.length, 2);
  c.narrator.play({ text: 'Cancel this pending line.', mode: 'browser' });
  c.narrator.stop(); c.setVoices([voice('Later Voice')]); c.advance(2000);
  assert.equal(c.utterances.length, 1); assert.equal(c.states.at(-1).status, 'stopped');
});

test('browser fallback remains usable when a browser never exposes its voice list', () => {
  const c = setup();
  c.narrator.play({ text: 'Read with the browser default.', mode: 'browser' }); c.advance(100);
  assert.equal(c.utterances.length, 1); assert.equal(c.utterances[0].text, 'Read with the browser default.');
  assert.equal(c.utterances[0].lang, 'en-us');
  c.utterances[0].onstart(); c.advance(2000); assert.equal(c.states.at(-1).status, 'speaking');
  c.utterances[0].onend(); assert.equal(c.states.at(-1).status, 'ended');
});

test('late browser callbacks and destroyed listeners cannot affect current playback', () => {
  const c = setup({ voices: [voice('Enhanced Voice')] });
  c.narrator.play({ text: 'First.', mode: 'browser' });
  const lateStart = c.utterances[0].onstart, lateEnd = c.utterances[0].onend;
  c.narrator.play({ text: 'Second.', mode: 'browser' }); c.utterances[1].onstart();
  const count = c.states.length; lateStart(); lateEnd();
  assert.equal(c.states.length, count); assert.equal(c.states.at(-1).status, 'speaking');
  c.narrator.destroy(); assert.equal(c.listeners.size, 0); assert.ok(c.cancellations() >= 2);
  c.narrator.play({ audioUrl: '/must-not-play.mp3' }); c.advance(2000);
  assert.equal(c.audio.length, 0); assert.equal(c.states.length, count);
});

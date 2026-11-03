import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

let serial = 0;
async function kit(t, AudioContext) {
  const dom = new JSDOM('<canvas width="720" height="400"></canvas>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  window.AudioContext = AudioContext;
  const audio = await import(`../src/lib/ten-doors/audio.mjs?case=${serial++}`);
  t.after(() => { dom.window.close(); delete globalThis.window; delete globalThis.document; });
  return { ...audio, win: dom.window, doc: dom.window.document };
}

test('missing or throwing Web Audio does not abort a game gesture', async (t) => {
  const kit1 = await kit(t, undefined);
  assert.equal(kit1.audio(), null);
  assert.doesNotThrow(() => { kit1.tone(440); kit1.noise(); kit1.kick(); });
  window.AudioContext = class { constructor() { throw new Error('Device unavailable'); } };
  assert.equal(kit1.audio(), null);
  assert.doesNotThrow(() => { kit1.tone(440); kit1.noise(); kit1.kick(); });
});

test('hidden sequencers cannot undo the visibility suspension', async (t) => {
  let resumes = 0, suspends = 0;
  class Context {
    state = 'suspended'; destination = {};
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    resume() { resumes++; return Promise.resolve(); }
    suspend() { suspends++; return Promise.resolve(); }
  }
  const api = await kit(t, Context);
  assert.ok(api.audio());
  const before = resumes;
  Object.defineProperty(api.doc, 'hidden', { configurable: true, value: true });
  api.doc.dispatchEvent(new api.win.Event('visibilitychange'));
  assert.equal(suspends, 1);
  assert.equal(api.audio(), null);
  assert.equal(api.out(), null);
  api.tone(440); api.noise(); api.kick();
  api.doc.dispatchEvent(new api.win.Event('click'));
  assert.equal(resumes, before);
});

test('rejected browser audio policies are handled on resume, suspend and pagehide', async (t) => {
  let closes = 0;
  class Context {
    state = 'suspended'; destination = {};
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    resume() { return Promise.reject(new Error('Not allowed')); }
    suspend() { return Promise.reject(new Error('Device gone')); }
    close() { closes++; this.state = 'closed'; return Promise.reject(new Error('Device gone')); }
  }
  const api = await kit(t, Context);
  const original = api.audio();
  assert.ok(original);
  Object.defineProperty(api.doc, 'hidden', { configurable: true, value: true });
  api.doc.dispatchEvent(new api.win.Event('visibilitychange'));
  api.win.dispatchEvent(new api.win.Event('pagehide'));
  assert.equal(closes, 1);
  Object.defineProperty(api.doc, 'hidden', { configurable: true, value: false });
  assert.notEqual(api.audio(), original, 'Back starts fresh audio instead of resuming queued notes');
  await new Promise(resolve => setImmediate(resolve));
});

test('unavailable Canvas 2D exposes a notice and leaves native controls usable', async (t) => {
  const api = await kit(t, undefined);
  const canvas = api.doc.querySelector('canvas');
  canvas.getContext = () => null;
  const g = api.fitCanvas(canvas, 720, 400);
  assert.equal(canvas.hidden, true);
  assert.match(canvas.nextElementSibling.textContent, /visual scene is unavailable/);
  assert.doesNotThrow(() => {
    const gradient = g.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#fff');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 720, 400);
    g.beginPath(); g.arc(1, 1, 1, 0, 6.28); g.stroke();
  });
});

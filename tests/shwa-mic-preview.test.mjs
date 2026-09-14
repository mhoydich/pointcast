import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/components/shwa/voice-overview.tsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
});
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { VoiceOverview } = module.exports;

async function fixture() {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://pointcast.xyz/shwa/' });
  const win = dom.window, requests = [], contexts = [], previews = [], frames = new Map();
  let nextFrame = 0, closed = false, forbiddenCalls = 0;
  const forbidden = () => { forbiddenCalls++; throw Error('Microphone preview must not transmit, store, record, or play audio'); };
  const storage = { getItem: forbidden, setItem: forbidden, removeItem: forbidden };
  Object.defineProperty(win, 'localStorage', { value: storage });
  Object.defineProperty(win, 'sessionStorage', { value: storage });
  class Context {
    state = 'running'; closes = 0; source = null; analyser = null;
    constructor() { contexts.push(this); }
    async resume() {}
    async close() { this.state = 'closed'; this.closes++; }
    get destination() { return forbidden(); }
    createAnalyser() {
      this.analyser = { fftSize: 0, disconnected: false,
        getByteTimeDomainData(bytes) { bytes.fill(144); },
        disconnect() { this.disconnected = true; },
      };
      return this.analyser;
    }
    createMediaStreamSource(stream) {
      const context = this;
      this.source = { stream, connected: false, disconnected: false,
        connect(target) { assert.equal(target, context.analyser, 'Input is connected only to its local analyser'); this.connected = true; },
        disconnect() { this.disconnected = true; },
      };
      return this.source;
    }
  }
  win.AudioContext = Context;
  Object.defineProperty(win.navigator, 'mediaDevices', { value: { getUserMedia(options) {
    assert.deepEqual(options, { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    return new Promise((resolve, reject) => requests.push({ resolve, reject }));
  } } });
  class Recorder { constructor() { forbidden(); } }
  const globals = {
    window: win, document: win.document, navigator: win.navigator,
    localStorage: storage, sessionStorage: storage, MediaRecorder: Recorder,
    fetch: forbidden, IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: callback => { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  win.MediaRecorder = Recorder; win.fetch = forbidden;
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const { createRoot } = await import('react-dom/client');
  const container = document.getElementById('root'), root = createRoot(container);
  const onPreview = state => previews.push({ ...state });
  const render = async (live = false) => { await act(async () => root.render(React.createElement(VoiceOverview, { live, onPreview }))); };
  await render();
  function stream() {
    const track = new win.EventTarget(); track.stops = 0; track.stop = () => track.stops++;
    return { track, getTracks: () => [track] };
  }
  async function click(label) {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent === label);
    assert.ok(button, `Expected ${label}`);
    await act(async () => button.click());
  }
  async function grant(index = 0) {
    const value = stream(); await act(async () => requests[index].resolve(value)); return value;
  }
  async function step(at = 100) {
    const pending = [...frames.values()]; frames.clear();
    await act(async () => pending.forEach(callback => callback(at)));
  }
  async function unmount() {
    if (!closed) { closed = true; await act(async () => root.unmount()); }
  }
  return { win, container, requests, contexts, previews, frames, render, click, grant, step, unmount,
    assertLocal() { assert.equal(forbiddenCalls, 0); },
    async close() {
      await unmount(); dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
      }
    },
  };
}

function assertReleased(f, stream, context) {
  assert.equal(stream.track.stops, 1);
  assert.equal(context.state, 'closed');
  assert.equal(context.closes, 1);
  assert.equal(context.source.disconnected, true);
  assert.equal(context.analyser.disconnected, true);
  assert.equal(f.frames.size, 0);
  assert.deepEqual(f.previews.at(-1), { active: false, level: 0, path: '0,36 320,36' });
  f.assertLocal();
}

test('only an explicit local test requests a microphone; real sampled levels stop without API or audio output', async () => {
  const f = await fixture();
  try {
    assert.equal(f.requests.length, 0); assert.equal(f.contexts.length, 0);
    assert.match(f.container.textContent, /15–30 seconds/);
    assert.match(f.container.textContent, /click Greenlight/);
    await f.click('Test microphone');
    assert.equal(f.requests.length, 1);
    assert.equal(f.previews.some(value => value.active), false);
    const stream = await f.grant(); await f.step();
    assert.equal(f.previews.at(-1).active, true);
    assert.ok(f.previews.at(-1).level > 0 && f.previews.at(-1).level <= 1);
    assert.equal(f.previews.at(-1).path.split(' ').length, 64);
    assert.match(f.container.textContent, /not being sent to Shwa/);
    await f.click('Stop microphone test');
    assertReleased(f, stream, f.contexts[0]);
  } finally { await f.close(); }
});

test('cancelled permission cannot revive a test or stop a newer local test', async () => {
  const f = await fixture();
  try {
    await f.click('Test microphone'); await f.click('Stop microphone test');
    assert.equal(f.contexts[0].state, 'closed');
    await f.click('Test microphone');
    const current = await f.grant(1); await f.step();
    const late = await f.grant(0);
    assert.equal(late.track.stops, 1);
    assert.equal(current.track.stops, 0);
    assert.equal(f.previews.at(-1).active, true);
    assert.equal(f.contexts[1].state, 'running');
    await f.click('Stop microphone test'); assertReleased(f, current, f.contexts[1]);
  } finally { await f.close(); }
});

test('a permission result arriving after drawer unmount is stopped immediately', async () => {
  const f = await fixture();
  try {
    await f.click('Test microphone'); await f.unmount();
    const late = await f.grant();
    assert.equal(late.track.stops, 1);
    assert.equal(f.contexts[0].state, 'closed');
    assert.equal(f.previews.some(value => value.active), false);
    assert.equal(f.frames.size, 0); f.assertLocal();
  } finally { await f.close(); }
});

for (const reason of ['call begins', 'pagehide', 'drawer unmounts']) {
  test(`an active local microphone test releases all resources when ${reason}`, async () => {
    const f = await fixture();
    try {
      await f.click('Test microphone'); const stream = await f.grant(); await f.step();
      if (reason === 'call begins') {
        await f.render(true);
        assert.equal(f.container.querySelector('button').disabled, true);
        await f.click('Test microphone'); assert.equal(f.requests.length, 1);
      } else if (reason === 'pagehide') {
        await act(async () => f.win.dispatchEvent(new f.win.Event('pagehide')));
      } else await f.unmount();
      assertReleased(f, stream, f.contexts[0]);
    } finally { await f.close(); }
  });
}

test('microphone denial is a local recoverable error and leaves no open audio context', async () => {
  const f = await fixture();
  try {
    await f.click('Test microphone');
    await act(async () => f.requests[0].reject(new DOMException('Denied fixture', 'NotAllowedError')));
    assert.match(f.container.textContent, /access was not allowed/);
    assert.equal(f.container.querySelector('button').textContent, 'Test microphone');
    assert.equal(f.contexts[0].state, 'closed');
    assert.equal(f.previews.some(value => value.active), false); f.assertLocal();
  } finally { await f.close(); }
});

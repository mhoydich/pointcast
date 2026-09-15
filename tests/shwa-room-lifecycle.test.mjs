import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const require = createRequire(import.meta.url);
async function component(file, stubs = {}) {
  const compiled = await build({
    entryPoints: [fileURLToPath(new URL('../src/components/shwa/' + file, import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    loader: { '.css': 'empty' }, jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
    plugins: [{ name: 'isolated-room-services', setup(builder) {
      builder.onResolve({ filter: /^\.\/(wallet-panel|account-panel|canvas-panel|station-panels)$/ }, args =>
        stubs[args.path] ? { path: args.path, namespace: 'room-test' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'room-test' }, args => ({ contents: stubs[args.path], loader: 'jsx', resolveDir: fileURLToPath(new URL('..', import.meta.url)) }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

const { StationPanels } = await component('station-panels.tsx', {
  './account-panel': 'export const RoomAccount=()=>null; export const RoomMusic=()=>null;',
  './canvas-panel': 'export const CanvasPanel=()=>null;',
  './wallet-panel': `import React, { useEffect, useState } from 'react';
    export function WalletPanel(){
      const [state,setState]=useState('idle');
      useEffect(()=>{globalThis.__roomWalletMounts++;return()=>{globalThis.__roomWalletUnmounts++;};},[]);
      return <div data-wallet-state={state}><button onClick={()=>{setState('pending');globalThis.__finishRoomPayment=()=>setState('confirmed mock receipt');}}>Mock submit payment</button><button>Mock wallet last action</button><p>{state}</p></div>;
    }`,
});
const { default: Home } = await component('page.tsx', {
  './station-panels': `import React from 'react'; export function StationPanels(p){return <main>
    <output data-phase>{p.phase}</output><output data-control>{String(p.canGenerate)}</output><output data-playback>{p.voicePlayback?.status}</output>
    <output data-canvas>{JSON.stringify(p.canvas)}</output><output data-image-busy>{String(p.imageBusy)}</output><output data-images>{JSON.stringify(p.images)}</output>
    <textarea aria-label="Image draft" value={p.prompt} onInput={event=>p.setPrompt(event.currentTarget.value)}/>
    <button data-manual-generate onClick={()=>p.generate(p.prompt)}>Manual image handler</button>
    {p.children}</main>;}`,
});

const panelProps = {
  canvas: [], canvasEnabled: true, setCanvasEnabled() {}, contextState: '', onActivity() {},
  onAnswer() {}, async onCanvasImage() {}, async onResearch() {}, phase: 'idle',
  line: { available: true, remainingCalls: 10 }, message: '', seconds: 120, muted: false,
  voicePlayback: { status: 'waiting', message: 'Waiting for Shwa’s voice.' },
  signals: { input: 0, output: 0, inputPath: '', outputPath: '' }, captions: [], notes: null,
  notesState: '', costs: { voice: 0, notes: 0, images: 0, research: 0 }, prompt: '',
  setPrompt() {}, images: [], imageState: '', imageBusy: false, canGenerate: false, generate() {},
};

async function mount(Component, props, prepare = () => ({})) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://pointcast.xyz/shwa/' });
  const extras = prepare(dom.window);
  const globals = {
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true,
    __roomWalletMounts: 0, __roomWalletUnmounts: 0, __finishRoomPayment: undefined,
    fetch: async () => { throw Error('Unexpected network request in room regression test'); },
    ...extras,
  };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const container = dom.window.document.getElementById('root');
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(Component, props)));
  return { dom, container, async close() {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  } };
}
async function click(element) {
  assert.ok(element, 'Expected an actionable element');
  element.focus();
  await act(async () => element.click());
}

test('closing or changing drawers preserves a pending wallet operation and its eventual receipt', async () => {
  const view = await mount(StationPanels, panelProps);
  try {
    await click(view.container.querySelector('[aria-label="Open wallet"]'));
    await click(view.container.querySelector('[data-wallet-state] button'));
    assert.equal(view.container.querySelector('[data-wallet-state]').dataset.walletState, 'pending');
    await click(view.container.querySelector('[aria-label="Close panel"]'));
    const wallet = view.container.querySelector('[data-wallet-state]');
    assert.ok(wallet, 'Closing a drawer must not unmount the wallet');
    assert.ok(wallet.closest('[hidden]'));
    assert.equal(globalThis.__roomWalletUnmounts, 0);

    await click(view.container.querySelector('.cost-chip'));
    assert.equal(view.container.querySelector('[data-wallet-state]'), wallet);
    await act(async () => globalThis.__finishRoomPayment());
    await click(view.container.querySelector('[aria-label="Close panel"]'));
    await click(view.container.querySelector('[aria-label="Open wallet"]'));
    assert.equal(view.container.querySelector('[data-wallet-state]').dataset.walletState, 'confirmed mock receipt');
    assert.equal(globalThis.__roomWalletMounts, 1);
  } finally { await view.close(); }
});

test('Shift+Tab from the dialog container wraps inside and excludes the hidden wallet', async () => {
  const view = await mount(StationPanels, panelProps);
  try {
    await click(view.container.querySelector('[aria-label="Open wallet"]'));
    await click(view.container.querySelector('[aria-label="Close panel"]'));
    const trigger = view.container.querySelector('.cost-chip');
    await click(trigger);
    const dialog = view.container.querySelector('[role="dialog"]');
    assert.equal(document.activeElement, dialog);
    const backwards = new view.dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    await act(async () => dialog.dispatchEvent(backwards));
    assert.equal(backwards.defaultPrevented, true);
    assert.equal(document.activeElement, dialog.querySelector('[aria-label="Close panel"]'));
    assert.equal(document.activeElement.closest('[hidden]'), null);
    await act(async () => document.activeElement.dispatchEvent(new view.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(document.activeElement, trigger);
  } finally { await view.close(); }
});

test('connected voice recovers without another session and cached restoration rejects stale playback updates', async () => {
  const requests = [], peers = [], tracks = [], beacons = [], audios = [];
  const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
  };
  let makeRemoteTrack;
  const view = await mount(Home, {}, win => {
    class Channel extends win.EventTarget {
      readyState = 'open'; sent = [];
      send(value) { this.sent.push(JSON.parse(value)); }
      close() { this.readyState = 'closed'; this.dispatchEvent(new win.Event('close')); }
    }
    class Peer extends win.EventTarget {
      iceGatheringState = 'complete'; connectionState = 'new'; channel = new Channel();
      constructor() { super(); peers.push(this); }
      createDataChannel() { return this.channel; }
      addTrack() {}
      async createOffer() { return { type: 'offer', sdp: 'v=0\r\nm=audio 9 mock\r\n' }; }
      async setLocalDescription(value) { this.localDescription = value; }
      async setRemoteDescription() {}
      close() { this.connectionState = 'closed'; }
    }
    class AudioContext {
      state = 'running'; async resume() {} async close() { this.state = 'closed'; }
      createAnalyser() { return { fftSize: 256, getByteTimeDomainData(bytes) { bytes.fill(128); } }; }
      createMediaStreamSource() { return { connect() {} }; }
    }
    class Audio extends win.EventTarget {
      paused = true; muted = false; volume = 1; srcObject = null; plans = []; plays = 0; pauses = 0;
      constructor() { super(); audios.push(this); }
      setAttribute() {}
      play() {
        this.plays++;
        return (this.plans.shift()?.promise ?? Promise.resolve()).then(() => { this.paused = false; });
      }
      pause() { this.pauses++; this.paused = true; this.dispatchEvent(new win.Event('pause')); }
    }
    class Track extends win.EventTarget {
      kind = 'audio'; readyState = 'live'; muted = false; enabled = true; stopped = false;
      stop() { this.stopped = true; this.readyState = 'ended'; }
    }
    class MediaStream {
      active = true;
      constructor(tracks) { this.tracks = tracks; }
      getTracks() { return this.tracks; }
      getAudioTracks() { return this.tracks.filter(track => track.kind === 'audio'); }
    }
    makeRemoteTrack = () => new Track();
    Object.defineProperty(win.navigator, 'mediaDevices', { value: { async getUserMedia() {
      const track = new Track(); tracks.push(track);
      return new MediaStream([track]);
    } } });
    Object.defineProperty(win.navigator, 'sendBeacon', { value: (url, body) => { beacons.push({ url, body }); return true; } });
    win.RTCPeerConnection = Peer;
    win.AudioContext = AudioContext;
    return { RTCPeerConnection: Peer, AudioContext, Audio, MediaStream, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, fetch: async (url, options) => {
      requests.push({ url, options });
      assert.equal(options.credentials, 'omit');
      if (url.endsWith('/status')) return Response.json({ available: true, remainingCalls: 10 });
      if (url.endsWith('/session/close')) return Response.json({ closed: true });
      if (url.endsWith('/session')) return Response.json({ transport: { sdp: 'v=0' }, control: { id: 'mock-call', token: 'mock-control' }, expiresAt: Date.now() + 120000 });
      throw Error('Unexpected provider operation');
    } };
  });
  try {
    const button = () => view.container.querySelector('.call-button');
    const playback = () => view.container.querySelector('[data-playback]').textContent;
    const sound = () => view.container.querySelector('[aria-label="Retry Shwa sound"]');
    const sessions = () => requests.filter(item => item.url.endsWith('/session')).length;
    const connected = index => act(async () => peers[index].channel.dispatchEvent(new view.dom.window.MessageEvent('message', { data: JSON.stringify({ type: 'session.started' }) })));
    const remote = index => act(async () => {
      const event = new view.dom.window.Event('track');
      Object.defineProperty(event, 'track', { value: makeRemoteTrack() });
      peers[index].dispatchEvent(event);
    });
    await click(button());
    await connected(0);
    assert.equal(view.container.querySelector('[data-phase]').textContent, 'connected');
    assert.equal(view.container.querySelector('[data-control]').textContent, 'true');
    assert.equal(playback(), 'waiting', 'Session started is not evidence of remote voice playback');
    await click(sound());
    assert.equal(audios[0].plays, 0, 'Without a remote track, retry does not play an empty source');
    assert.equal(sessions(), 1);

    const denied = deferred(); audios[0].plans.push(denied);
    await remote(0);
    await act(async () => denied.reject(new DOMException('Playback blocked', 'NotAllowedError')));
    assert.equal(playback(), 'blocked');
    await click(sound());
    assert.equal(playback(), 'ready');
    assert.equal(audios[0].plays, 2);
    assert.equal(sessions(), 1, 'Sound recovery must reuse this call, without another billable session');

    const late = deferred(); audios[0].plans.push(late);
    await click(sound());
    await act(async () => window.dispatchEvent(new view.dom.window.PageTransitionEvent('pagehide', { persisted: true })));
    await act(async () => window.dispatchEvent(new view.dom.window.PageTransitionEvent('pageshow', { persisted: true })));
    assert.equal(tracks[0].stopped, true);
    assert.equal(peers[0].connectionState, 'closed');
    assert.equal(audios[0].paused, true);
    assert.equal(audios[0].srcObject, null);
    assert.ok(beacons.some(item => item.url.endsWith('/session/close')));
    assert.equal(view.container.querySelector('[data-phase]').textContent, 'ended');
    assert.equal(view.container.querySelector('[data-control]').textContent, 'false');
    assert.equal(sessions(), 1, 'Restoration must not start another paid call');
    assert.equal(button().disabled, false);
    await click(button());
    assert.equal(sessions(), 2, 'A deliberate new click can restart');
    await connected(1);
    assert.equal(playback(), 'waiting');
    await remote(1);
    assert.equal(playback(), 'ready');
    await act(async () => {
      late.reject(new DOMException('Old playback denial', 'NotAllowedError'));
      audios[0].dispatchEvent(new view.dom.window.Event('error'));
    });
    assert.equal(playback(), 'ready', 'Old play promises and media events cannot change the new call');
    assert.equal(view.container.querySelector('[data-phase]').textContent, 'connected');
    assert.equal(sessions(), 2);
  } finally { await view.close(); }
});

test('native voice tools populate the board once and image work preserves drafts and restart availability', async () => {
  const requests = [], peers = [], pending = [];
  const view = await mount(Home, {}, win => {
    class Channel extends win.EventTarget {
      readyState = 'open';
      send() {}
      close() { this.readyState = 'closed'; this.dispatchEvent(new win.Event('close')); }
    }
    class Peer extends win.EventTarget {
      iceGatheringState = 'complete'; connectionState = 'new'; channel = new Channel();
      constructor() { super(); peers.push(this); }
      createDataChannel() { return this.channel; }
      addTrack() {}
      async createOffer() { return { type: 'offer', sdp: 'v=0\r\nm=audio 9 mock\r\n' }; }
      async setLocalDescription(value) { this.localDescription = value; }
      async setRemoteDescription() {}
      close() { this.connectionState = 'closed'; }
    }
    class Audio extends win.EventTarget {
      paused = true; muted = false; volume = 1;
      async play() { this.paused = false; }
      pause() { this.paused = true; }
    }
    class AudioContext {
      state = 'running'; async resume() {} async close() { this.state = 'closed'; }
      createAnalyser() { return { fftSize: 256, getByteTimeDomainData(bytes) { bytes.fill(128); } }; }
      createMediaStreamSource() { return { connect() {} }; }
    }
    Object.defineProperty(win.navigator, 'mediaDevices', { value: { async getUserMedia() {
      const track = { enabled: true, stop() {} };
      return { active: true, getTracks: () => [track], getAudioTracks: () => [track] };
    } } });
    Object.defineProperty(win.navigator, 'sendBeacon', { value: () => true });
    win.RTCPeerConnection = Peer; win.AudioContext = AudioContext;
    return { RTCPeerConnection: Peer, AudioContext, Audio, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, fetch: async (url, options) => {
      requests.push({ url, options });
      assert.equal(options.credentials, 'omit');
      if (url.endsWith('/status')) return Response.json({ available: true, remainingCalls: 10 });
      if (url.endsWith('/session/close')) return Response.json({ closed: true });
      if (url.endsWith('/session')) {
        const index = requests.filter(request => request.url.endsWith('/session')).length;
        assert.equal(JSON.parse(options.body).voiceTools, true, 'New calls explicitly enable native voice tools');
        return Response.json({ transport: { sdp: 'v=0' }, control: { id: `mock-call-${index}`, token: `mock-control-${index}` }, expiresAt: Date.now() + 120000 });
      }
      if (url.endsWith('/tool')) return new Promise((resolve, reject) => pending.push({ body: JSON.parse(options.body), resolve, reject }));
      throw Error(`Unexpected provider operation: ${url}`);
    } };
  });
  const tool = (callId, name, arguments_) => ({ type: 'response.event', event: {
    type: 'response.output_item.done', item: { type: 'function_call', call_id: callId, name, arguments: JSON.stringify(arguments_) },
  } });
  const receipt = (index, name, result) => act(async () => pending[index].resolve(Response.json({ callId: pending[index].body.callId, name, status: 'completed', voiceDelivery: 'queued', result })));
  const send = (event, peer = 0) => act(async () => peers[peer].channel.dispatchEvent(new view.dom.window.MessageEvent('message', { data: JSON.stringify(event) })));
  const canvas = () => JSON.parse(view.container.querySelector('[data-canvas]').textContent);
  const images = () => JSON.parse(view.container.querySelector('[data-images]').textContent);
  const busy = () => view.container.querySelector('[data-image-busy]').textContent === 'true';
  const sessions = () => requests.filter(request => request.url.endsWith('/session')).length;
  try {
    await click(view.container.querySelector('.call-button'));
    await send({ type: 'session.started' });
    const researchEvent = tool('research_one', 'search_web', { question: 'Look up paddle prices', request_quote: 'look up paddle prices' });
    await send(researchEvent); await send(researchEvent);
    assert.equal(pending.length, 1, 'A repeated provider function event executes only once');
    assert.deepEqual(pending[0].body, { id: 'mock-call-1', token: 'mock-control-1', callId: 'research_one' });
    assert.equal(canvas()[0].kind, 'research'); assert.equal(canvas()[0].workState, 'pending');
    const text = 'The paddle costs $99. [1]';
    const research = { parts: [{ text, citations: [{ start: text.indexOf('[1]'), end: text.length, url: 'https://example.org/paddle', title: 'Paddle maker' }] }], estimatedCost: .01 };
    await receipt(0, 'search_web', research);
    assert.equal(canvas()[0].workState, 'complete');
    assert.deepEqual(canvas()[0].researchResult, research);
    assert.equal(requests.filter(request => request.url.endsWith('/tool')).length, 1);

    await send(tool('image_one', 'generate_image', { prompt: 'A sunny paddle court', request_quote: 'generate an image of a sunny paddle court' }));
    assert.equal(pending.length, 2); assert.equal(busy(), true);
    assert.equal(canvas()[1].workState, 'pending');
    const draft = view.container.querySelector('[aria-label="Image draft"]');
    await act(async () => {
      draft.value = 'A separate draft I am still writing';
      draft.dispatchEvent(new view.dom.window.Event('input', { bubbles: true }));
    });
    await click(view.container.querySelector('[data-manual-generate]'));
    assert.equal(requests.filter(request => request.url.endsWith('/image')).length, 0, 'Home guards the manual handler while voice image work is busy');
    const image = { image: 'UklGRg==', mimeType: 'image/webp', estimatedCost: .005 };
    await receipt(1, 'generate_image', image);
    assert.equal(busy(), false);
    assert.equal(canvas()[1].workState, 'complete');
    assert.equal(canvas()[1].imageUrl, 'data:image/webp;base64,UklGRg==');
    assert.equal(images()[0].prompt, 'A sunny paddle court');
    assert.equal(draft.value, 'A separate draft I am still writing', 'Voice completion never overwrites a typed draft');

    await send(tool('image_late', 'generate_image', { prompt: 'Another sunny court', request_quote: 'generate another sunny court' }));
    assert.equal(busy(), true); assert.equal(pending.length, 3);
    await act(async () => window.dispatchEvent(new view.dom.window.PageTransitionEvent('pagehide', { persisted: true })));
    await act(async () => window.dispatchEvent(new view.dom.window.PageTransitionEvent('pageshow', { persisted: true })));
    assert.equal(busy(), false, 'Leaving the call releases its image busy state');
    assert.equal(view.container.querySelector('.call-button').disabled, false);
    await click(view.container.querySelector('.call-button'));
    assert.equal(sessions(), 2);
    await send({ type: 'session.started' }, 1);
    await receipt(2, 'generate_image', image);
    assert.equal(busy(), false);
    assert.deepEqual(canvas(), []); assert.deepEqual(images(), []);
    assert.equal(draft.value, 'A separate draft I am still writing');
    assert.equal(pending.length, 3, 'No hidden automatic retry after returning');
  } finally { await view.close(); }
});

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
  './station-panels': `import React from 'react'; export function StationPanels(p){return <main><output data-phase>{p.phase}</output><output data-control>{String(p.canGenerate)}</output>{p.children}</main>;}`,
});

const panelProps = {
  canvas: [], canvasEnabled: true, setCanvasEnabled() {}, contextState: '', onActivity() {},
  onAnswer() {}, async onCanvasImage() {}, async onResearch() {}, phase: 'idle',
  line: { available: true, remainingCalls: 10 }, message: '', seconds: 120, muted: false,
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

test('cached page restoration clears the old call and control before allowing an explicit restart', async () => {
  const requests = [], peers = [], tracks = [], beacons = [];
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
    class Audio { async play() {} pause() {} }
    Object.defineProperty(win.navigator, 'mediaDevices', { value: { async getUserMedia() {
      const track = { stopped: false, enabled: true, stop() { this.stopped = true; } }; tracks.push(track);
      return { active: true, getTracks: () => [track], getAudioTracks: () => [track] };
    } } });
    Object.defineProperty(win.navigator, 'sendBeacon', { value: (url, body) => { beacons.push({ url, body }); return true; } });
    win.RTCPeerConnection = Peer;
    return { RTCPeerConnection: Peer, AudioContext, Audio, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, fetch: async (url, options) => {
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
    await click(button());
    await act(async () => peers[0].channel.dispatchEvent(new view.dom.window.MessageEvent('message', { data: JSON.stringify({ type: 'session.started' }) })));
    assert.equal(view.container.querySelector('[data-phase]').textContent, 'connected');
    assert.equal(view.container.querySelector('[data-control]').textContent, 'true');
    await act(async () => window.dispatchEvent(new view.dom.window.PageTransitionEvent('pagehide', { persisted: true })));
    await act(async () => window.dispatchEvent(new view.dom.window.PageTransitionEvent('pageshow', { persisted: true })));
    assert.equal(tracks[0].stopped, true);
    assert.equal(peers[0].connectionState, 'closed');
    assert.ok(beacons.some(item => item.url.endsWith('/session/close')));
    assert.equal(view.container.querySelector('[data-phase]').textContent, 'ended');
    assert.equal(view.container.querySelector('[data-control]').textContent, 'false');
    assert.equal(requests.filter(item => item.url.endsWith('/session')).length, 1, 'Restoration must not start another paid call');
    assert.equal(button().disabled, false);
    await click(button());
    assert.equal(requests.filter(item => item.url.endsWith('/session')).length, 2, 'A deliberate new click can restart');
  } finally { await view.close(); }
});

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { sampleCards } from '../src/components/shwa/lib/canvas.ts';

const require = createRequire(import.meta.url);
async function component(file, services = true) {
  const stubs = services ? {
    './account-panel': 'export const RoomAccount=()=>null; export const RoomMusic=()=>null;',
    './wallet-panel': `import React,{useEffect,useState} from 'react';
      export function WalletPanel(){const[state,setState]=useState('idle');useEffect(()=>{globalThis.__boardWalletMounts++;return()=>{globalThis.__boardWalletUnmounts++;};},[]);return <button data-wallet-state={state} onClick={()=>setState('pending')}>Mock payment</button>;}`,
  } : {};
  const compiled = await build({
    entryPoints: [fileURLToPath(new URL('../src/components/shwa/' + file, import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', loader: { '.css': 'empty' },
    plugins: [{ name: 'isolated-board-services', setup(builder) {
      builder.onResolve({ filter: /^\.\/(wallet-panel|account-panel)$/ }, args => stubs[args.path] ? { path: args.path, namespace: 'board-test' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'board-test' }, args => ({ contents: stubs[args.path], loader: 'jsx', resolveDir: fileURLToPath(new URL('..', import.meta.url)) }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
const { default: Home } = await component('page.tsx');
const { StationPanels } = await component('station-panels.tsx');
const { CanvasPanel } = await component('canvas-panel.tsx', false);
const noop = () => {};
const panelProps = {
  canvas: [], canvasEnabled: true, setCanvasEnabled: noop, contextState: '', onActivity: noop,
  onAnswer: noop, onCanvasImage: async () => {}, onResearch: async () => {}, phase: 'idle',
  line: { available: true, remainingCalls: 10 }, message: '', seconds: 120, muted: false,
  signals: { input: 0, output: 0, inputPath: '', outputPath: '' }, captions: [], notes: null,
  notesState: '', costs: { voice: 0, notes: 0, images: 0, research: 0 }, prompt: '',
  setPrompt: noop, images: [], imageState: '', imageBusy: false, canGenerate: false, generate: noop,
};

async function mount(Component, props, prepare = () => ({})) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://pointcast.xyz/shwa/' });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const globals = {
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true,
    __boardWalletMounts: 0, __boardWalletUnmounts: 0,
    fetch: async () => { throw Error('Unexpected network request in board regression'); }, ...prepare(dom.window),
  };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  // React's input-event feature detection must see the DOM before its first load.
  const { createRoot } = await import('react-dom/client');
  const container = document.getElementById('root'), root = createRoot(container);
  const render = async next => { await act(async () => root.render(React.createElement(Component, next))); };
  await render(props);
  return { dom, container, render, async close() {
    await act(async () => root.unmount()); dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  } };
}
async function click(element) {
  assert.ok(element, 'Expected an actionable control');
  element.focus(); await act(async () => element.click());
}
async function input(element, value, win) {
  const prototype = element.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new win.Event('input', { bubbles: true }));
  });
}
const byText = (root, text) => [...root.querySelectorAll('button')].find(button => button.textContent.trim() === text);
const byLabel = (root, label) => [...root.querySelectorAll('[aria-label]')].find(node => node.getAttribute('aria-label') === label);
const liveCard = kind => ({ ...sampleCards().find(card => card.kind === kind), sample: false });
const image = { mimeType: 'image/webp', image: 'UklGRgAAAABXRUJQ', estimatedCost: 0.005, remainingImages: 1 };

function mediaServices(win, state) {
  class Channel extends win.EventTarget {
    readyState = 'open'; sent = [];
    send(value) { this.sent.push(JSON.parse(value)); }
    close() { this.readyState = 'closed'; this.dispatchEvent(new win.Event('close')); }
  }
  class Peer extends win.EventTarget {
    iceGatheringState = 'complete'; connectionState = 'new'; channel = new Channel();
    constructor() { super(); state.peers.push(this); }
    createDataChannel() { return this.channel; } addTrack() {}
    async createOffer() { return { type: 'offer', sdp: 'v=0\r\nm=audio 9 mock\r\n' }; }
    async setLocalDescription(value) { this.localDescription = value; }
    async setRemoteDescription() {} close() { this.connectionState = 'closed'; }
  }
  class AudioContext {
    state = 'running'; async resume() {} async close() { this.state = 'closed'; }
    createAnalyser() { return { fftSize: 256, getByteTimeDomainData(bytes) { bytes.fill(128); } }; }
    createMediaStreamSource() { return { connect() {} }; }
  }
  class Audio extends win.EventTarget {
    paused = true; muted = false; volume = 1;
    async play() { this.paused = false; this.dispatchEvent(new win.Event('playing')); }
    pause() { this.paused = true; this.dispatchEvent(new win.Event('pause')); }
  }
  Object.defineProperty(win.navigator, 'mediaDevices', { value: { async getUserMedia() {
    const track = { stopped: false, enabled: true, stop() { this.stopped = true; } }; state.tracks.push(track);
    return { active: true, getTracks: () => [track], getAudioTracks: () => [track] };
  } } });
  Object.defineProperty(win.navigator, 'sendBeacon', { value: () => true }); win.RTCPeerConnection = Peer;
  return { RTCPeerConnection: Peer, AudioContext, Audio, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, fetch: async (url, options) => {
    state.requests.push({ url, options }); assert.equal(options.credentials, 'omit');
    if (url.endsWith('/status')) return Response.json({ available: true, remainingCalls: 10 });
    if (url.endsWith('/session/close')) return Response.json({ closed: true });
    if (url.endsWith('/session')) return Response.json({ transport: { sdp: 'v=0' }, control: { id: 'mock-call', token: 'mock-control' }, expiresAt: Date.now() + 120000 });
    if (url.endsWith('/image')) return new Promise(resolve => { state.finishImage = () => resolve(Response.json(image)); });
    if (url.endsWith('/context')) return Response.json({ accepted: true });
    throw Error('Unexpected paid provider operation');
  } };
}

test('hiding and restoring canvas pieces preserves drafts, pending research, and pinned state', async () => {
  const survey = liveCard('survey'), research = liveCard('research');
  let finishResearch, searches = 0; const recorded = [];
  const props = { items: [survey, research], state: '', enabled: true, setEnabled: noop, canGenerate: true, imageBusy: false,
    onAnswer: (card, answer) => recorded.push({ card, answer }), onImage: async () => {}, onResearch: () => { searches++; return new Promise(resolve => { finishResearch = resolve; }); } };
  const view = await mount(CanvasPanel, props);
  try {
    const surveyNode = view.container.querySelector(`[data-canvas-card="${survey.id}"]`);
    const draft = 'A welcoming room full of small discoveries';
    await input(surveyNode.querySelector('textarea'), draft, view.dom.window);
    await input(surveyNode.querySelectorAll('textarea')[1], 'Listen and make things', view.dom.window);
    await input(surveyNode.querySelectorAll('textarea')[2], 'A new discovery each visit', view.dom.window);
    await click(byLabel(view.container, 'Pin ' + survey.title));
    await click(byLabel(view.container, 'Hide ' + survey.title));
    assert.ok(surveyNode.hidden, 'Hidden cards remain mounted');
    await click(byText(view.container, 'Undo hide'));
    assert.equal(view.container.querySelector(`[data-canvas-card="${survey.id}"]`), surveyNode);
    assert.equal(surveyNode.querySelector('textarea').value, draft);
    assert.ok(byLabel(surveyNode, 'Unpin ' + survey.title));
    await click(byText(surveyNode, 'Use these answers'));
    assert.equal(recorded.length, 1, 'The action below the paper submits its associated native form');
    assert.ok(recorded[0].answer.includes(draft));

    const researchNode = view.container.querySelector(`[data-canvas-card="${research.id}"]`);
    await click([...researchNode.querySelectorAll('button')].find(button => button.textContent.includes('Research this')));
    await click(byLabel(surveyNode, 'Unpin ' + survey.title));
    await click(byLabel(researchNode, 'Pin ' + research.title));
    assert.equal(view.container.querySelector('[data-canvas-card]'), researchNode, 'Pinning moves the existing piece to the front');
    await view.render({ ...props, background: 'reading' });
    assert.equal(surveyNode.querySelector('textarea').value, draft);
    await click(byLabel(researchNode, 'Hide ' + research.title));
    await act(async () => finishResearch({ parts: [{ text: 'A confirmed mock finding.', citations: [] }], estimatedCost: 0.02 }));
    await click(byText(view.container, 'Undo hide'));
    assert.equal(view.container.querySelector(`[data-canvas-card="${research.id}"]`), researchNode);
    assert.match(researchNode.textContent, /A confirmed mock finding/);
    assert.ok(byLabel(researchNode, 'Unpin ' + research.title));
    assert.equal(searches, 1);
  } finally { await view.close(); }
});

test('a canvas image remains a proposal until its explicit Greenlight button is clicked', async () => {
  const card = liveCard('image'); let generations = 0;
  const view = await mount(CanvasPanel, { items: [card], state: '', enabled: true, setEnabled: noop,
    canGenerate: true, imageBusy: false, onAnswer: noop, onResearch: async () => {}, onImage: async () => { generations++; } });
  try {
    assert.equal(generations, 0);
    await click(byLabel(view.container, 'Pin ' + card.title));
    await click(byLabel(view.container, 'Hide ' + card.title));
    await click(byText(view.container, 'Undo hide'));
    assert.equal(generations, 0);
    await click([...view.container.querySelectorAll('button')].find(button => button.textContent.includes('Greenlight image')));
    assert.equal(generations, 1);
  } finally { await view.close(); }
});

test('voice-requested work stays on the same piece and displays sourced results without another request', async () => {
  const research = { ...liveCard('research'), workState: 'pending', workMessage: 'Checking the requested paddle prices.' };
  const picture = { ...liveCard('image'), workState: 'pending', workMessage: 'Making the requested paddle artwork.' };
  const text = 'The listed mock price is $100. [1]';
  const start = text.indexOf('[1]');
  const result = { estimatedCost: .01, parts: [{ text, citations: [
    { start, end: start + 3, url: 'https://example.org/paddle', title: 'Mock paddle product page' },
    { start, end: start + 3, url: 'https://example.org/paddle', title: 'Repeated product page' },
    { start, end: start + 3, url: 'javascript:alert(1)', title: 'Unsafe source' },
  ] }] };
  let requests = 0;
  const props = { items: [research, picture], state: '', enabled: true, setEnabled: noop, canGenerate: true, imageBusy: false,
    onAnswer: noop, onImage: async () => { requests++; }, onResearch: async () => { requests++; return result; } };
  const view = await mount(CanvasPanel, props);
  try {
    const researchNode = view.container.querySelector(`[data-canvas-card="${research.id}"]`);
    const pictureNode = view.container.querySelector(`[data-canvas-card="${picture.id}"]`);
    assert.match(researchNode.textContent, /Checking the requested paddle prices/);
    for (const node of [researchNode, pictureNode]) {
      assert.equal(node.dataset.workState, 'pending');
      const action = node.querySelector('.piece-response-actions button');
      assert.equal(action.disabled, true);
      await click(action);
    }
    assert.equal(requests, 0);
    await click(byLabel(researchNode, 'Pin ' + research.title));
    await click(byLabel(researchNode, 'Hide ' + research.title));
    await view.render({ ...props, background: 'reading', items: [
      { ...research, workState: 'complete', workMessage: '', researchResult: result, researchedAt: Date.UTC(2026, 8, 15) },
      { ...picture, workState: 'complete', workMessage: '', imageUrl: 'data:image/webp;base64,UklGRgAAAABXRUJQ' },
    ] });
    await click(byText(view.container, 'Undo hide'));
    assert.equal(view.container.querySelector(`[data-canvas-card="${research.id}"]`), researchNode);
    assert.equal(researchNode.dataset.workState, 'complete');
    assert.ok(byLabel(researchNode, 'Unpin ' + research.title));
    assert.match(researchNode.textContent, /WEB SOURCES/);
    assert.match(researchNode.textContent, /The listed mock price is \$100/);
    const sources = researchNode.querySelectorAll('.research-source');
    assert.equal(sources.length, 1);
    assert.equal(sources[0].getAttribute('href'), 'https://example.org/paddle');
    assert.match(sources[0].textContent, /example.org.*Mock paddle product page.*Cited finding/);
    assert.equal(researchNode.querySelector('[href^="javascript:"]'), null);
    assert.equal(researchNode.querySelector('.piece-response-actions button'), null);
    assert.equal(pictureNode.dataset.workState, 'complete');
    assert.equal(pictureNode.querySelector('img').alt, picture.prompt);
    assert.ok(pictureNode.querySelector('[download="shwa-canvas.webp"]'));
    assert.equal(requests, 0, 'Rendering and arranging finished work cannot launch another paid request');
  } finally { await view.close(); }
});

test('a failed voice lookup exposes an explicit retry and clears the error after manual recovery', async () => {
  const card = { ...liveCard('research'), workState: 'error', workMessage: 'The source lookup could not finish.' };
  let searches = 0;
  const props = { items: [card], state: '', enabled: true, setEnabled: noop, canGenerate: true, imageBusy: false,
    onAnswer: noop, onImage: async () => {}, onResearch: async () => { searches++; return { estimatedCost: .01, parts: [{ text: 'Recovered result.', citations: [] }] }; } };
  const view = await mount(CanvasPanel, props);
  try {
    assert.match(view.container.querySelector('[role="alert"]').textContent, /could not finish/);
    assert.equal(searches, 0);
    await click([...view.container.querySelectorAll('button')].find(button => button.textContent.includes('Try research again')));
    assert.equal(searches, 1);
    assert.match(view.container.textContent, /Recovered result/);
    assert.equal(view.container.querySelector('[role="alert"]'), null);
    assert.equal(view.container.querySelector('[data-canvas-card]').dataset.workState, 'complete');
  } finally { await view.close(); }
});

test('manual retry progress and its latest failure replace a prior voice-tool failure', async () => {
  const card = { ...liveCard('research'), workState: 'error', workMessage: 'The voice request was unclear.' };
  let failRetry;
  const props = { items: [card], state: '', enabled: true, setEnabled: noop, canGenerate: true, imageBusy: false,
    onAnswer: noop, onImage: async () => {}, onResearch: () => new Promise((_, reject) => { failRetry = reject; }) };
  const view = await mount(CanvasPanel, props);
  try {
    assert.match(view.container.querySelector('[role="alert"]').textContent, /voice request was unclear/);
    await click([...view.container.querySelectorAll('button')].find(button => button.textContent.includes('Try research again')));
    assert.match(view.container.querySelector('.piece-work-status').textContent, /Looking it up and checking sources/);
    assert.doesNotMatch(view.container.querySelector('.piece-work-status').textContent, /unclear/);
    assert.equal(view.container.querySelector('[role="alert"]'), null);
    await act(async () => failRetry(Error('The research allowance is used up.')));
    assert.match(view.container.querySelector('[role="alert"]').textContent, /research allowance is used up/);
    assert.doesNotMatch(view.container.querySelector('[role="alert"]').textContent, /unclear/);
  } finally { await view.close(); }
});

test('background changes preserve a live call, prepared prompt, pending image, and wallet state', async () => {
  const state = { requests: [], peers: [], tracks: [] };
  const view = await mount(Home, {}, win => mediaServices(win, state));
  try {
    await click(byText(view.container, 'Edit idea'));
    const prompt = 'A tiny illustrated observatory in the desert';
    await input(view.container.querySelector('#image-prompt'), prompt, view.dom.window);
    const backgrounds = view.container.querySelector('[aria-label="Functional backgrounds"]');
    await click(byText(backgrounds, 'Grid'));
    assert.equal(state.requests.filter(item => item.url.endsWith('/image')).length, 0);
    await click(view.container.querySelector('.call-button'));
    await act(async () => state.peers[0].channel.dispatchEvent(new view.dom.window.MessageEvent('message', { data: JSON.stringify({ type: 'session.started' }) })));
    assert.equal(view.container.querySelector('#image-prompt').value, prompt, 'Starting a call preserves the prepared image idea');
    assert.equal(state.requests.filter(item => item.url.endsWith('/image')).length, 0, 'Call start does not greenlight the image');

    await click(byLabel(view.container, 'Open wallet'));
    await click(view.container.querySelector('[data-wallet-state]'));
    await click(byLabel(view.container, 'Close panel'));
    const wallet = view.container.querySelector('[data-wallet-state]');
    await click(view.container.querySelector('.greenlight'));
    await click(view.container.querySelector('.greenlight'));
    for (const name of ['Reading', 'Radio', 'Studio']) await click(byText(backgrounds, name));
    assert.equal(state.requests.filter(item => item.url.endsWith('/session')).length, 1);
    assert.equal(state.requests.filter(item => item.url.endsWith('/image')).length, 1);
    const sent = JSON.parse(state.requests.find(item => item.url.endsWith('/image')).options.body);
    assert.equal(sent.prompt, prompt);
    assert.equal(state.peers.length, 1);
    assert.notEqual(state.peers[0].connectionState, 'closed');
    assert.equal(state.tracks[0].stopped, false);
    assert.ok(byText(view.container, 'End call'));
    assert.equal(wallet.dataset.walletState, 'pending');
    assert.equal(globalThis.__boardWalletMounts, 1);
    assert.equal(globalThis.__boardWalletUnmounts, 0);

    await act(async () => state.finishImage());
    const generated = view.container.querySelector('.generated-image img');
    assert.equal(generated.alt, prompt);
    assert.equal(generated.src, 'data:image/webp;base64,' + image.image);
    await click(byText(view.container, 'Use as backdrop'));
    assert.ok(view.container.querySelector('.room-landscape').style.backgroundImage.includes(generated.src));
    await click(byText(backgrounds, 'Radio'));
    await click(byText(backgrounds, 'Studio'));
    assert.equal(view.container.querySelector('.generated-image img'), generated);
    assert.equal(view.container.querySelector('[data-wallet-state]'), wallet);
    assert.equal(state.requests.filter(item => item.url.endsWith('/image')).length, 1, 'Using and switching backgrounds is not another image request');
  } finally { await view.close(); }
});

test('generated backdrops accept WebP data only and radio preview stays explicitly decorative', async () => {
  let generated = 0;
  const props = { ...panelProps, generate: () => { generated++; } };
  const view = await mount(StationPanels, props);
  try {
    for (const url of ['javascript:alert(1)', 'https://example.test/tracker.webp', 'data:image/svg+xml,<svg/>', 'data:image/webp;base64,abc\");color:red;/*']) {
      await view.render({ ...props, images: [{ url, prompt: 'An invalid background' }] });
      await click(byText(view.container, 'Use as backdrop'));
      assert.equal(view.container.querySelector('.room-landscape').style.backgroundImage, '');
    }
    const safe = 'data:image/webp;base64,' + image.image;
    await view.render({ ...props, images: [{ url: safe, prompt: 'A valid generated image' }] });
    await click(byText(view.container, 'Use as backdrop'));
    assert.ok(view.container.querySelector('.room-landscape').style.backgroundImage.includes(safe));
    const backgrounds = view.container.querySelector('[aria-label="Functional backgrounds"]');
    await click(byText(backgrounds, 'Radio'));
    const radio = view.container.querySelector('.radio-field');
    assert.equal(radio.getAttribute('aria-hidden'), 'true');
    assert.ok(radio.classList.contains('signal-ambient'));
    assert.match(view.container.querySelector('.radio-tuner').textContent, /AMBIENT.*VISUAL PREVIEW/);
    await click(byLabel(view.container, 'Pause background animation'));
    assert.ok(view.container.querySelector('main').classList.contains('motion-paused'));
    await view.render({ ...props, phase: 'connected', signals: { ...props.signals, output: 0.1 }, images: [{ url: safe, prompt: 'A valid generated image' }] });
    assert.ok(radio.classList.contains('signal-transmitting'));
    assert.equal(generated, 0);
  } finally { await view.close(); }
});

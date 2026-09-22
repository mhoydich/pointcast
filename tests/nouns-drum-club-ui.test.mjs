import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const tick = () => new Promise(resolve => setImmediate(resolve));
let serial = 0;

class Param {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  connect(target) { return target; }
  disconnect() { this.disconnected = true; }
}
class Source extends Node {
  frequency = new Param(); detune = new Param(); listeners = []; starts = []; stops = [];
  addEventListener(type, callback) { if (type === 'ended') this.listeners.push(callback); }
  start(at = 0) { this.starts.push(at); }
  stop(at) { this.stops.push(at); }
}

const markup = `
<main id="ndc">
  <canvas id="ndc-canvas"></canvas><span id="ndc-stage-caption"></span><span id="ndc-last-hit"></span>
  <button id="ndc-sound"></button><input id="ndc-volume" value="65"><p id="ndc-status"></p>
  <div data-member="0"></div><div data-member="1"></div><div data-member="2"></div><div data-member="3"></div>
  <button data-pad="kick"></button><button data-pad="snare"></button>
  <div id="ndc-sequencer"></div><input id="ndc-tempo" value="108"><input id="ndc-swing" value="12">
  <button id="ndc-play"></button><button id="ndc-record"></button><button id="ndc-clear"></button>
  <button data-preset="clubhouse"></button><button data-preset="parade"></button><button data-preset="moonwalk"></button>
  <select id="ndc-add-lane"><option value=""></option></select><button id="ndc-fill"></button>
  <button id="ndc-copy-beat"></button><button id="ndc-invite"></button>
  <form id="ndc-room-form"><input id="ndc-room-code" value="sunshine"><button id="ndc-join"></button></form>
  <div id="ndc-people"></div><span id="ndc-room-status"></span><span id="ndc-room-dot"></span>
  <button id="ndc-leave"></button><button id="ndc-new-room"></button>
  <button data-reaction="✦"></button><button id="ndc-motion"></button><button id="ndc-scene"></button>
  <button id="ndc-help"></button><section id="ndc-guide"></section>
  <input id="typing"><textarea id="writing"></textarea><div id="editing" contenteditable="true"></div>
</main>`;

async function fixture(t, url = 'https://pointcast.test/nouns/drum-club/') {
  const dom = new JSDOM(markup, { url, pretendToBeVisual: true });
  const { window: win } = dom;
  const contexts = [];
  const copied = [];
  class Context {
    state = 'suspended'; currentTime = 10; sampleRate = 8000; destination = new Node(); sources = []; closeCalls = 0;
    constructor() { contexts.push(this); }
    createGain() { const node = new Node(); node.gain = new Param(); return node; }
    createDynamicsCompressor() { const node = new Node(); for (const key of ['threshold','knee','ratio','attack','release']) node[key] = new Param(); return node; }
    createAnalyser() { const node = new Node(); node.fftSize = 256; node.getByteTimeDomainData = data => data.fill(128); return node; }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    createBufferSource() { const source = new Source(); this.sources.push(source); return source; }
    createBiquadFilter() { const node = new Node(); node.frequency = new Param(); node.Q = new Param(); return node; }
    createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
    async resume() { this.state = 'running'; }
    async close() { this.closeCalls++; this.state = 'closed'; }
  }
  win.HTMLCanvasElement.prototype.getContext = () => null;
  win.Element.prototype.scrollIntoView = () => {};
  win.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  class ResizeObserver { observe() {} disconnect() {} }
  const values = {
    window: win, document: win.document, location: win.location, localStorage: win.localStorage,
    navigator: { clipboard: { async writeText(text) { copied.push(text); } } },
    HTMLElement: win.HTMLElement, HTMLButtonElement: win.HTMLButtonElement, HTMLInputElement: win.HTMLInputElement,
    HTMLSelectElement: win.HTMLSelectElement, HTMLCanvasElement: win.HTMLCanvasElement, Element: win.Element,
    Event: win.Event, CustomEvent: win.CustomEvent, KeyboardEvent: win.KeyboardEvent, MouseEvent: win.MouseEvent,
    PointerEvent: win.PointerEvent ?? win.MouseEvent, AbortController: win.AbortController, ResizeObserver, AudioContext: Context,
    requestAnimationFrame: win.requestAnimationFrame.bind(win), cancelAnimationFrame: win.cancelAnimationFrame.bind(win),
  };
  const previous = new Map(Object.keys(values).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries(values)) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  const uiUrl = new URL('../src/lib/nouns-drum-club-ui.ts', import.meta.url);
  let source = await readFile(uiUrl, 'utf8');
  source = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const dependency of ['audio', 'score']) {
    const relative = `./nouns-drum-club-${dependency}`;
    for (const quote of ["'", '"']) source = source.replaceAll(`${quote}${relative}${quote}`, JSON.stringify(new URL(`${relative}.ts`, uiUrl).href));
  }
  const roomUrl = new URL('./nouns-drum-club-room.ts', uiUrl);
  const roomSource = ts.transpileModule(await readFile(roomUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const roomModule = `data:text/javascript;base64,${Buffer.from(roomSource).toString('base64')}`;
  for (const quote of ["'", '"']) source = source.replaceAll(`${quote}./nouns-drum-club-room${quote}`, JSON.stringify(roomModule));
  source += `\n//# sourceURL=nouns-drum-club-ui-test-${++serial}.js`;
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const q = id => win.document.querySelector(`#ndc-${id}`);
  const key = (code, options = {}, target = win.document.body) => target.dispatchEvent(new win.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...options }));
  const click = id => q(id).dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
  const dispose = () => win.document.dispatchEvent(new win.Event('astro:before-swap'));
  t.after(() => {
    dispose(); dom.window.close();
    for (const [name, descriptor] of previous) descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name];
  });
  return { win, q, key, click, contexts, copied, dispose };
}

test('room invites preserve valid names with repeated namespace prefixes', async t => {
  const invite = 'https://pointcast.test/nouns/drum-club/?room=ndc-ndc-jam';
  const f = await fixture(t, invite);
  assert.equal(f.q('room-code').value, 'ndc-ndc-jam');
  f.click('invite'); await tick();
  assert.deepEqual(f.copied, [invite], 'opening and copying an invite retains the same room');
  assert.equal(f.contexts.length, 0, 'an invite does not automatically start audio');
});

test('mount is silent and keyboard handling excludes editing, repeats, and modifiers', async t => {
  const f = await fixture(t);
  assert.equal(f.contexts.length, 0, 'mounting does not create or resume Web Audio');
  f.key('Digit1', { repeat: true });
  f.key('Digit1', { ctrlKey: true });
  f.key('Digit1', {}, f.win.document.querySelector('#typing'));
  f.key('Digit1', {}, f.win.document.querySelector('#writing'));
  f.key('Digit1', {}, f.win.document.querySelector('#editing'));
  await tick();
  assert.equal(f.contexts.length, 0);
  f.key('Digit1'); await tick();
  assert.equal(f.contexts.length, 1);
  assert.ok(f.contexts[0].sources.length > 0, 'an ordinary instrument key unlocks and plays');
});

test('sound-off and Escape stop the loop and cancel scheduled voices', async t => {
  const f = await fixture(t);
  f.click('play'); await tick();
  assert.equal(f.q('play').getAttribute('aria-pressed'), 'true');
  const firstSources = [...f.contexts[0].sources];
  f.click('sound'); await tick();
  assert.equal(f.q('play').getAttribute('aria-pressed'), 'false');
  assert.ok(firstSources.every(source => source.stops.includes(undefined)), 'sound-off cancels look-ahead voices');
  f.click('sound'); await tick();
  f.click('play'); await tick();
  const laterSources = f.contexts[0].sources.slice(firstSources.length);
  f.key('Escape');
  assert.equal(f.q('play').getAttribute('aria-pressed'), 'false');
  assert.ok(laterSources.every(source => source.stops.includes(undefined)), 'Escape cancels the active loop voices');
});

test('teardown closes audio and ignores delayed fill callbacks', async t => {
  const f = await fixture(t);
  f.click('fill'); await tick();
  assert.equal(f.contexts.length, 1);
  const context = f.contexts[0];
  const countAtDispose = context.sources.length;
  f.dispose(); await tick();
  assert.equal(context.closeCalls, 1);
  await new Promise(resolve => setTimeout(resolve, 700));
  assert.equal(context.sources.length, countAtDispose, 'callbacks queued before teardown cannot create later voices');
  assert.equal(f.q('last-hit').textContent, '');
});

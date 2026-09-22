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
  <div data-member="0"><img src="/games/nouns-nation-battler/assets/noun-1.svg"><b>THE POCKET</b><i>Drums</i></div><div data-member="1"><img src="/games/nouns-nation-battler/assets/noun-12.svg"><b>LOW &amp; SLOW</b><i>Bass</i></div><div data-member="2"><img src="/games/nouns-nation-battler/assets/noun-5.svg"><b>GOOD VIBRATIONS</b><i>Mallets</i></div><div data-member="3"><img src="/games/nouns-nation-battler/assets/noun-9.svg"><b>CLOUD NINE</b><i>Chords</i></div>
  <button data-pad="kick"></button><button data-pad="snare"></button>
  <div id="ndc-sequencer"></div><input id="ndc-tempo" value="108"><input id="ndc-swing" value="12">
  <button id="ndc-play"></button><button id="ndc-record"></button><button id="ndc-clear"></button>
  <button data-preset="clubhouse"></button><button data-preset="parade"></button><button data-preset="moonwalk"></button>
  <select id="ndc-add-lane"><option value=""></option></select><button id="ndc-fill"></button>
  <button id="ndc-save-beat"></button><button id="ndc-copy-beat"></button><button id="ndc-invite"></button>
  <form id="ndc-room-form"><input id="ndc-room-code" value="sunshine"><button id="ndc-join"></button></form>
  <p id="ndc-quartet-context" hidden></p>
  <div id="ndc-people"></div><span id="ndc-room-status"></span><span id="ndc-room-dot"></span>
  <button id="ndc-leave"></button><button id="ndc-new-room"></button>
  <button data-reaction="✦"></button><button id="ndc-motion"></button><button id="ndc-scene"></button>
  <button id="ndc-help"></button><section id="ndc-guide"></section>
  <input id="typing"><textarea id="writing"></textarea><div id="editing" contenteditable="true"></div>
</main>`;

async function fixture(t, url = 'https://pointcast.test/nouns/drum-club/', saved = {}) {
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
  for (const [key, value] of Object.entries(saved)) win.localStorage.setItem(key, value);
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
  const arrangementsModule = `data:text/javascript;base64,${Buffer.from(`
    export function decodeBandmateQuartet(value) {
      return /^0,3,6,9$/.test(value || '') ? Object.freeze([0,3,6,9]) : null;
    }
    export function encodeBandmateQuartet(value) {
      if (!Array.isArray(value) || value.join(',') !== '0,3,6,9') throw new TypeError('invalid quartet');
      return '0,3,6,9';
    }
  `).toString('base64')}`;
  const bandmatesModule = `data:text/javascript;base64,${Buffer.from(`
    const members = {
      0: { id: 0, nounId: 1, name: 'Pocket Captain', role: 'drum' },
      3: { id: 3, nounId: 12, name: 'Low & Slow', role: 'bass' },
      6: { id: 6, nounId: 5, name: 'Soft Signal', role: 'mallet' },
      9: { id: 9, nounId: 9, name: 'Cloud Nine', role: 'chord' },
    };
    export function getNounsDrumClubBandmate(id) { return members[id]; }
  `).toString('base64')}`;
  for (const quote of ["'", '"']) {
    source = source.replaceAll(`${quote}./nouns-drum-club-arrangements${quote}`, JSON.stringify(arrangementsModule));
    source = source.replaceAll(`${quote}./nouns-drum-club-bandmates${quote}`, JSON.stringify(bandmatesModule));
  }
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

test('room invites preserve room, current beat, and a valid quartet without starting audio', async t => {
  const invite = 'https://pointcast.test/nouns/drum-club/?room=ndc-ndc-jam&band=0,3,6,9';
  const f = await fixture(t, invite);
  assert.equal(f.q('room-code').value, 'ndc-ndc-jam');
  f.click('invite'); await tick();
  assert.equal(f.copied.length, 1);
  const copied = new URL(f.copied[0]);
  assert.equal(copied.searchParams.get('room'), 'ndc-ndc-jam');
  assert.ok(copied.searchParams.has('beat'), 'invite carries the current beat');
  assert.equal(copied.searchParams.get('band'), '0,3,6,9');
  assert.match(f.q('quartet-context').textContent, /Pocket Captain.*Low & Slow.*Soft Signal.*Cloud Nine/);
  assert.match(f.win.document.querySelector('[data-member="1"] img').src, /noun-12\.svg$/);
  assert.equal(f.win.document.querySelector('[data-member="1"] b').textContent, 'LOW & SLOW');
  assert.equal(f.win.document.querySelector('[data-member="1"] i').textContent, 'Bass');
  assert.equal(f.contexts.length, 0, 'an invite does not automatically start audio');
});

test('an invalid room parameter cannot appear as a waiting room', async t => {
  const score = { version: 1, name: 'Guest beat', tempo: 96, swing: 0.12, lanes: [] };
  const f = await fixture(t, `https://pointcast.test/nouns/drum-club/?room=${'x'.repeat(80)}&beat=${Buffer.from(JSON.stringify(score)).toString('base64url')}`);
  assert.equal(f.q('room-code').value, 'sunshine');
  assert.doesNotMatch(f.q('status').textContent, /Choose Join to enter/i);
});

test('saving a shared beat is explicit and restores its matching quartet on an ordinary visit', async t => {
  const score = { version: 1, name: 'Low & Slow', tempo: 88, swing: 0.18, lanes: [] };
  const f = await fixture(t, `https://pointcast.test/nouns/drum-club/?beat=${Buffer.from(JSON.stringify(score)).toString('base64url')}&band=0,3,6,9`);
  assert.equal(f.win.localStorage.getItem('nouns-drum-club-beat-v1'), null, 'opening a shared beat does not overwrite local work');
  f.click('save-beat'); await tick();
  assert.ok(f.win.localStorage.getItem('nouns-drum-club-beat-v1'));
  assert.match(f.q('status').textContent, /saved on this device/i);
  f.click('copy-beat'); await tick();
  assert.equal(new URL(f.copied[0]).searchParams.get('band'), '0,3,6,9');
  const saved = {
    'nouns-drum-club-beat-v1': f.win.localStorage.getItem('nouns-drum-club-beat-v1'),
    'nouns-drum-club-beat-quartet-v1': f.win.localStorage.getItem('nouns-drum-club-beat-quartet-v1'),
  };
  const restored = await fixture(t, undefined, saved);
  assert.match(restored.q('quartet-context').textContent, /Pocket Captain.*Cloud Nine/);
  assert.match(restored.win.document.querySelector('[data-member="3"] img').src, /noun-9\.svg$/);
  assert.match(restored.q('status').textContent, /Low & Slow is ready/);
  assert.equal(restored.win.document.querySelectorAll('[data-preset][aria-pressed="true"]').length, 0);
  const changedScore = { ...score, name: 'Different saved beat', tempo: 121 };
  const stale = await fixture(t, undefined, {
    ...saved,
    'nouns-drum-club-beat-v1': Buffer.from(JSON.stringify(changedScore)).toString('base64url'),
  });
  assert.equal(stale.q('quartet-context').hidden, true, 'a quartet never follows a different saved beat');
});

test('a shared beat protects local work until Save beat here adopts it', async t => {
  const oldScore = { version: 1, name: 'My earlier beat', tempo: 84, swing: 0.1, lanes: [] };
  const sharedScore = { version: 1, name: 'Friend\'s beat', tempo: 126, swing: 0.22, lanes: [] };
  const oldBeat = Buffer.from(JSON.stringify(oldScore)).toString('base64url');
  const sharedBeat = Buffer.from(JSON.stringify(sharedScore)).toString('base64url');
  const f = await fixture(t, `https://pointcast.test/nouns/drum-club/?beat=${sharedBeat}&band=0,3,6,9`, {
    'nouns-drum-club-beat-v1': oldBeat,
  });
  const firstStep = f.win.document.querySelector('[data-lane="kick"][data-step="0"]');
  firstStep.dispatchEvent(new f.win.MouseEvent('click', { bubbles: true, cancelable: true }));
  await tick();
  assert.equal(f.win.localStorage.getItem('nouns-drum-club-beat-v1'), oldBeat, 'editing a shared beat does not replace earlier local work');
  f.click('copy-beat'); await tick();
  assert.ok(new URL(f.copied[0]).searchParams.get('beat'), 'the edited shared beat can still be copied');
  f.click('save-beat'); await tick();
  assert.notEqual(f.win.localStorage.getItem('nouns-drum-club-beat-v1'), oldBeat);
  assert.match(f.q('status').textContent, /Future edits will update it here/i);
});

test('replacing a bandmate score resets the quartet stage and outgoing links', async t => {
  const f = await fixture(t, 'https://pointcast.test/nouns/drum-club/?band=0,3,6,9');
  f.win.document.querySelector('[data-preset="parade"]').dispatchEvent(new f.win.MouseEvent('click', { bubbles: true }));
  assert.equal(f.q('quartet-context').hidden, true);
  assert.equal(f.win.document.querySelector('[data-member="2"] b').textContent, 'GOOD VIBRATIONS');
  assert.equal(f.win.document.querySelector('[data-member="2"] i').textContent, 'Mallets');
  f.click('copy-beat'); await tick();
  assert.equal(new URL(f.copied[0]).searchParams.has('band'), false);

  const blank = await fixture(t, 'https://pointcast.test/nouns/drum-club/?band=0,3,6,9');
  blank.click('clear');
  assert.equal(blank.q('quartet-context').hidden, true, 'Blank canvas also restores the clubhouse quartet');
});

test('a bandmate beat keeps its name and tempo without selecting an unrelated preset', async t => {
  const score = { version: 1, name: 'Low & Slow', tempo: 88, swing: 0.18, lanes: [{padId:'bass-c',steps:[0.76,0,0,0,0,0,0,0,0.76,0,0,0,0,0,0,0]}] };
  const f = await fixture(t, `https://pointcast.test/nouns/drum-club/?beat=${Buffer.from(JSON.stringify(score)).toString('base64url')}`);
  assert.equal(f.q('tempo').value, '88');
  assert.match(f.q('status').textContent, /Low & Slow is ready/);
  assert.equal(f.win.document.querySelectorAll('[data-preset][aria-pressed="true"]').length, 0);
  assert.equal(f.contexts.length, 0, 'a shared bandmate stays silent until played');
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

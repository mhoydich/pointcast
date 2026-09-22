import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const songs = JSON.parse(readFileSync(new URL('../src/data/bell-choir-songs.json', import.meta.url), 'utf8'));
const core = readFileSync(new URL('../src/lib/karaoke.mjs', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/scripts/karaoke.mjs', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/pages/karaoke.astro', import.meta.url), 'utf8');
const textIds = ['toast', 'shwa-line', 'bpm', 'rating-title', 'rating-note', 'rating-result',
  'lyrics', 'next', 'line-announcement', 'song-label', 'status', 'player-note', 'songbook',
  'presence', 'mode-note', 'singer-label', 'pitch-note', 'pitch-detail', 'pitch-announcement', 'mic-status'];

// A small fixture keeps these tests independent of Astro's build. Each ID is
// checked against the real page, and the actual client and audio core execute
// together in the DOM's realm; only ESM import/export syntax is substituted.
const markup = `<!doctype html><html><body>
  ${textIds.map(id => `<div id="${id}"></div>`).join('')}
  <button data-mode="solo" aria-pressed="true">Solo</button>
  <button data-mode="group" aria-pressed="false">Together</button>
  ${songs.map((song, i) => `<button data-song="${i}">${song.title}</button>`).join('')}
  <span id="group-size-wrap" hidden><select id="group-size"><option value="2">2</option></select></span>
  <button id="start">Sing</button><button id="stop" disabled>Stop</button><button id="restart">Restart</button>
  <select id="pace"><option value="0.8">Gentle</option><option value="1" selected>Original</option><option value="1.15">Lively</option></select>
  <input id="volume" value="0.45" type="range" min="0" max="1" step="0.05">
  <progress id="progress" value="0" max="1"></progress>
  <button id="mic" aria-pressed="false">Enable private pitch practice</button>
  <meter id="pitch-meter" min="-50" max="50" value="0" hidden></meter>
  <section id="after-song" hidden><div id="ratings"></div>
    <button id="save-rating" disabled>Keep flowers</button><p id="award" hidden></p>
    ${['Applause', 'Love', 'Sparkle', 'Flowers'].map(label => `<button class="reaction" data-label="${label}" aria-label="${label}: 0"><b>0</b></button>`).join('')}
  </section><button id="share">Share</button>
</body></html>`;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function mediaStream() {
  const track = { stopped: 0, onended: null, stop() { this.stopped++; } };
  return { track, getTracks: () => [track] };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(t, { getUserMedia, unavailable = false, resumeGate, sampleFrequency = 0 } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/karaoke/', pretendToBeVisual: true, runScripts: 'outside-only' });
  const win = dom.window;
  const contexts = [], frames = new Map(), intervals = new Map(), timeouts = new Map(), requests = [];
  let nextId = 0, hidden = false;
  Object.defineProperty(win.document, 'hidden', { configurable: true, get: () => hidden });
  win.requestAnimationFrame = callback => { const id = ++nextId; frames.set(id, callback); return id; };
  win.cancelAnimationFrame = id => frames.delete(id);
  win.setInterval = callback => { const id = ++nextId; intervals.set(id, callback); return id; };
  win.clearInterval = id => intervals.delete(id);
  win.setTimeout = callback => { const id = ++nextId; timeouts.set(id, callback); return id; };
  win.clearTimeout = id => timeouts.delete(id);
  const node = type => ({ type, kind: type, disconnected: 0, connections: [], connect(destination) { this.connections.push(destination); return destination; }, disconnect() { this.disconnected++; } });
  const parameter = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  win.AudioContext = class {
    constructor() { this.state = 'suspended'; this.sampleRate = 48000; this.currentTime = 0; this.closed = 0; this.nodes = []; this.destination = node('destination'); contexts.push(this); }
    async resume() { if (resumeGate) await resumeGate.promise; if (this.state !== 'closed') this.state = 'running'; }
    async close() { this.closed++; this.state = 'closed'; }
    createGain() { const gain = { ...node('gain'), gain: parameter() }; this.nodes.push(gain); return gain; }
    createOscillator() { const osc = { ...node('oscillator'), frequency: parameter(), starts: [], stops: [], start(at) { this.starts.push(at); }, stop(at) { this.stops.push(at); } }; this.nodes.push(osc); return osc; }
    createMediaStreamSource(stream) { const source = { ...node('source'), stream }; this.nodes.push(source); return source; }
    createAnalyser() {
      const analyser = { ...node('analyser'), fftSize: 2048, getFloatTimeDomainData(samples) {
        for (let i = 0; i < samples.length; i++) samples[i] = sampleFrequency ? 0.3 * Math.sin(2 * Math.PI * sampleFrequency * i / 48000) : 0;
      } };
      this.nodes.push(analyser); return analyser;
    }
  };
  if (!unavailable) Object.defineProperty(win.navigator, 'mediaDevices', { value: { getUserMedia: options => {
    requests.push(options); return getUserMedia ? getUserMedia(options) : Promise.resolve(mediaStream());
  } } });
  win.eval(`const SONGS = ${JSON.stringify(songs)};\n${core.replace(/^export /gm, '')}\n${client.replace(/^import .+;\r?\n/gm, '')}\n//# sourceURL=karaoke-client-under-test.js`);
  t.after(() => { win.dispatchEvent(new win.Event('pagehide')); dom.window.close(); });
  const element = selector => win.document.querySelector(selector);
  const press = selector => element(selector).onclick.call(element(selector), new win.MouseEvent('click'));
  const step = (now = 0) => { const pending = [...frames]; frames.clear(); pending.forEach(([, callback]) => callback(now)); };
  return {
    win, contexts, frames, intervals, requests, element, press, step,
    hide() { hidden = true; win.document.dispatchEvent(new win.Event('visibilitychange')); },
    pagehide() { win.dispatchEvent(new win.Event('pagehide')); },
    async finishSong() {
      await press('#start');
      const context = contexts.find(context => context.state === 'running' && !context.nodes.some(n => n.type === 'source'));
      assert.ok(context, 'the song has a running audio context');
      context.currentTime += 60;
      step();
      assert.equal(element('#status').textContent, 'SONG COMPLETE');
    },
  };
}

function assertMicOff(app) {
  assert.equal(app.element('#mic').getAttribute('aria-pressed'), 'false');
  assert.equal(app.element('#mic').textContent, 'Enable private pitch practice');
  assert.equal(app.element('#pitch-note').textContent, '—');
  assert.equal(app.element('#pitch-detail').textContent, 'Microphone off');
  assert.equal(app.element('#pitch-meter').hidden, true);
  assert.equal(app.element('#pitch-announcement').textContent, '');
}

function chooseFlowers(app, count = 4) {
  const fields = [...app.win.document.querySelectorAll('#ratings fieldset')];
  fields.slice(0, count).forEach((field, i) => field.querySelectorAll('button')[i + 1].click());
}

function assertFreshReflection(app) {
  assert.equal(app.element('#after-song').hidden, true);
  assert.equal(app.element('#award').hidden, true);
  assert.equal(app.element('#save-rating').disabled, true);
  assert.equal(app.element('#rating-result').textContent, 'Choose flowers for each feeling, or simply sing again.');
  assert.equal(app.win.document.querySelectorAll('.flower-choice[aria-pressed="true"]').length, 0);
  assert.ok([...app.win.document.querySelectorAll('.rating-value')].every(value => value.textContent === 'Not rated yet'));
  assert.ok([...app.win.document.querySelectorAll('.reaction b')].every(value => value.textContent === '0'));
}

test('client test fixture uses real page IDs', () => {
  const fixture = new JSDOM(markup);
  for (const element of fixture.window.document.querySelectorAll('[id]')) assert.ok(page.includes(`id="${element.id}"`), `page contains #${element.id}`);
  fixture.window.close();
});

test('cancelling delayed microphone permission stops the late stream without creating audio nodes', async t => {
  const permission = deferred(), stream = mediaStream();
  const app = setup(t, { getUserMedia: () => permission.promise });
  const pending = app.press('#mic');
  assert.equal(app.element('#mic').textContent, 'Cancel microphone request');
  await app.press('#mic');
  permission.resolve(stream); await pending;
  assert.equal(stream.track.stopped, 1);
  assert.equal(app.contexts.length, 0);
  assert.equal(app.frames.size, 0);
  assertMicOff(app);
});

test('cancelling while microphone audio resumes closes the context and prevents late activation', async t => {
  const resumeGate = deferred(), stream = mediaStream();
  const app = setup(t, { getUserMedia: () => Promise.resolve(stream), resumeGate });
  const pending = app.press('#mic'); await flush();
  assert.equal(app.contexts.length, 1);
  await app.press('#mic');
  assert.equal(app.contexts[0].closed, 1);
  assert.ok(stream.track.stopped >= 1);
  resumeGate.resolve(); await pending;
  assert.equal(app.contexts[0].nodes.length, 0);
  assert.equal(app.frames.size, 0);
  assertMicOff(app);
});

test('stale microphone rejection cannot reset a newer active request', async t => {
  const first = deferred(), second = deferred(), stream = mediaStream();
  let request = 0;
  const app = setup(t, { getUserMedia: () => (++request === 1 ? first.promise : second.promise) });
  const stale = app.press('#mic'); await app.press('#mic');
  const current = app.press('#mic'); second.resolve(stream); await current;
  first.reject(new Error('Old permission denied')); await stale;
  assert.equal(app.element('#mic').getAttribute('aria-pressed'), 'true');
  assert.equal(stream.track.stopped, 0);
  assert.equal(app.frames.size, 1);
});

test('turning off an active microphone releases tracks, source, analyser, context, and animation', async t => {
  const stream = mediaStream();
  const app = setup(t, { getUserMedia: () => Promise.resolve(stream) });
  await app.press('#mic');
  assert.equal(app.element('#mic').getAttribute('aria-pressed'), 'true');
  assert.equal(app.requests[0].video, false);
  assert.equal(app.frames.size, 1);
  const context = app.contexts[0];
  await app.press('#mic');
  assert.equal(stream.track.stopped, 1);
  assert.equal(context.closed, 1);
  assert.ok(context.nodes.filter(node => ['source', 'analyser'].includes(node.type)).every(node => node.disconnected === 1));
  assert.equal(app.frames.size, 0);
  assertMicOff(app);
});

test('microphone denial preserves an off state and leaves bell playback available', async t => {
  const app = setup(t, { getUserMedia: () => Promise.reject(new Error('Permission denied')) });
  await app.press('#mic');
  assertMicOff(app);
  assert.match(app.element('#mic-status').textContent, /Microphone stayed off/);
  assert.equal(app.contexts.length, 0);
  await app.press('#start');
  assert.equal(app.element('#stop').disabled, false);
  assert.equal(app.element('#pace').disabled, true);
});

test('browsers without microphone access explain the unavailable feature', async t => {
  const app = setup(t, { unavailable: true });
  await app.press('#mic');
  assert.equal(app.element('#mic').getAttribute('aria-pressed'), 'false');
  assert.match(app.element('#mic-status').textContent, /unavailable in this browser/);
  assert.equal(app.contexts.length, 0);
  assert.equal(app.frames.size, 0);
});

test('starting bells stops pitch practice and clears the measured pitch before playback', async t => {
  const stream = mediaStream();
  const app = setup(t, { getUserMedia: () => Promise.resolve(stream), sampleFrequency: 445 });
  await app.press('#mic');
  for (const timestamp of [120, 240, 360]) app.step(timestamp);
  assert.equal(app.element('#pitch-note').textContent, 'A4');
  assert.match(app.element('#pitch-detail').textContent, /^445 Hz · \+20 cents$/);
  assert.equal(app.element('#pitch-meter').hidden, false);
  app.step(1600);
  assert.match(app.element('#pitch-announcement').textContent, /Nearest note A4/);
  await app.press('#start');
  assert.equal(stream.track.stopped, 1);
  assert.equal(app.contexts[0].closed, 1);
  assertMicOff(app);
  assert.equal(app.element('#stop').disabled, false);
  assert.equal(app.intervals.size, 1);
  assert.equal(app.frames.size, 1, 'only the bell lyric animation remains');
});

test('starting pitch practice stops and disconnects bell playback', async t => {
  const app = setup(t);
  await app.press('#start');
  const bells = app.contexts[0];
  bells.currentTime = 0.3;
  [...app.intervals.values()].forEach(callback => callback());
  const oscillators = bells.nodes.filter(node => node.kind === 'oscillator');
  assert.ok(oscillators.length > 0);
  await app.press('#mic');
  assert.equal(app.element('#status').textContent, 'BELLS STOPPED FOR PITCH PRACTICE');
  assert.equal(app.element('#stop').disabled, true);
  assert.equal(app.element('#pace').disabled, false);
  assert.equal(app.intervals.size, 0);
  assert.ok(oscillators.every(oscillator => oscillator.stops.includes(undefined)));
  assert.ok(bells.nodes.some(node => node.type === 'gain' && node.disconnected > 0));
  assert.equal(app.element('#mic').getAttribute('aria-pressed'), 'true');
});

test('starting pitch practice cancels a bell start that is still awaiting audio resume', async t => {
  const resumeGate = deferred();
  const app = setup(t, { resumeGate });
  const bellStart = app.press('#start');
  assert.equal(app.element('#start').disabled, true);
  const micStart = app.press('#mic'); await flush();
  assert.equal(app.contexts.length, 2);
  resumeGate.resolve(); await Promise.all([bellStart, micStart]);
  assert.equal(app.intervals.size, 0, 'the obsolete bell request cannot schedule sound');
  assert.equal(app.frames.size, 1, 'only microphone analysis starts');
  assert.equal(app.element('#start').disabled, false);
  assert.equal(app.element('#stop').disabled, true);
  assert.equal(app.element('#mic').getAttribute('aria-pressed'), 'true');
  assert.equal(app.contexts[0].nodes.filter(node => node.kind === 'oscillator').length, 0);
});

test('starting bells cancels an outstanding microphone permission request', async t => {
  const permission = deferred(), stream = mediaStream();
  const app = setup(t, { getUserMedia: () => permission.promise });
  const micStart = app.press('#mic');
  await app.press('#start'); permission.resolve(stream); await micStart;
  assert.equal(stream.track.stopped, 1);
  assert.equal(app.contexts.length, 1, 'the late microphone request cannot create a second context');
  assert.equal(app.intervals.size, 1);
  assert.equal(app.frames.size, 1);
  assertMicOff(app);
});

for (const action of ['hide', 'pagehide']) {
  test(`${action} releases active microphone resources`, async t => {
    const stream = mediaStream();
    const app = setup(t, { getUserMedia: () => Promise.resolve(stream) });
    await app.press('#mic'); app[action]();
    assert.equal(stream.track.stopped, 1);
    assert.equal(app.contexts[0].closed, 1);
    assert.equal(app.frames.size, 0);
    assertMicOff(app);
  });
}

test('hidden-page cancellation releases a stream that arrives after permission', async t => {
  const permission = deferred(), stream = mediaStream();
  const app = setup(t, { getUserMedia: () => permission.promise });
  const pending = app.press('#mic'); app.hide(); permission.resolve(stream); await pending;
  assert.equal(stream.track.stopped, 1);
  assert.equal(app.contexts.length, 0);
  assertMicOff(app);
});

test('external microphone track ending restores the complete off state', async t => {
  const stream = mediaStream();
  const app = setup(t, { getUserMedia: () => Promise.resolve(stream) });
  await app.press('#mic'); stream.track.onended();
  assert.equal(app.contexts[0].closed, 1);
  assert.equal(app.frames.size, 0);
  assertMicOff(app);
});

test('flowers require song completion and an explicit choice in all four fields', async t => {
  const app = setup(t);
  chooseFlowers(app); app.press('#save-rating');
  assertFreshReflection(app);
  await app.finishSong();
  assert.equal(app.element('#after-song').hidden, false);
  assert.equal(app.element('#save-rating').disabled, true);
  chooseFlowers(app, 3); app.press('#save-rating');
  assert.equal(app.element('#save-rating').disabled, true);
  assert.equal(app.element('#award').hidden, true);
  assert.doesNotMatch(app.element('#rating-result').textContent, /Your reflection:/);
  chooseFlowers(app, 4);
  assert.equal(app.element('#save-rating').disabled, false);
  app.press('#save-rating');
  assert.match(app.element('#rating-result').textContent, /Your reflection: 3.5 \/ 5 flowers/);
  assert.equal(app.element('#award').hidden, false);
  assert.equal(app.element('#save-rating').disabled, true);
  app.win.document.querySelector('#ratings button').click();
  assert.equal(app.element('#award').hidden, true, 'editing a reflection requires saving again');
  assert.equal(app.element('#save-rating').disabled, false);
});

for (const [name, selector, expectedFeeling] of [
  ['song', '[data-song="1"]', 'Courage'],
  ['mode', '[data-mode="group"]', 'Togetherness'],
]) {
  test(`switching ${name} resets all flowers, awards, counters, and microphone state`, async t => {
    const stream = mediaStream();
    const app = setup(t, { getUserMedia: () => Promise.resolve(stream) });
    await app.finishSong(); chooseFlowers(app); app.press('#save-rating');
    app.press('.reaction'); app.press('.reaction');
    assert.equal(app.element('.reaction b').textContent, '2');
    await app.press('#mic'); app.press(selector);
    assertFreshReflection(app); assertMicOff(app);
    assert.equal(stream.track.stopped, 1);
    assert.equal(app.win.document.querySelectorAll('#ratings legend')[3].textContent, expectedFeeling);
    assert.equal(app.element('#progress').value, 0);
    assert.equal(app.element('#status').textContent, 'READY WHEN YOU ARE');
    assert.equal(app.element(selector).getAttribute('aria-pressed'), 'true');
    if (name === 'song') assert.equal(app.win.location.hash, '#welcome-back');
    else { assert.equal(app.element('#presence').textContent, 'TOGETHER · ONE SCREEN'); assert.equal(app.element('#group-size-wrap').hidden, false); }
  });
}

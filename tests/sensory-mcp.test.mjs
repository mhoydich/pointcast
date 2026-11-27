/**
 * Sensory & Haptics MCP (pointcast.sensory.mcp/v1) and the campfire drum circle.
 * Sound and haptics start off. The server returns recipes and writes nothing.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { onRequestGet, onRequestOptions, onRequestPost } from '../functions/api/sensory-mcp.ts';
import {
  CAMPFIRE_DRUMS,
  SAFETY,
  SENSORY_TOOL_NAMES,
  SKETCH_PATH,
  SKETCH_WIDTH_PX,
  SPEC,
  circleManifest,
  createCampfireSession,
  dispatchSensoryTool,
  mountCampfirePage,
  handleSensoryRpc,
  renderDiscovery,
  validateToolArgs,
} from '../src/lib/mcp/sensory-mcp.mjs';
import {
  AUDIO_VOICES,
  createCampfireAudio,
  voiceProblem,
} from '../src/lib/sensory/sensory-audio.mjs';
import {
  HAPTIC_PATTERNS,
  createHapticPlayer,
  detectPlatform,
  mountIosTapticSwitch,
  patternProblem,
  tickTimes,
  vibrationFor,
} from '../src/lib/sensory/sensory-haptics.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const IDS = ['hand', 'frame', 'shaker', 'log', 'ember'];

function jsonResult(out) {
  assert.equal(out.isError, undefined);
  return JSON.parse(out.content[1].text);
}

function fakeAudio() {
  const calls = [];
  const ctx = {
    state: 'suspended',
    sampleRate: 8000,
    currentTime: 1,
    destination: { id: 'dest' },
    resume() {
      ctx.state = 'running';
      calls.push('resume');
      return Promise.resolve();
    },
    createGain() {
      return {
        gain: {
          value: 0,
          setValueAtTime(value) { calls.push(['gain', value]); },
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() { calls.push('gain-connect'); },
      };
    },
    createOscillator() {
      return {
        type: '',
        frequency: { value: 0 },
        connect() {},
        start(time) { calls.push(['osc', time]); },
        stop() {},
      };
    },
    createBuffer(_channels, length) {
      return { length, getChannelData: () => new Float32Array(length) };
    },
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start() { calls.push('noise'); },
        stop() {},
      };
    },
    createWaveShaper() {
      return { curve: null, connect() { calls.push('ceiling'); } };
    },
  };
  return { ctx, calls };
}

const post = (body, { raw = false, headers = {} } = {}) => onRequestPost({
  request: new Request('https://pointcast.xyz/api/sensory-mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: raw ? body : JSON.stringify(body),
  }),
});

const rpc = async (method, params, id = 7) => {
  const res = await post({ jsonrpc: '2.0', id, method, params });
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('MCP-Protocol-Version'), '2025-06-18');
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  return res.json();
};

test('catalogs share the five campfire drums and stay inside safe limits', () => {
  assert.equal(SPEC, 'pointcast.sensory.mcp/v1');
  assert.deepEqual(AUDIO_VOICES.map((voice) => voice.id), IDS);
  assert.deepEqual(HAPTIC_PATTERNS.map((pattern) => pattern.id), IDS);
  assert.deepEqual(CAMPFIRE_DRUMS.map((drum) => drum.id).sort(), [...IDS].sort());
  for (const voice of AUDIO_VOICES) assert.equal(voiceProblem(voice), '', voice.id);
  for (const pattern of HAPTIC_PATTERNS) assert.equal(patternProblem(pattern.vibration), '', pattern.id);
  assert.equal(patternProblem([10, 10]), 'pattern must be an odd-length list of 1 to 15 millisecond values');
  assert.equal(patternProblem([90]), 'a pulse must be 1 to 80 ms');
  assert.equal(patternProblem([10, 5, 10]), 'a gap must be 10 to 200 ms');
  assert.equal(patternProblem([10.5]), 'pattern values must be integers');
  assert.equal(voiceProblem({ id: 'x', kind: 'horn', hz: 100, gain: 0.1, durationMs: 40, noiseMs: 0 }), 'unknown kind');
  assert.equal(voiceProblem({ id: 'x', kind: 'membrane', hz: 10, gain: 0.1, durationMs: 40, noiseMs: 0 }), 'hz out of range');
  assert.equal(voiceProblem({ id: 'x', kind: 'membrane', hz: 100, gain: 0.5, durationMs: 40, noiseMs: 0 }), 'gain must be above 0 and at most 0.16');
  const circle = circleManifest();
  assert.equal(circle.widthPx, SKETCH_WIDTH_PX);
  assert.equal(circle.widthPx, 390);
  assert.equal(circle.path, SKETCH_PATH);
  assert.equal(circle.sound, false);
  assert.equal(circle.haptics, false);
  assert.equal(SAFETY.writes, false);
  assert.equal(SAFETY.storage, 'none');
});

test('haptics stay off, then fire one platform at a time', () => {
  assert.equal(detectPlatform({}), 'visual');
  assert.equal(detectPlatform({ vibrate() {} }), 'web-vibration');
  assert.equal(detectPlatform({ ios: true }), 'ios-taptic');
  assert.deepEqual(tickTimes([12, 48, 20]), [0, 60]);
  assert.deepEqual(vibrationFor(HAPTIC_PATTERNS[1], { reducedMotion: true }), [12]);
  assert.deepEqual(vibrationFor(HAPTIC_PATTERNS.find((pattern) => pattern.id === 'hand'), { reducedMotion: true }), [12]);

  const seen = [];
  const player = createHapticPlayer({
    vibrate(pattern) {
      seen.push(pattern);
      return true;
    },
  });
  assert.equal(player.enabled(), false);
  assert.equal(player.setEnabled('true'), false);
  assert.deepEqual(player.pulse('hand'), { fired: false, reason: 'haptics-off' });
  assert.deepEqual(seen, []);
  assert.equal(player.setEnabled(false), false);
  assert.deepEqual(seen, []);
  player.setEnabled(true);
  assert.equal(player.pulse('missing').reason, 'unknown-pattern');
  assert.deepEqual(player.pulse('hand').pattern, [18]);
  player.setEnabled(false);
  assert.deepEqual(seen, [[18], 0]);

  const rejected = createHapticPlayer({ vibrate: () => false });
  rejected.setEnabled(true);
  assert.equal(rejected.pulse('ember').reason, 'vibrate-rejected');
  const broken = createHapticPlayer({ vibrate() { throw new Error('blocked'); } });
  broken.setEnabled(true);
  assert.equal(broken.pulse('ember').reason, 'vibrate-failed');

  const clicks = [];
  const taptic = createHapticPlayer({
    platform: 'ios-taptic',
    reducedMotion: true,
    clickSwitch() { clicks.push('tick'); },
    schedule(fn) { fn(); },
  });
  taptic.setEnabled(true);
  const frame = taptic.pulse('frame');
  assert.deepEqual(frame.ticks, [0]);
  assert.deepEqual(clicks, ['tick']);
  assert.equal(frame.reducedMotion, true);

  const queued = [];
  const cancelled = [];
  const lateClicks = [];
  const tapticGate = createHapticPlayer({
    platform: 'ios-taptic',
    clickSwitch() { lateClicks.push(1); },
    schedule(fn, ms) {
      if (ms <= 0) {
        fn();
        return 0;
      }
      queued.push(fn);
      return queued.length;
    },
    cancel(id) { cancelled.push(id); },
  });
  tapticGate.setEnabled(true);
  tapticGate.pulse('shaker');
  tapticGate.setEnabled(false);
  assert.deepEqual(cancelled, [1, 2]);
  assert.deepEqual(lateClicks, [1]);
  queued.forEach((fn) => fn());
  assert.deepEqual(lateClicks, [1]);

  const quiet = createHapticPlayer({ platform: 'none', vibrate() { throw new Error('no'); } });
  quiet.setEnabled(true);
  assert.equal(quiet.pulse('hand').reason, 'no-haptic-hardware');
  const visual = createHapticPlayer({ platform: 'visual' });
  visual.setEnabled(true);
  assert.equal(visual.pulse('log').visual, true);
});

test('iPhone switch mount is hidden from assistive tech and optional', () => {
  assert.equal(mountIosTapticSwitch(null), null);
  assert.equal(mountIosTapticSwitch({}), null);
  let clicks = 0;
  const label = {
    htmlFor: '',
    click() { clicks += 1; },
    setAttribute() {},
  };
  const appended = [];
  const doc = {
    body: { append(node) { appended.push(node); } },
    createElement(tag) {
      if (tag === 'label') return label;
      return {
        type: '',
        id: '',
        tabIndex: 0,
        style: {},
        setAttribute(name, value) { this[name] = value; },
        append() {},
      };
    },
  };
  const clickSwitch = mountIosTapticSwitch(doc);
  assert.equal(typeof clickSwitch, 'function');
  assert.equal(appended.length, 1);
  assert.equal(appended[0]['aria-hidden'], 'true');
  assert.equal(clickSwitch(), true);
  assert.equal(clicks, 1);
});

test('sound stays off and does not open an audio context until enabled', () => {
  let built = 0;
  const engine = createCampfireAudio({
    createContext() {
      built += 1;
      throw new Error('should not build');
    },
  });
  assert.equal(engine.enabled(), false);
  assert.equal(engine.unlock(), false);
  assert.deepEqual(engine.play('hand'), { played: false, reason: 'sound-off' });
  assert.equal(engine.setEnabled(1), false);
  assert.equal(built, 0);
  engine.setEnabled(true);
  assert.equal(engine.play('nope').reason, 'unknown-voice');
  assert.equal(engine.play('hand').reason, 'audio-unavailable');
  assert.equal(built, 1);

  const { ctx, calls } = fakeAudio();
  const live = createCampfireAudio({ createContext: () => ctx });
  live.setEnabled(true);
  const played = live.play('log');
  assert.equal(played.played, true);
  assert.equal(played.voice.secondHz, 329);
  assert.equal(calls.filter((call) => Array.isArray(call) && call[0] === 'osc').length, 2);
  assert.ok(calls.includes('resume'));
  live.setEnabled(false);
  assert.equal(live.play('log').reason, 'sound-off');

  const failing = createCampfireAudio({
    createContext() {
      return {
        state: 'running',
        currentTime: 0,
        destination: {},
        sampleRate: 8000,
        createGain() {
          return { gain: { value: 0, setValueAtTime() {} }, connect() {} };
        },
        createBuffer() { throw new Error('buffer down'); },
      };
    },
  });
  failing.setEnabled(true);
  assert.equal(failing.play('shaker').reason, 'audio-failed');
});

test('campfire session starts dark, maps keys, and refuses a live engine', () => {
  const buzzed = [];
  let built = 0;
  const session = createCampfireSession({
    reducedMotion: true,
    audioOptions: {
      createContext() {
        built += 1;
        return fakeAudio().ctx;
      },
    },
    hapticOptions: {
      vibrate(pattern) {
        buzzed.push(pattern);
        return true;
      },
    },
  });
  assert.equal(session.soundEnabled(), false);
  assert.equal(session.hapticsEnabled(), false);
  const dark = session.strike('A');
  assert.equal(dark.ok, true);
  assert.equal(dark.drum, 'hand');
  assert.equal(dark.sound.reason, 'sound-off');
  assert.equal(dark.haptics.reason, 'haptics-off');
  assert.equal(built, 0);
  assert.deepEqual(buzzed, []);
  assert.equal(session.strike('nope').reason, 'unknown-drum');
  assert.equal(session.keyFor('g').id, 'ember');
  assert.equal(session.keyFor('Enter'), null);

  assert.equal(session.setSound('yes'), false);
  assert.equal(session.setHaptics('yes'), false);
  session.toggleSound();
  session.toggleHaptics();
  const hit = session.strike('3');
  assert.equal(hit.sound.played, true);
  assert.deepEqual(buzzed, [[8]]);
  assert.equal(hit.haptics.reducedMotion, true);
  session.toggleSound();
  session.toggleHaptics();
  assert.equal(session.soundEnabled(), false);
  assert.equal(session.hapticsEnabled(), false);

  const live = createCampfireAudio();
  live.setEnabled(true);
  assert.throws(() => createCampfireSession({ audio: live }), /sound must start off/);
  const liveTouch = createHapticPlayer();
  liveTouch.setEnabled(true);
  assert.throws(() => createCampfireSession({ haptics: liveTouch }), /haptics must start off/);
  assert.throws(() => createCampfireSession({ reducedMotion: 'reduce' }), /boolean/);
  assert.throws(() => createCampfireSession({ audio: { enabled() { return false; } } }), /incomplete/);
});

test('MCP tools describe default-off safety and reject bad consent', () => {
  assert.deepEqual([...SENSORY_TOOL_NAMES], [
    'sensory_status',
    'sensory_audio_catalog',
    'sensory_haptics_catalog',
    'sensory_circle',
    'sensory_cue',
  ]);
  const status = jsonResult(dispatchSensoryTool('sensory_status', {}));
  assert.equal(status.soundDefault, false);
  assert.equal(status.hapticsDefault, false);
  assert.equal(status.writes, false);
  assert.match(status.consent, /boolean true/);

  const audio = jsonResult(dispatchSensoryTool('sensory_audio_catalog', {}));
  assert.equal(audio.sound, false);
  assert.equal(audio.voices.length, 5);
  assert.ok(audio.voices.every((voice) => voice.gain <= 0.16));

  const full = jsonResult(dispatchSensoryTool('sensory_haptics_catalog', {}));
  assert.equal(full.reducedMotion, false);
  assert.deepEqual(full.patterns.find((pattern) => pattern.id === 'shaker').vibration, [8, 28, 8, 28, 8]);
  const calm = jsonResult(dispatchSensoryTool('sensory_haptics_catalog', { reducedMotion: true }));
  assert.deepEqual(calm.patterns.find((pattern) => pattern.id === 'shaker').vibration, [8]);

  const circle = jsonResult(dispatchSensoryTool('sensory_circle', {}));
  assert.equal(circle.url, 'https://pointcast.xyz/sketches/campfire-drums/');
  assert.equal(circle.sound, false);
  assert.equal(circle.haptics, false);

  const dark = jsonResult(dispatchSensoryTool('sensory_cue', { drum: 'hand' }));
  assert.equal(dark.sound.reason, 'sound-off');
  assert.equal(dark.haptics.reason, 'haptics-off');
  assert.equal(dark.sound.recipe, undefined);
  assert.equal(dark.haptics.pattern, undefined);
  assert.match(dark.note, /did not play/);

  const explicit = jsonResult(dispatchSensoryTool('sensory_cue', { drum: 'log', sound: false, haptics: false }));
  assert.equal(explicit.sound.enabled, false);
  assert.equal(explicit.haptics.enabled, false);

  const armed = jsonResult(dispatchSensoryTool('sensory_cue', {
    drum: 'frame',
    sound: true,
    haptics: true,
    reducedMotion: true,
    platform: 'web-vibration',
  }));
  assert.equal(armed.sound.recipe.hz, 174);
  assert.deepEqual(armed.haptics.pattern, [12]);
  assert.equal(armed.haptics.reducedMotion, true);

  const visual = jsonResult(dispatchSensoryTool('sensory_cue', { drum: 'ember', haptics: true, platform: 'visual' }));
  assert.equal(visual.haptics.delivered, 'visual');
  const none = jsonResult(dispatchSensoryTool('sensory_cue', { drum: 'ember', haptics: true, platform: 'none' }));
  assert.equal(none.haptics.delivered, false);
  assert.equal(none.haptics.pattern, undefined);

  const missing = dispatchSensoryTool('sensory_cue', { drum: 'volcano' });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /Unknown drum/);
  const unknown = dispatchSensoryTool('sensory_play', {});
  assert.equal(unknown.isError, true);

  assert.equal(validateToolArgs('sensory_cue', { drum: 'hand', sound: 'yes' }).message, 'sound must be a boolean');
  assert.equal(validateToolArgs('sensory_cue', { drum: 'hand', haptics: 1 }).message, 'haptics must be a boolean');
  assert.equal(validateToolArgs('sensory_cue', { drum: 'hand', play: true }).message, 'unknown argument: play');
  assert.equal(validateToolArgs('sensory_cue', {}).message, 'missing argument: drum');
  assert.match(validateToolArgs('sensory_cue', { drum: 'volcano' }).message, /must be one of/);
});

test('JSON-RPC handler speaks MCP and fails closed', async () => {
  const init = await rpc('initialize', {});
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal(init.result.serverInfo.name, 'pointcast.sensory.mcp');
  assert.equal(init.result.serverInfo.version, '1.0.0');
  assert.match(init.result.instructions, /Sound is OFF/);
  assert.match(init.result.instructions, /haptics are OFF/);
  assert.match(init.result.instructions, /pointcast\.sensory\.mcp\/v1/);

  const tools = await rpc('tools/list', {});
  assert.deepEqual(tools.result.tools.map((tool) => tool.name), [...SENSORY_TOOL_NAMES]);
  for (const tool of tools.result.tools) assert.match(tool.description, /off/i);

  const cue = await rpc('tools/call', { name: 'sensory_cue', arguments: { drum: 'hand' } });
  const payload = JSON.parse(cue.result.content[1].text);
  assert.equal(payload.sound.enabled, false);
  assert.equal(payload.haptics.enabled, false);

  const badConsent = await rpc('tools/call', { name: 'sensory_cue', arguments: { drum: 'hand', sound: 'yes' } });
  assert.equal(badConsent.error.code, -32602);
  assert.match(badConsent.error.message, /boolean/);
  assert.equal(badConsent.result, undefined);

  const extra = await rpc('tools/call', { name: 'sensory_status', arguments: { play: true } });
  assert.equal(extra.error.code, -32602);

  const badDrum = await rpc('tools/call', { name: 'sensory_cue', arguments: { drum: 'volcano' } });
  assert.equal(badDrum.error.code, -32602);

  const missingName = await rpc('tools/call', { arguments: { drum: 'hand' } });
  assert.equal(missingName.error.code, -32602);
  const badArgs = await rpc('tools/call', { name: 'sensory_cue', arguments: ['hand'] });
  assert.equal(badArgs.error.code, -32602);

  const toolError = await rpc('tools/call', { name: 'not_a_tool' });
  assert.equal(toolError.result.isError, true);
  assert.equal(toolError.error, undefined);

  const resources = await rpc('resources/list', {});
  assert.deepEqual(resources.result.resources.map((item) => item.uri), [
    'sensory://manifest',
    'sensory://circle',
    'sensory://safety',
  ]);
  const safety = await rpc('resources/read', { uri: 'sensory://safety' });
  assert.match(safety.result.contents[0].text, /Sound default: false/);
  assert.match(safety.result.contents[0].text, /Haptics default: false/);
  const missingResource = await rpc('resources/read', {});
  assert.equal(missingResource.error.code, -32002);

  const pong = await rpc('ping', {});
  assert.deepEqual(pong.result, {});
  const missing = await rpc('tools/nope', {});
  assert.equal(missing.error.code, -32601);

  const note = await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(note.status, 204);

  const parsed = await post('{', { raw: true });
  assert.equal((await parsed.json()).error.code, -32700);
  const invalid = await post({ id: 1, method: 'ping' });
  assert.equal((await invalid.json()).error.code, -32600);
  const empty = await post('null', { raw: true });
  assert.equal((await empty.json()).error.code, -32600);

  const oversized = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'ping',
    pad: 'x'.repeat(20_000),
  });
  assert.equal(oversized.status, 200);
  assert.equal((await oversized.json()).error.code, -32600);

  const options = await onRequestOptions();
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(options.headers.get('Access-Control-Allow-Headers'), /MCP-Protocol-Version/);

  const page = await onRequestGet({ request: new Request('https://preview.example/api/sensory-mcp') });
  const html = await page.text();
  assert.match(page.headers.get('Content-Type'), /text\/html/);
  assert.match(html, /pointcast\.sensory\.mcp\/v1/);
  assert.match(html, /sound off/);
  assert.match(html, /haptics off/);
  assert.match(html, /https:\/\/preview\.example\/api\/sensory-mcp/);
  assert.match(html, /\/sketches\/campfire-drums\//);

  const local = handleSensoryRpc({ jsonrpc: '2.0', id: 'abc', method: 'ping' });
  assert.equal(local.id, 'abc');
  assert.equal(handleSensoryRpc([]).code, -32600);
  assert.equal(handleSensoryRpc({ jsonrpc: '2.0', id: 1, method: 'ping', params: [] }).code, -32602);
});

test('sketch controls start off and keep keyboard, touch, and reduced motion safe', () => {
  function control(id, attrs = {}) {
    const attributes = { 'aria-pressed': 'false', ...attrs };
    const classes = new Set();
    const listeners = {};
    const state = { textContent: 'Off' };
    return {
      id,
      tagName: 'BUTTON',
      attributes,
      classes,
      listeners,
      state,
      textContent: '',
      classList: {
        toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
      },
      getAttribute: (name) => attributes[name] ?? null,
      setAttribute(name, value) { attributes[name] = String(value); },
      removeAttribute(name) { delete attributes[name]; },
      querySelector: (selector) => (selector === '.state' ? state : null),
      addEventListener(type, fn) { listeners[type] = fn; },
    };
  }

  const buzzed = [];
  const drums = ['shaker', 'frame', 'ember', 'log', 'hand'].map((id) => control(id, { 'data-drum': id }));
  const sound = control('sound');
  const haptics = control('haptics');
  const status = { textContent: 'Sound off. Haptics off.' };
  const keys = {};
  const doc = {
    getElementById: (id) => ({ sound, haptics, status })[id] || null,
    querySelectorAll: () => drums,
    addEventListener(type, fn) { keys[type] = fn; },
  };
  const win = {
    matchMedia: () => ({ matches: true }),
    navigator: {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      platform: 'Linux',
      maxTouchPoints: 0,
      vibrate(pattern) { buzzed.push(pattern); return true; },
    },
  };

  const session = mountCampfirePage(doc, win);
  assert.equal(session.soundEnabled(), false);
  assert.equal(session.hapticsEnabled(), false);
  assert.equal(sound.attributes['aria-pressed'], 'false');
  assert.equal(haptics.attributes['aria-pressed'], 'false');
  assert.equal(mountCampfirePage({ getElementById() { return null; } }, win), null);

  drums.find((drum) => drum.attributes['data-drum'] === 'hand').listeners.click();
  assert.equal(status.textContent, 'Hand drum. Sound off. Haptics off.');
  assert.deepEqual(buzzed, []);
  assert.equal(drums.find((drum) => drum.attributes['data-drum'] === 'hand').attributes['aria-current'], 'true');

  const prevented = { key: 'd', repeat: false, preventDefault() { this.prevented = true; } };
  keys.keydown(prevented);
  assert.equal(prevented.prevented, true);
  assert.equal(status.textContent, 'Shaker. Sound off. Haptics off.');
  keys.keydown({ key: 'd', repeat: true, preventDefault() { throw new Error('repeat should not strike'); } });
  keys.keydown({ key: 'Enter', target: { tagName: 'TEXTAREA' }, preventDefault() { throw new Error('typing should not strike'); } });

  haptics.listeners.click();
  assert.equal(haptics.attributes['aria-pressed'], 'true');
  assert.equal(haptics.state.textContent, 'On');
  assert.equal(status.textContent, 'Haptics on.');
  drums.find((drum) => drum.attributes['data-drum'] === 'shaker').listeners.click();
  assert.deepEqual(buzzed, [[8]]);
  assert.match(status.textContent, /Shaker\. Sound off\. Haptics on\./);

  sound.listeners.click();
  assert.equal(sound.attributes['aria-pressed'], 'true');
  assert.equal(status.textContent, 'Sound on.');
  sound.listeners.click();
  assert.equal(sound.attributes['aria-pressed'], 'false');
  assert.equal(session.soundEnabled(), false);

  const rejected = [];
  const quietDrums = ['hand'].map((id) => control(id, { 'data-drum': id }));
  const quietSound = control('sound');
  const quietHaptics = control('haptics');
  const quietStatus = { textContent: '' };
  const quietDoc = {
    getElementById: (id) => ({ sound: quietSound, haptics: quietHaptics, status: quietStatus })[id] || null,
    querySelectorAll: () => quietDrums,
    addEventListener() {},
  };
  mountCampfirePage(quietDoc, {
    matchMedia: () => ({ matches: false }),
    navigator: { userAgent: '', platform: '', maxTouchPoints: 0, vibrate() { rejected.push(1); return false; } },
  });
  quietHaptics.listeners.click();
  quietDrums[0].listeners.click();
  assert.equal(rejected.length, 1);
  assert.equal(quietHaptics.attributes['aria-pressed'], 'true');
  assert.equal(quietStatus.textContent, 'Hand drum. Sound off. Haptics on.');
});

test('discovery escapes markup and the sketch page stays off', () => {
  const html = renderDiscovery('not a url <script>');
  assert.match(html, /https:\/\/pointcast\.xyz\/api\/sensory-mcp/);
  assert.doesNotMatch(html, /<script>/);

  const page = read('src/pages/sketches/campfire-drums.astro');
  assert.equal((page.match(/aria-pressed="false"/g) || []).length, 2);
  assert.match(page, /390px/);
  assert.match(page, /prefers-reduced-motion:\s*reduce/);
  assert.match(page, /mountCampfirePage\(document, window\)/);
  assert.doesNotMatch(page, /setSound\(true\)|setHaptics\(true\)|localStorage|fetch\(/);
  for (const id of IDS) assert.match(page, new RegExp(`data-drum="${id}"`));
  assert.match(page, /aria-keyshortcuts="1 a"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /role="status"/);

  const files = [
    'src/lib/sensory/sensory-haptics.mjs',
    'src/lib/sensory/sensory-audio.mjs',
    'src/lib/mcp/sensory-mcp.mjs',
    'functions/api/sensory-mcp.ts',
    'src/pages/sketches/campfire-drums.astro',
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /loom|AUTH_DB|VISITS|D1Database|localStorage/i, file);
  }
});

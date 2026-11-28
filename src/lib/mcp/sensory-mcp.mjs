/**
 * pointcast.sensory.mcp/v1 — Sensory & Haptics tools.
 *
 * Stateless recipes for the Campfire Drum Circle. Sound and haptics are OFF
 * unless a tool argument is the boolean true. Nothing here is played on the
 * server, and nothing is stored.
 */

import { audioCatalog, createCampfireAudio, publicVoice, voiceById } from '../sensory/sensory-audio.mjs';
import {
  HAPTIC_PATTERNS,
  HAPTICS_DEFAULT,
  PLATFORMS,
  createHapticPlayer,
  describePattern,
  detectPlatform,
  mountIosTapticSwitch,
  patternById,
  vibrationFor,
  tickTimes,
} from '../sensory/sensory-haptics.mjs';

export const SPEC = 'pointcast.sensory.mcp/v1';
export const MCP_PROTOCOL_VERSION = '2025-06-18';
export const SERVER_INFO = Object.freeze({
  name: 'pointcast.sensory.mcp',
  version: '1.0.0',
});
export const SKETCH_PATH = '/sketches/campfire-drums/';
export const SKETCH_WIDTH_PX = 390;
export const SOUND_DEFAULT = false;

export const SAFETY = Object.freeze({
  spec: SPEC,
  soundDefault: SOUND_DEFAULT,
  hapticsDefault: HAPTICS_DEFAULT,
  writes: false,
  storage: 'none',
  consent: 'Only the boolean true turns sound or haptics on. A missing or false flag leaves them off. Any other type is rejected.',
  reducedMotion: 'Haptic trains collapse to one pulse of at most 12ms. The sketch does not animate the fire.',
  playback: 'This server returns a recipe. It does not play audio or vibrate a device.',
});

export const CAMPFIRE_DRUMS = Object.freeze([
  Object.freeze({ id: 'shaker', label: 'Shaker', keys: Object.freeze(['3', 'd']), keyshortcuts: '3 d', place: 'north', hint: 'Across' }),
  Object.freeze({ id: 'frame', label: 'Frame drum', keys: Object.freeze(['2', 's']), keyshortcuts: '2 s', place: 'west', hint: 'Left' }),
  Object.freeze({ id: 'ember', label: 'Ember', keys: Object.freeze(['5', 'g']), keyshortcuts: '5 g', place: 'center', hint: 'Fire' }),
  Object.freeze({ id: 'log', label: 'Log drum', keys: Object.freeze(['4', 'f']), keyshortcuts: '4 f', place: 'east', hint: 'Right' }),
  Object.freeze({ id: 'hand', label: 'Hand drum', keys: Object.freeze(['1', 'a']), keyshortcuts: '1 a', place: 'south', hint: 'You' }),
]);

const drumsById = new Map(CAMPFIRE_DRUMS.map((drum) => [drum.id, drum]));
const drumsByKey = new Map(CAMPFIRE_DRUMS.flatMap((drum) => drum.keys.map((key) => [key, drum])));

export const SENSORY_TOOL_DEFINITIONS = Object.freeze([
  Object.freeze({
    name: 'sensory_status',
    description: 'Read the Sensory & Haptics safety card for pointcast.sensory.mcp/v1. Sound is OFF and haptics are OFF by default. The server returns specs only: it does not play audio, vibrate a device, or write storage. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  Object.freeze({
    name: 'sensory_audio_catalog',
    description: 'List the five synthesized campfire drum voices (hand, frame, shaker, log, ember). Recipes only. Sound stays off. No audio files and no network. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  Object.freeze({
    name: 'sensory_haptics_catalog',
    description: 'List cross-platform haptic patterns for the campfire drums: Web Vibration, an unofficial iPhone switch tick, or a visual stand-in. Pass reducedMotion true to collapse each rhythm to one pulse of at most 12ms. Haptics stay off. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        reducedMotion: { type: 'boolean', description: 'When true, each pattern collapses to one pulse of at most 12ms.' },
      },
      additionalProperties: false,
    },
  }),
  Object.freeze({
    name: 'sensory_circle',
    description: 'Read the Campfire Drum Circle: five drums, keyboard keys, places around the fire, and the 390px sketch path. Sound and haptics on that page start off. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  Object.freeze({
    name: 'sensory_cue',
    description: 'Build one drum cue. sound and haptics default off and accept only booleans. true returns a recipe a client may play on the device a person is holding. This server does not play it. Unknown drums are errors.',
    inputSchema: {
      type: 'object',
      properties: {
        drum: { type: 'string', enum: CAMPFIRE_DRUMS.map((drum) => drum.id), description: 'Drum id: hand, frame, shaker, log, or ember.' },
        sound: { type: 'boolean', description: 'Default false. true includes the synthesized recipe.' },
        haptics: { type: 'boolean', description: 'Default false. true includes a haptic pattern.' },
        reducedMotion: { type: 'boolean', description: 'When true, the haptic pattern is one pulse of at most 12ms.' },
        platform: { type: 'string', enum: [...PLATFORMS], description: 'web-vibration, ios-taptic, visual, or none. Default web-vibration once haptics are on.' },
      },
      required: ['drum'],
      additionalProperties: false,
    },
  }),
]);

export const SENSORY_TOOL_NAMES = Object.freeze(SENSORY_TOOL_DEFINITIONS.map((tool) => tool.name));

export const SENSORY_RESOURCES = Object.freeze([
  Object.freeze({
    uri: 'sensory://manifest',
    name: 'Sensory manifest',
    description: 'Spec, version, default-off flags, and the sketch path.',
    mimeType: 'application/json',
  }),
  Object.freeze({
    uri: 'sensory://circle',
    name: 'Campfire Drum Circle',
    description: 'Five drums, keys, and the 390px layout.',
    mimeType: 'application/json',
  }),
  Object.freeze({
    uri: 'sensory://safety',
    name: 'Sensory safety',
    description: 'Default-off sound and haptics, reduced motion, and the no-write boundary.',
    mimeType: 'text/plain',
  }),
]);

const toolsByName = new Map(SENSORY_TOOL_DEFINITIONS.map((tool) => [tool.name, tool]));

export function drumById(id) {
  return drumsById.get(String(id || '')) || null;
}

export function drumByKey(key) {
  const normalized = String(key || '').toLowerCase();
  if (normalized.length !== 1) return null;
  return drumsByKey.get(normalized) || null;
}

export function circleManifest() {
  return {
    spec: SPEC,
    name: 'Campfire Drum Circle',
    widthPx: SKETCH_WIDTH_PX,
    path: SKETCH_PATH,
    url: `https://pointcast.xyz${SKETCH_PATH}`,
    sound: SOUND_DEFAULT,
    haptics: HAPTICS_DEFAULT,
    drums: CAMPFIRE_DRUMS.map((drum) => ({ ...drum, keys: [...drum.keys] })),
    note: 'Phone-first at 390px. Keys 1–5 and A S D F G. Sound and haptics start off on every visit and are not remembered.',
  };
}

function statusPayload() {
  return {
    ...SAFETY,
    protocolVersion: MCP_PROTOCOL_VERSION,
    server: SERVER_INFO,
    sketch: circleManifest(),
    platforms: [...PLATFORMS],
    tools: [...SENSORY_TOOL_NAMES],
  };
}

function hapticsPayload(reducedMotion) {
  return {
    spec: SPEC,
    haptics: HAPTICS_DEFAULT,
    reducedMotion,
    platforms: [...PLATFORMS],
    platformNotes: {
      'web-vibration': 'Android and browsers with navigator.vibrate. The pattern is a list of pulse and gap milliseconds.',
      'ios-taptic': 'iPhone Safari has no Vibration API. An unofficial hidden switch tick may click. It can stop working.',
      visual: 'Desktop and every other device. A visual pulse only, and only after haptics are turned on.',
      none: 'No haptic delivery. The drum face can still show the hit.',
    },
    patterns: HAPTIC_PATTERNS.map((pattern) => describePattern(pattern, { reducedMotion })),
  };
}

function cuePayload(args) {
  const drum = drumById(args.drum);
  const soundOn = args.sound === true;
  const hapticsOn = args.haptics === true;
  const reducedMotion = args.reducedMotion === true;
  const voice = voiceById(drum.id);
  const pattern = patternById(drum.id);
  const platform = hapticsOn ? (args.platform || 'web-vibration') : null;
  let haptics;
  if (!hapticsOn) {
    haptics = { enabled: false, reason: 'haptics-off' };
  } else if (platform === 'none') {
    haptics = { enabled: true, platform, delivered: false, reason: 'no-haptic-hardware', reducedMotion };
  } else if (platform === 'visual') {
    const seq = vibrationFor(pattern, { reducedMotion });
    haptics = { enabled: true, platform, delivered: 'visual', pattern: seq, reducedMotion };
  } else {
    const seq = vibrationFor(pattern, { reducedMotion });
    haptics = {
      enabled: true,
      platform,
      delivered: 'pattern',
      pattern: seq,
      ticks: tickTimes(seq),
      reducedMotion,
    };
  }
  return {
    spec: SPEC,
    drum: { id: drum.id, label: drum.label, keys: [...drum.keys], place: drum.place },
    sound: soundOn
      ? { enabled: true, recipe: publicVoice(voice) }
      : { enabled: false, reason: 'sound-off' },
    haptics,
    note: 'The server did not play this. A client may play it only on a device the person is holding, after these flags.',
  };
}

function proseFor(name, payload) {
  if (name === 'sensory_status') {
    return [
      `${payload.spec} · sound ${payload.soundDefault ? 'on' : 'off'} · haptics ${payload.hapticsDefault ? 'on' : 'off'}`,
      payload.consent,
      payload.playback,
      `Sketch: ${payload.sketch.url} (${payload.sketch.widthPx}px).`,
    ].join('\n');
  }
  if (name === 'sensory_audio_catalog') {
    return [
      `Sound is ${payload.sound ? 'on' : 'off'}. ${payload.note}`,
      payload.voices.map((voice) => `${voice.label} (${voice.id}): ${voice.kind}, ${voice.durationMs}ms, gain ${voice.gain}`).join('\n'),
    ].join('\n');
  }
  if (name === 'sensory_haptics_catalog') {
    return [
      `Haptics are ${payload.haptics ? 'on' : 'off'}. Reduced motion: ${payload.reducedMotion ? 'one short pulse' : 'full pattern'}.`,
      `Platforms: ${payload.platforms.join(', ')}.`,
      payload.patterns.map((pattern) => `${pattern.label} (${pattern.id}): ${pattern.vibration.join(', ')} ms`).join('\n'),
    ].join('\n');
  }
  if (name === 'sensory_circle') {
    return [
      `${payload.name} · ${payload.url} · ${payload.widthPx}px`,
      `Sound ${payload.sound ? 'on' : 'off'}. Haptics ${payload.haptics ? 'on' : 'off'}.`,
      payload.drums.map((drum) => `${drum.label} [${drum.keys.join(' ')}] ${drum.place}`).join('\n'),
      payload.note,
    ].join('\n');
  }
  const sound = payload.sound.enabled ? `sound recipe ${payload.sound.recipe.kind}` : 'sound off';
  const touch = payload.haptics.enabled
    ? `haptics ${payload.haptics.platform}${payload.haptics.pattern ? ` [${payload.haptics.pattern.join(', ')}]` : ''}`
    : 'haptics off';
  return `${payload.drum.label}. ${sound}. ${touch}. ${payload.note}`;
}

function toolResult(name, payload) {
  return {
    content: [
      { type: 'text', text: proseFor(name, payload) },
      { type: 'text', text: JSON.stringify(payload) },
    ],
  };
}

export function validateToolArgs(name, args) {
  const tool = toolsByName.get(name);
  if (!tool) return { ok: false, message: `unknown tool: ${name}` };
  if (args == null) return { ok: true, args: {} };
  if (typeof args !== 'object' || Array.isArray(args)) return { ok: false, message: 'arguments must be an object' };
  const schema = tool.inputSchema || {};
  const props = schema.properties || {};
  const extra = Object.keys(args).filter((key) => !Object.prototype.hasOwnProperty.call(props, key));
  if (schema.additionalProperties === false && extra.length) return { ok: false, message: `unknown argument: ${extra[0]}` };
  for (const key of schema.required || []) {
    if (!Object.prototype.hasOwnProperty.call(args, key) || args[key] === '') {
      return { ok: false, message: `missing argument: ${key}` };
    }
  }
  for (const [key, spec] of Object.entries(props)) {
    if (!Object.prototype.hasOwnProperty.call(args, key)) continue;
    const value = args[key];
    if (spec.type === 'boolean' && typeof value !== 'boolean') return { ok: false, message: `${key} must be a boolean` };
    if (spec.type === 'string' && typeof value !== 'string') return { ok: false, message: `${key} must be a string` };
    if (spec.enum && !spec.enum.includes(value)) return { ok: false, message: `${key} must be one of: ${spec.enum.join(', ')}` };
  }
  return { ok: true, args };
}

export function dispatchSensoryTool(name, args) {
  if (!toolsByName.has(name)) {
    return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
  }
  if (name === 'sensory_status') return toolResult(name, statusPayload());
  if (name === 'sensory_audio_catalog') return toolResult(name, audioCatalog());
  if (name === 'sensory_haptics_catalog') return toolResult(name, hapticsPayload(args.reducedMotion === true));
  if (name === 'sensory_circle') return toolResult(name, circleManifest());
  if (name === 'sensory_cue') {
    if (!drumById(args.drum) || !voiceById(args.drum) || !patternById(args.drum)) {
      return { content: [{ type: 'text', text: `Unknown drum "${args.drum}". One of: ${CAMPFIRE_DRUMS.map((drum) => drum.id).join(', ')}.` }], isError: true };
    }
    return toolResult(name, cuePayload(args));
  }
  return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
}

function resourceBody(uri) {
  if (uri === 'sensory://manifest') return { mimeType: 'application/json', text: JSON.stringify(statusPayload()) };
  if (uri === 'sensory://circle') return { mimeType: 'application/json', text: JSON.stringify(circleManifest()) };
  if (uri === 'sensory://safety') {
    return {
      mimeType: 'text/plain',
      text: [
        SAFETY.spec,
        `Sound default: ${SAFETY.soundDefault}. Haptics default: ${SAFETY.hapticsDefault}.`,
        SAFETY.consent,
        SAFETY.reducedMotion,
        SAFETY.playback,
        `Storage: ${SAFETY.storage}. Writes: ${SAFETY.writes}.`,
      ].join('\n'),
    };
  }
  return null;
}

function instructions() {
  return 'Sensory and haptics for the Campfire Drum Circle. Spec pointcast.sensory.mcp/v1. Sound is OFF and haptics are OFF unless a person sets the boolean flags to true. This server returns recipes only. It does not play audio, vibrate a device, or write storage. Sketch: https://pointcast.xyz/sketches/campfire-drums/';
}

export function handleSensoryRpc(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return { kind: 'error', id: null, code: -32600, message: 'invalid request' };
  }
  const id = message.id ?? null;
  if (message.jsonrpc !== '2.0') return { kind: 'error', id, code: -32600, message: 'invalid request' };
  const method = typeof message.method === 'string' ? message.method : '';
  if (!method) return { kind: 'error', id, code: -32600, message: 'invalid request' };
  const params = message.params == null ? {} : message.params;
  if (typeof params !== 'object' || Array.isArray(params)) {
    return { kind: 'error', id, code: -32602, message: 'invalid params' };
  }

  if (method === 'initialize') {
    return {
      kind: 'result',
      id,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
        },
        serverInfo: SERVER_INFO,
        instructions: instructions(),
      },
    };
  }
  if (method === 'notifications/initialized' || method === 'initialized') {
    if (message.id == null) return { kind: 'empty' };
    return { kind: 'result', id, result: {} };
  }
  if (method === 'ping') return { kind: 'result', id, result: {} };
  if (method === 'tools/list') return { kind: 'result', id, result: { tools: SENSORY_TOOL_DEFINITIONS } };
  if (method === 'resources/list') return { kind: 'result', id, result: { resources: SENSORY_RESOURCES } };
  if (method === 'resources/read') {
    const uri = typeof params.uri === 'string' ? params.uri : '';
    const body = resourceBody(uri);
    if (!body) return { kind: 'error', id, code: -32002, message: `resource not found: ${uri || '(missing)'}` };
    return {
      kind: 'result',
      id,
      result: { contents: [{ uri, mimeType: body.mimeType, text: body.text }] },
    };
  }
  if (method === 'tools/call') {
    const name = typeof params.name === 'string' ? params.name : '';
    if (!name) return { kind: 'error', id, code: -32602, message: 'missing tool name' };
    if (!toolsByName.has(name)) {
      return { kind: 'result', id, result: dispatchSensoryTool(name, {}) };
    }
    if (params.arguments != null && (typeof params.arguments !== 'object' || Array.isArray(params.arguments))) {
      return { kind: 'error', id, code: -32602, message: 'arguments must be an object' };
    }
    const checked = validateToolArgs(name, params.arguments || {});
    if (!checked.ok) return { kind: 'error', id, code: -32602, message: checked.message };
    return { kind: 'result', id, result: dispatchSensoryTool(name, checked.args) };
  }
  return { kind: 'error', id, code: -32601, message: `method not found: ${method}` };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

export function renderDiscovery(requestUrl = 'https://pointcast.xyz/api/sensory-mcp') {
  let endpoint = 'https://pointcast.xyz/api/sensory-mcp';
  try {
    const url = new URL(requestUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') endpoint = `${url.origin}/api/sensory-mcp`;
  } catch { /* keep the public URL */ }
  const safeEndpoint = escapeHtml(endpoint);
  const tools = SENSORY_TOOL_NAMES.map((name) => `<li><code>${name}</code></li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PointCast · Sensory MCP</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: ui-monospace, monospace; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #12110E; background: #f5f4f0; }
  h1 { font-family: Georgia, serif; font-weight: 500; font-size: 2rem; margin: 0 0 8px; }
  p.eyebrow { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #9a3412; margin: 0 0 24px; }
  pre, code { background: #fff; }
  pre { padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
  code { padding: 1px 6px; border-radius: 3px; }
  a { color: #9a3412; }
  ul { line-height: 1.7; }
</style>
</head>
<body>
<p class="eyebrow">${escapeHtml(SPEC)} · sound off · haptics off</p>
<h1>Sensory &amp; Haptics</h1>
<p>A small MCP server for the Campfire Drum Circle. It returns drum, audio, and haptic recipes. It does not play them, and it does not write storage. Sound and haptics stay off unless a tool call passes the boolean <code>true</code>.</p>
<h2>Connect</h2>
<pre>${safeEndpoint}</pre>
<p>Protocol ${escapeHtml(MCP_PROTOCOL_VERSION)}. POST speaks JSON-RPC 2.0. GET is this page.</p>
<h2>Sketch</h2>
<p>The 390px phone page is <a href="${escapeHtml(SKETCH_PATH)}">the campfire drum circle</a>. Sound and haptics on that page start off and are not remembered.</p>
<h2>Tools</h2>
<ul>${tools}</ul>
</body>
</html>`;
}

/**
 * Page session. Sound and haptics start off. A pre-enabled engine is refused
 * so a sketch cannot boot already live.
 */
export function createCampfireSession({
  audio,
  haptics,
  reducedMotion = false,
  audioOptions = {},
  hapticOptions = {},
} = {}) {
  if (typeof reducedMotion !== 'boolean') throw new TypeError('reducedMotion must be a boolean');
  const sound = audio || createCampfireAudio(audioOptions);
  const touch = haptics || createHapticPlayer({ ...hapticOptions, reducedMotion });
  if (typeof sound?.setEnabled !== 'function' || typeof sound.play !== 'function' || typeof sound.enabled !== 'function') {
    throw new TypeError('campfire sound engine is incomplete');
  }
  if (sound.enabled()) throw new Error('campfire sound must start off');
  if (typeof touch?.setEnabled !== 'function' || typeof touch.pulse !== 'function' || typeof touch.enabled !== 'function') {
    throw new TypeError('campfire haptics engine is incomplete');
  }
  if (touch.enabled()) throw new Error('campfire haptics must start off');

  function strike(id) {
    const drum = drumById(id) || drumByKey(id);
    if (!drum) return { ok: false, reason: 'unknown-drum' };
    return {
      ok: true,
      drum: drum.id,
      sound: sound.play(drum.id),
      haptics: touch.pulse(drum.id),
    };
  }

  return {
    strike,
    setSound: (value) => sound.setEnabled(value),
    setHaptics: (value) => touch.setEnabled(value),
    toggleSound: () => sound.setEnabled(!sound.enabled()),
    toggleHaptics: () => touch.setEnabled(!touch.enabled()),
    soundEnabled: () => sound.enabled(),
    hapticsEnabled: () => touch.enabled(),
    drums: CAMPFIRE_DRUMS,
    keyFor: drumByKey,
    platform: () => (typeof touch.platform === 'function' ? touch.platform() : detectPlatform(hapticOptions)),
  };
}

/**
 * Wire the sketch. Sound and haptics stay off until the person presses the
 * toggles. Nothing is read from or written to storage.
 */
export function mountCampfirePage(doc, win = globalThis) {
  const soundButton = doc?.getElementById?.('sound');
  const hapticsButton = doc?.getElementById?.('haptics');
  const status = doc?.getElementById?.('status');
  if (!soundButton || !hapticsButton || !status || typeof doc.addEventListener !== 'function') return null;

  const reducedMotion = win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const nav = win?.navigator || {};
  const canVibrate = typeof nav.vibrate === 'function';
  const ios = /iP(hone|ad|od)/.test(nav.userAgent || '')
    || (nav.platform === 'MacIntel' && Number(nav.maxTouchPoints) > 1);
  const clickSwitch = !canVibrate && ios ? mountIosTapticSwitch(doc) : null;
  const vibrate = canVibrate ? (pattern) => nav.vibrate(pattern) : undefined;
  const session = createCampfireSession({
    reducedMotion,
    hapticOptions: { vibrate, clickSwitch: clickSwitch || undefined },
  });

  function labelFor(id) {
    return session.drums.find((drum) => drum.id === id)?.label || 'Drum';
  }

  function say(id) {
    const soundLine = session.soundEnabled() ? 'Sound on.' : 'Sound off.';
    const touchLine = session.hapticsEnabled() ? 'Haptics on.' : 'Haptics off.';
    status.textContent = `${labelFor(id)}. ${soundLine} ${touchLine}`;
  }

  function hit(id) {
    const result = session.strike(id);
    if (!result.ok) {
      status.textContent = 'That drum is not in the circle.';
      return result;
    }
    for (const drum of doc.querySelectorAll('[data-drum]')) {
      const on = drum.getAttribute('data-drum') === result.drum;
      drum.classList.toggle('is-hit', on);
      if (on) drum.setAttribute('aria-current', 'true');
      else drum.removeAttribute('aria-current');
    }
    say(result.drum);
    return result;
  }

  for (const button of doc.querySelectorAll('[data-drum]')) {
    button.addEventListener('click', () => hit(button.getAttribute('data-drum')));
  }

  doc.addEventListener('keydown', (event) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const drum = session.keyFor(event.key);
    if (!drum) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    hit(drum.id);
  });

  function syncToggle(button, on) {
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    const state = button.querySelector?.('.state');
    if (state) state.textContent = on ? 'On' : 'Off';
  }

  soundButton.addEventListener('click', () => {
    syncToggle(soundButton, session.toggleSound());
    status.textContent = session.soundEnabled() ? 'Sound on.' : 'Sound off.';
  });
  hapticsButton.addEventListener('click', () => {
    syncToggle(hapticsButton, session.toggleHaptics());
    status.textContent = session.hapticsEnabled() ? 'Haptics on.' : 'Haptics off.';
  });

  return session;
}

/**
 * Synthesized campfire drums. No audio files and no network.
 *
 * Spec: pointcast.sensory.mcp/v1
 * Sound is OFF until a caller passes the boolean true. Constructing an
 * engine does not create an AudioContext. A context is opened only from
 * play() after sound has been turned on, which the sketch does from a click
 * or key gesture.
 */

export const SPEC = 'pointcast.sensory.mcp/v1';
export const SOUND_DEFAULT = false;
export const MASTER_GAIN = 0.32;
export const PEAK = 0.45;

export const AUDIO_VOICES = Object.freeze([
  Object.freeze({
    id: 'hand',
    label: 'Hand drum',
    kind: 'membrane',
    hz: 98,
    wave: 'sine',
    durationMs: 180,
    gain: 0.12,
    noiseMs: 24,
  }),
  Object.freeze({
    id: 'frame',
    label: 'Frame drum',
    kind: 'membrane',
    hz: 174,
    wave: 'sine',
    durationMs: 140,
    gain: 0.1,
    noiseMs: 16,
  }),
  Object.freeze({
    id: 'shaker',
    label: 'Shaker',
    kind: 'noise',
    hz: 0,
    wave: 'noise',
    durationMs: 90,
    gain: 0.06,
    noiseMs: 90,
  }),
  Object.freeze({
    id: 'log',
    label: 'Log drum',
    kind: 'wood',
    hz: 246,
    wave: 'square',
    durationMs: 48,
    gain: 0.05,
    noiseMs: 0,
    secondHz: 329,
    gapMs: 46,
  }),
  Object.freeze({
    id: 'ember',
    label: 'Ember',
    kind: 'crackle',
    hz: 180,
    wave: 'triangle',
    durationMs: 110,
    gain: 0.04,
    noiseMs: 110,
  }),
]);

const byId = new Map(AUDIO_VOICES.map((voice) => [voice.id, voice]));
const KINDS = new Set(['membrane', 'noise', 'wood', 'crackle']);

export function voiceProblem(voice) {
  if (!voice || typeof voice.id !== 'string' || !voice.id) return 'missing id';
  if (!KINDS.has(voice.kind)) return 'unknown kind';
  if (voice.kind !== 'noise') {
    if (!Number.isFinite(voice.hz) || voice.hz < 40 || voice.hz > 2000) return 'hz out of range';
  }
  if (voice.secondHz != null && (!Number.isFinite(voice.secondHz) || voice.secondHz < 40 || voice.secondHz > 2000)) {
    return 'second hz out of range';
  }
  if (!(voice.gain > 0) || voice.gain > 0.16) return 'gain must be above 0 and at most 0.16';
  if (!Number.isInteger(voice.durationMs) || voice.durationMs < 20 || voice.durationMs > 240) return 'duration out of range';
  if (!Number.isInteger(voice.noiseMs) || voice.noiseMs < 0 || voice.noiseMs > 240) return 'noise duration out of range';
  return '';
}

for (const voice of AUDIO_VOICES) {
  const problem = voiceProblem(voice);
  if (problem) throw new Error(`voice ${voice.id}: ${problem}`);
}

export function voiceById(id) {
  return byId.get(String(id || '')) || null;
}

export function publicVoice(voice) {
  if (!voice) return null;
  return {
    id: voice.id,
    label: voice.label,
    kind: voice.kind,
    hz: voice.hz,
    wave: voice.wave,
    durationMs: voice.durationMs,
    gain: voice.gain,
    noiseMs: voice.noiseMs,
    ...(voice.secondHz ? { secondHz: voice.secondHz, gapMs: voice.gapMs } : {}),
  };
}

export function audioCatalog() {
  return {
    spec: SPEC,
    sound: SOUND_DEFAULT,
    masterGain: MASTER_GAIN,
    peak: PEAK,
    note: 'Sound is off until a person turns it on. Recipes are synthesized in the browser. No audio files and no network.',
    voices: AUDIO_VOICES.map((voice) => publicVoice(voice)),
  };
}

function defaultCreateContext() {
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

function noiseBuffer(ctx, seconds, crackle) {
  const length = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let state = 0x13bb8187;
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    const white = state / 2147483648;
    const edge = Math.min(1, i / 48, (length - 1 - i) / 48);
    const spike = crackle && (state & 255) > 250 ? white : 0;
    data[i] = edge * (crackle ? spike * 0.8 + white * 0.08 : white);
  }
  return buffer;
}

function setAt(param, value, time) {
  if (param && typeof param.setValueAtTime === 'function') param.setValueAtTime(value, time);
  else if (param) param.value = value;
}

function envelope(ctx, level, start, duration) {
  const gain = ctx.createGain();
  const attack = Math.min(0.008, duration / 4);
  setAt(gain.gain, 0.0001, start);
  if (typeof gain.gain.linearRampToValueAtTime === 'function') {
    gain.gain.linearRampToValueAtTime(level, start + attack);
  }
  if (typeof gain.gain.exponentialRampToValueAtTime === 'function') {
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(duration, attack + 0.01));
  }
  return gain;
}

function blip(ctx, master, hz, start, duration, level, wave) {
  const osc = ctx.createOscillator();
  osc.type = wave === 'square' || wave === 'triangle' ? wave : 'sine';
  osc.frequency.value = hz;
  const gain = envelope(ctx, level, start, duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function burst(ctx, master, start, duration, level, crackle) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, duration, crackle);
  const gain = envelope(ctx, level, start, duration);
  source.connect(gain);
  gain.connect(master);
  source.start(start);
  source.stop(start + duration + 0.02);
}

function schedule(ctx, master, voice) {
  const start = Number(ctx.currentTime) || 0;
  const duration = voice.durationMs / 1000;
  if (voice.kind === 'noise') {
    burst(ctx, master, start, duration, voice.gain, false);
    return;
  }
  if (voice.kind === 'crackle') {
    burst(ctx, master, start, duration, voice.gain, true);
    blip(ctx, master, voice.hz, start, duration, voice.gain * 0.35, 'triangle');
    return;
  }
  blip(ctx, master, voice.hz, start, duration, voice.gain, voice.wave);
  if (voice.noiseMs > 0) burst(ctx, master, start, voice.noiseMs / 1000, voice.gain * 0.45, false);
  if (voice.secondHz) {
    blip(ctx, master, voice.secondHz, start + (voice.gapMs || 40) / 1000, 0.04, voice.gain, voice.wave);
  }
}

function wireMaster(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0;
  setAt(master.gain, MASTER_GAIN, Number(ctx.currentTime) || 0);
  if (typeof ctx.createWaveShaper === 'function') {
    const ceiling = ctx.createWaveShaper();
    const curve = new Float32Array(129);
    for (let i = 0; i < curve.length; i += 1) {
      curve[i] = Math.max(-PEAK, Math.min(PEAK, (i - 64) / 64));
    }
    ceiling.curve = curve;
    master.connect(ceiling);
    ceiling.connect(ctx.destination);
  } else {
    master.connect(ctx.destination);
  }
  return master;
}

export function createCampfireAudio({ createContext = defaultCreateContext } = {}) {
  let enabled = false;
  let context = null;
  let master = null;

  function ensure() {
    if (context && context.state !== 'closed') return context;
    context = createContext();
    master = null;
    if (!context) return null;
    master = wireMaster(context);
    return context;
  }

  function setEnabled(value) {
    enabled = value === true;
    if (!enabled && master?.gain) setAt(master.gain, 0, Number(context?.currentTime) || 0);
    return enabled;
  }

  function play(id) {
    const voice = voiceById(id);
    if (!voice) return { played: false, reason: 'unknown-voice' };
    if (!enabled) return { played: false, reason: 'sound-off' };
    let ctx;
    try {
      ctx = ensure();
    } catch (err) {
      return { played: false, reason: 'audio-unavailable', message: err?.message || String(err) };
    }
    if (!ctx || !master) return { played: false, reason: 'audio-unavailable' };
    try {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume();
      schedule(ctx, master, voice);
      return { played: true, voice: publicVoice(voice) };
    } catch (err) {
      return { played: false, reason: 'audio-failed', message: err?.message || String(err) };
    }
  }

  return {
    setEnabled,
    play,
    enabled: () => enabled,
    unlock() {
      if (!enabled) return false;
      try {
        return Boolean(ensure());
      } catch {
        return false;
      }
    },
  };
}

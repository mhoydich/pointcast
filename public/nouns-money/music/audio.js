/**
 * Money Maker — original procedural money percussion.
 * No samples, network requests, or audio context are created on module load.
 * Call engine.unlock() directly in a click/pointer/key handler before playback.
 */
export const MONEY_VOICES = Object.freeze([
  'coin', 'drawer', 'paper', 'counter', 'bell', 'swipe', 'shaker', 'vault',
]);

const TAU = Math.PI * 2;
const TAIL_SECONDS = 1.4;
const DURATIONS = { coin: .49, drawer: .34, paper: .24, counter: .29, bell: 1.22, swipe: .32, shaker: .31, vault: .85 };
const PAN = { coin: -.19, drawer: 0, paper: .07, counter: .2, bell: -.12, swipe: .26, shaker: -.28, vault: 0 };
const COIN_BOUNCES = [[0, 1], [.082, .49], [.139, .29], [.181, .18], [.212, .11]];
const SHAKER_HITS = [[0, .5], [.021, .9], [.047, 1], [.081, .8], [.12, .53], [.157, .28]];
const bufferCaches = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function random(seed) {
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function envelope(t, attack, decay) {
  return t < 0 ? 0 : (1 - Math.exp(-t / attack)) * Math.exp(-t / decay);
}

/** Generate one original, reproducible mono sound at the target sample rate. */
function makeVoiceBuffer(context, voice, pitch, seed) {
  if (!MONEY_VOICES.includes(voice)) throw new Error(`Unknown money voice: ${voice}`);
  let cache = bufferCaches.get(context);
  if (!cache) { cache = new Map(); bufferCaches.set(context, cache); }
  const key = `${voice}:${pitch}:${seed >>> 0}`;
  if (cache.has(key)) return cache.get(key);
  const sampleRate = context.sampleRate;
  const duration = DURATIONS[voice];
  const buffer = context.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
  const samples = buffer.getChannelData(0);
  const rng = random(seed);
  const detune = .991 + rng() * .018;
  const p = pitch * detune;
  const variation = .94 + rng() * .12;
  let lowNoise = 0;
  let previousNoise = 0;
  let phase = 0;
  let sampleSum = 0;

  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    const n = rng() * 2 - 1;
    lowNoise += .075 * (n - lowNoise);
    const crisp = n - previousNoise;
    previousNoise = n;
    let value = 0;

    if (voice === 'coin') {
      // Inharmonic modes and increasingly close rebounds make a coin on a desk.
      for (const [at, strength] of COIN_BOUNCES) {
        const d = t - at;
        if (d >= 0 && d < .28) {
          const modes = Math.sin(TAU * 1870 * p * d)
            + .53 * Math.sin(TAU * 2988 * p * d)
            + .26 * Math.sin(TAU * 4380 * p * d);
          value += strength * (.29 * modes * envelope(d, .00055, .043)
            + .13 * crisp * envelope(d, .0002, .003));
        }
      }
    } else if (voice === 'drawer') {
      // A wooden drawer/body thump, steel runner scrape, and latch click.
      const f = p * (49 + 113 * Math.exp(-t / .016));
      phase += TAU * f / sampleRate;
      value = .7 * Math.sin(phase) * envelope(t, .001, .065)
        + .17 * Math.sin(TAU * 196 * p * t) * envelope(t, .0007, .035)
        + .17 * lowNoise * envelope(t, .001, .066)
        + .10 * crisp * envelope(t - .031, .0004, .010)
        + .07 * Math.sin(TAU * 1280 * p * t) * envelope(t - .048, .0005, .012);
    } else if (voice === 'paper') {
      // A banknote snap followed by two very short, dry paper-brush gestures.
      const snap = envelope(t, .00055, .017);
      const rustle = envelope(t - .026, .008, .037)
        + .4 * envelope(t - .079, .005, .027);
      value = .33 * crisp * snap + .38 * (n - lowNoise) * rustle
        + .15 * Math.sin(TAU * 215 * p * t) * envelope(t, .001, .024);
    } else if (voice === 'counter') {
      // Six rollers passing crisp notes through a counting machine.
      for (let k = 0; k < 6; k++) {
        const d = t - k * .030;
        if (d >= 0 && d < .062) {
          value += (.87 - k * .083) * (
            .30 * crisp * envelope(d, .0004, .006)
            + .15 * Math.sin(TAU * 680 * p * d) * envelope(d, .0006, .010)
            + .075 * lowNoise * envelope(d, .001, .021));
        }
      }
    } else if (voice === 'bell') {
      // A pitched cash-register chime; pitch is a frequency ratio, not a MIDI note.
      const bellTuning = 1174.659 / 1046.5; // D6; the .75 register patch sounds A5.
      value = .39 * Math.sin(TAU * 1174.659 * p * t) * envelope(t, .001, .23)
        + .17 * Math.sin(TAU * 2119 * bellTuning * p * t) * envelope(t, .0008, .135)
        + .10 * Math.sin(TAU * 2838 * bellTuning * p * t) * envelope(t, .0007, .073)
        + .045 * crisp * envelope(t, .0003, .003);
    } else if (voice === 'swipe') {
      // A magnetic-card zipper: rising teeth plus a quick terminal chirp.
      const f = p * (730 + 4400 * Math.min(t / .21, 1));
      phase += TAU * f / sampleRate;
      const zip = envelope(t, .009, .070);
      value = .31 * (n - lowNoise) * zip * (.68 + .32 * Math.sin(phase))
        + .14 * Math.sin(phase) * zip
        + .17 * Math.sin(TAU * 2093 * p * (t - .19)) * envelope(t - .19, .002, .025);
    } else if (voice === 'shaker') {
      // A small purse of loose change, with several soft metallic collisions.
      for (const [at, strength] of SHAKER_HITS) {
        const d = t - at;
        if (d >= 0 && d < .12) {
          value += strength * (.14 * crisp * envelope(d, .0009, .011)
            + .09 * Math.sin(TAU * 3110 * p * d) * envelope(d, .0004, .021)
            + .055 * Math.sin(TAU * 4870 * p * d) * envelope(d, .0004, .013));
        }
      }
    } else if (voice === 'vault') {
      // Heavy door resonance: tuned sub, low steel modes, a closing lock.
      const vaultTuning = 36.708 / 43.65; // D1 with proportionate steel overtones.
      phase += TAU * p * (36.708 + 33 * vaultTuning * Math.exp(-t / .026)) / sampleRate;
      value = .63 * Math.sin(phase) * envelope(t, .003, .17)
        + .19 * Math.sin(TAU * 73.416 * p * t) * envelope(t, .002, .10)
        + .12 * Math.sin(TAU * 246 * vaultTuning * p * t) * envelope(t, .001, .064)
        + .13 * lowNoise * envelope(t, .001, .10)
        + .10 * crisp * envelope(t - .028, .0005, .006);
    }

    // A tiny final fade guarantees no source-end discontinuity.
    const tailFade = Math.min(1, (samples.length - 1 - i) / (sampleRate * .008));
    value *= tailFade * variation;
    samples[i] = value;
    sampleSum += value;
  }

  // Remove small numerical/DC bias with a window that remains zero at the ends.
  const mean = sampleSum / samples.length;
  for (let i = 0; i < samples.length; i++) {
    const window = Math.min(1, i / (sampleRate * .002), (samples.length - 1 - i) / (sampleRate * .008));
    samples[i] -= mean * window;
  }
  // Keep recurring sequences cheap; bounded cache also caps memory for pad play.
  if (cache.size >= 256) cache.delete(cache.keys().next().value);
  cache.set(key, buffer);
  return buffer;
}

function makeGraph(context, volume = .72, tone = .65) {
  const input = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = .42;
  filter.frequency.value = toneFrequency(tone, context.sampleRate);
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -15;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = .002;
  compressor.release.value = .12;
  const limiter = context.createWaveShaper();
  const curve = new Float32Array(8193);
  for (let i = 0; i < curve.length; i++) {
    const x = i * 2 / (curve.length - 1) - 1;
    curve[i] = .88 * Math.tanh(x / .88);
  }
  limiter.curve = curve;
  limiter.oversample = 'none';
  const master = context.createGain();
  master.gain.value = clamp(number(volume, .72), 0, 1);
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = .7;
  input.connect(filter).connect(compressor).connect(limiter).connect(master).connect(analyser).connect(context.destination);
  return { input, filter, compressor, limiter, master, analyser };
}

function toneFrequency(tone, sampleRate) {
  return Math.min(sampleRate * .44, 1600 * Math.pow(10, clamp(number(tone, .65), 0, 1)));
}

/** The one scheduling path used by both live and offline playback. */
function scheduleVoice(context, destination, voice, options = {}, onEnd = () => {}) {
  const time = Math.max(context.currentTime, number(options.time, context.currentTime));
  const pitch = clamp(number(options.pitch, 1), .5, 2);
  const velocity = clamp(number(options.velocity, .85), 0, 1);
  const source = context.createBufferSource();
  source.buffer = makeVoiceBuffer(context, voice, pitch, number(options.seed, 1));
  const gain = context.createGain();
  gain.gain.setValueAtTime(velocity * .77, time);
  const pan = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
  source.connect(gain);
  if (pan) {
    pan.pan.value = PAN[voice];
    gain.connect(pan).connect(destination);
  } else gain.connect(destination);
  const duration = source.buffer.duration;
  let ended = false;
  const handle = {
    voice, time, duration,
    get ended() { return ended; },
    stop() {
      if (ended) return;
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, .003);
      try { source.stop(now + .014); } catch { /* Source already ended. */ }
    },
  };
  source.onended = () => {
    ended = true;
    source.disconnect();
    gain.disconnect();
    if (pan) pan.disconnect();
    onEnd(handle);
  };
  source.start(time);
  source.stop(time + duration);
  return handle;
}

export class MoneyEngine {
  constructor({ volume = .72, tone = .65 } = {}) {
    this._context = null;
    this._graph = null;
    this._volume = clamp(number(volume, .72), 0, 1);
    this._tone = clamp(number(tone, .65), 0, 1);
    this._active = new Set();
    this._triggerCount = 0;
  }

  get context() { return this._context; }
  get analyser() { return this._graph?.analyser ?? null; }
  get activeVoiceCount() { return this._active.size; }
  get activeSourceCount() { return this._active.size; }
  get triggerCount() { return this._triggerCount; }
  get stats() {
    const now = this._context?.currentTime ?? 0;
    return {
      state: this._context?.state ?? 'locked',
      activeVoices: [...this._active].filter(handle => handle.time <= now).length,
      scheduledVoices: [...this._active].filter(handle => handle.time > now).length,
      activeSources: this._active.size,
      triggerCount: this._triggerCount,
      sampleRate: this._context?.sampleRate ?? null,
    };
  }

  async unlock() {
    if (!this._context || this._context.state === 'closed') {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) throw new Error('This browser does not support Web Audio.');
      this._context = new AudioContextClass({ latencyHint: 'interactive' });
      this._graph = makeGraph(this._context, this._volume, this._tone);
    }
    // resume() is invoked before the first await, preserving the user gesture.
    if (this._context.state !== 'running') await this._context.resume();
    if (this._context.state !== 'running') throw new Error('Audio is paused. Tap Play again to enable sound.');
    return this._context;
  }

  trigger(voice, options = {}) {
    if (!this._context || !this._graph) throw new Error('Call unlock() from a user gesture before playing.');
    if (this._context.state !== 'running') return null;
    this._triggerCount++;
    const handle = scheduleVoice(this._context, this._graph.input, voice, {
      ...options,
      seed: options.seed ?? (this._triggerCount * 2654435761),
    }, finished => this._active.delete(finished));
    this._active.add(handle);
    return handle;
  }

  /**
   * Warm the exact buffers used by the sequencer before its timeline starts.
   * unlock() must already have been called from a user gesture. This method
   * never schedules sources, so an abandoned prepare can safely finish.
   */
  async preparePattern({ pattern, voices = MONEY_VOICES, pitches = [] } = {}) {
    if (!this._context || this._context.state !== 'running') {
      throw new Error('Call unlock() before preparing a pattern.');
    }
    validatePattern(pattern, voices);
    const context = this._context;
    let prepared = 0;
    let batchStarted = performance.now();
    for (let row = 0; row < 8; row++) {
      const pitch = clamp(number(pitches[row], 1), .5, 2);
      for (let step = 0; step < 16; step++) {
        if (!pattern[row][step]) continue;
        const seed = ((row + 1) * 73856093) ^ ((step + 1) * 19349663);
        makeVoiceBuffer(context, voices[row], pitch, seed);
        prepared++;
        if (performance.now() - batchStarted >= 12) {
          await new Promise(resolve => setTimeout(resolve, 0));
          batchStarted = performance.now();
        }
      }
    }
    return prepared;
  }

  setVolume(value) {
    this._volume = clamp(number(value, this._volume), 0, 1);
    if (this._graph) this._graph.master.gain.setTargetAtTime(this._volume, this._context.currentTime, .015);
  }

  setTone(value) {
    this._tone = clamp(number(value, this._tone), 0, 1);
    if (this._graph) this._graph.filter.frequency.setTargetAtTime(toneFrequency(this._tone, this._context.sampleRate), this._context.currentTime, .02);
  }

  stopAll() {
    for (const handle of this._active) handle.stop();
    this._active.clear();
  }

  stopVoice(voice) {
    let stopped = 0;
    for (const handle of this._active) {
      if (handle.voice !== voice) continue;
      handle.stop();
      this._active.delete(handle);
      stopped++;
    }
    return stopped;
  }
}

function validatePattern(pattern, voices) {
  if (!Array.isArray(pattern) || pattern.length !== 8 || pattern.some(row => !Array.isArray(row) || row.length !== 16)) {
    throw new Error('Pattern must contain eight rows of sixteen steps.');
  }
  if (!Array.isArray(voices) || voices.length !== 8 || voices.some(voice => !MONEY_VOICES.includes(voice))) {
    throw new Error('Choose eight supported money voices.');
  }
}

/**
 * swing is 0..0.45 (delay on odd sixteenths, as a fraction of a step).
 * pitches are frequency ratios (1 = original, 2 = octave above).
 * Every bar has 16 steps / four quarter-note beats, plus a 1.4 second tail.
 */
export async function renderPatternBuffer({
  pattern, voices = MONEY_VOICES, pitches = [], tempo = 112, swing = 0,
  volume = .72, tone = .65, bars = 4, sampleRate = 44100,
} = {}) {
  validatePattern(pattern, voices);
  tempo = clamp(number(tempo, 112), 40, 240);
  swing = clamp(number(swing, 0), 0, .45);
  bars = clamp(Math.round(number(bars, 4)), 1, 16);
  sampleRate = clamp(Math.round(number(sampleRate, 44100)), 22050, 96000);
  const stepSeconds = 60 / tempo / 4;
  const duration = bars * 16 * stepSeconds + TAIL_SECONDS;
  const OfflineContextClass = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OfflineContextClass) throw new Error('This browser does not support WAV rendering.');
  const context = new OfflineContextClass(2, Math.ceil(duration * sampleRate), sampleRate);
  const graph = makeGraph(context, volume, tone);
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < 16; step++) {
      const time = (bar * 16 + step + (step % 2 ? swing : 0)) * stepSeconds;
      for (let row = 0; row < 8; row++) {
        if (!pattern[row][step]) continue;
        scheduleVoice(context, graph.input, voices[row], {
          time, pitch: pitches[row] ?? 1,
          velocity: step % 4 === 0 ? .95 : .8,
          seed: ((row + 1) * 73856093) ^ ((step + 1) * 19349663),
        });
      }
    }
  }
  return new Promise((resolve, reject) => {
    // Event fallback supports older WebKit implementations without a promise.
    context.oncomplete = event => resolve(event.renderedBuffer);
    try {
      const rendering = context.startRendering();
      if (rendering && typeof rendering.then === 'function') rendering.then(resolve, reject);
    } catch (error) { reject(error); }
  });
}

export function bufferToWav(buffer) {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = new ArrayBuffer(44 + frames * channels * 2);
  const view = new DataView(bytes);
  const text = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = clamp(channelData[channel][frame], -1, 1);
      view.setInt16(offset, sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767), true);
      offset += 2;
    }
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

export async function renderPatternWav(options = {}) {
  return bufferToWav(await renderPatternBuffer(options));
}

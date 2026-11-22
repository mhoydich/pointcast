// Loom Kit v0. Optional synthesized feedback, with no network or media files.
export const SOUND_NAMES = Object.freeze([
  'tap', 'send', 'receive', 'yes', 'undo', 'error', 'stack-cleared', 'fire-bed',
]);
const SCALE = [0, 2, 4, 7, 9]; // C major pentatonic, movable by octave.
const MIDI_A4 = 69;
const ROOT = 60;
const SOUND_KEY = 'loom-kit:sound';
const BED_KEY = 'loom-kit:fire-bed';
const MASTER_LEVEL = 0.37;
const PEAK = 0.49; // Final hard ceiling, below -6 dBFS even with overlapping cues.
const MAX_TRANSIENTS = 3;
const soundNames = new Set(SOUND_NAMES.slice(0, -1));

export function pentatonicHz(step, octave = 0) {
  const index = ((step % SCALE.length) + SCALE.length) % SCALE.length;
  const midi = ROOT + (octave + Math.floor(step / SCALE.length)) * 12 + SCALE[index];
  return 440 * 2 ** ((midi - MIDI_A4) / 12);
}

function getStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function createLoomSound({
  storage = getStorage(),
  createContext = () => {
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    return Audio ? new Audio() : null;
  },
  now = () => globalThis.performance.now(),
  random = Math.random,
  page = globalThis.document,
} = {}) {
  const read = key => {
    try { return storage?.getItem(key) === '1'; } catch { return false; }
  };
  const save = (key, state) => {
    try { storage?.setItem(key, state ? '1' : '0'); } catch {}
  };
  let enabled = read(SOUND_KEY);
  let fireBed = read(BED_KEY);
  let context, unlockPromise, master, bed;
  let disposed = false;
  let lastAction = -Infinity, degree = 0;
  const transients = new Set();
  const lastPlayed = new Map();

  function envelope(out, start, duration, level, attack = 0.006) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.00001, start + duration);
    gain.connect(out);
    return gain;
  }

  function voice(group, create, start, duration, level, shape, attack) {
    const source = create();
    const gain = envelope(group.out, start, duration, level, attack);
    let tail = gain;
    if (shape) {
      const filter = context.createBiquadFilter();
      filter.type = shape[0];
      filter.frequency.value = shape[1];
      filter.Q.value = shape[2] ?? 0.7;
      source.connect(filter);
      filter.connect(gain);
      tail = filter;
    } else source.connect(gain);
    group.sources.add(source);
    source.onended = () => {
      source.disconnect();
      if (tail !== gain) tail.disconnect();
      gain.disconnect();
      group.sources.delete(source);
      if (!group.sources.size) {
        group.out.disconnect();
        transients.delete(group);
      }
    };
    source.start(start);
    source.stop(start + duration);
  }

  function noiseBuffer(seconds, crackle = false) {
    const count = Math.ceil(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, count, context.sampleRate);
    const data = buffer.getChannelData(0);
    let state = 0x13bb8187;
    let low = 0, ember = 0;
    for (let i = 0; i < count; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) | 0;
      const white = state / 2147483648;
      if (!crackle) { data[i] = white; continue; }
      low = 0.93 * low + 0.07 * white;
      if (Math.abs(white) > 0.9998) ember = 0.65;
      ember *= 0.992;
      const edge = Math.min(1, i / 480, (count - 1 - i) / 480);
      data[i] = edge * (0.28 * low + ember * white);
    }
    return buffer;
  }

  function stopBed() {
    if (!bed) return;
    const { source, gain } = bed;
    bed = undefined;
    const t = context.currentTime;
    gain.gain.setTargetAtTime(0, t, 0.025);
    source.stop(t + 0.12);
  }

  function syncBed() {
    if (!enabled || !fireBed || disposed || page?.hidden || context?.state !== 'running') {
      stopBed();
      return;
    }
    if (bed) return;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(2.4, true);
    source.loop = true;
    const gain = context.createGain();
    const t = context.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.024, t + 0.16);
    source.connect(gain);
    gain.connect(master);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
    bed = { source, gain };
  }

  function syncMaster() {
    if (master) master.gain.setTargetAtTime(
      enabled && !page?.hidden && !disposed ? MASTER_LEVEL : 0, context.currentTime, 0.008,
    );
    syncBed();
  }

  // Call directly in a trusted pointer/key gesture. Merely constructing the kit
  // never creates a context; saved consent is not browser autoplay permission.
  function unlock() {
    if (!enabled || disposed || page?.hidden) return Promise.resolve(false);
    if (unlockPromise) return unlockPromise;
    try {
      if (!context || context.state === 'closed') {
        context = createContext();
        if (!context) return Promise.resolve(false);
        master = context.createGain();
        master.gain.value = 0;
        const ceiling = context.createWaveShaper();
        ceiling.curve = Float32Array.from({ length: 129 }, (_, i) =>
          Math.max(-PEAK, Math.min(PEAK, (i - 64) / 64)),
        );
        master.connect(ceiling);
        ceiling.connect(context.destination);
      }
      // resume() must be invoked synchronously while transient activation is present.
      const resume = context.state === 'running' ? undefined : context.resume();
      unlockPromise = Promise.resolve(resume).then(() => {
        syncMaster();
        return enabled && !disposed && context.state === 'running';
      }).catch(() => false).finally(() => { unlockPromise = undefined; });
      return unlockPromise;
    } catch { return Promise.resolve(false); }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    save(SOUND_KEY, enabled);
    syncMaster();
    return enabled ? unlock() : Promise.resolve(false);
  }

  function setFireBed(value) {
    fireBed = Boolean(value);
    save(BED_KEY, fireBed);
    syncBed();
    return fireBed && enabled ? unlock() : Promise.resolve(false);
  }

  // Deliberately no queue: don't play the touch that happened while locked,
  // and don't pile sounds up behind fast input or a suspended tab.
  function play(name) {
    if (!soundNames.has(name) || !enabled || disposed || page?.hidden ||
      context?.state !== 'running' || transients.size >= MAX_TRANSIENTS) return false;
    const tick = now();
    if (tick - (lastPlayed.get(name) ?? -Infinity) < 60) return false;
    degree = tick - lastAction >= 2000 ? 0 : Math.min(degree + 1, 9);
    lastAction = tick;
    lastPlayed.set(name, tick);

    const t = context.currentTime + 0.004;
    const group = { out: context.createGain(), sources: new Set() };
    const variation = 10 ** ((random() * 4 - 2) / 20);
    const pitch = 1 + (random() * 0.06 - 0.03);
    group.out.gain.value = variation;
    group.out.connect(master);
    transients.add(group);
    const tone = (step, octave, offset, duration, volume, type = 'sine') =>
      voice(group, () => {
        const osc = context.createOscillator();
        osc.type = type;
        osc.frequency.value = pentatonicHz(degree + step, octave) * pitch;
        return osc;
      }, t + offset, duration, volume);
    const noise = (offset, duration, volume, ...filter) =>
      voice(group, () => {
        const source = context.createBufferSource();
        source.buffer = noiseBuffer(duration);
        return source;
      }, t + offset, duration, volume, filter, 0.003);

    switch (name) {
      case 'tap':
        noise(0, 0.055, 0.1, 'bandpass', 780, 0.9);
        tone(0, -1, 0, 0.069, 0.06, 'triangle');
        break;
      case 'send':
      case 'undo': {
        const [a, b] = name === 'send' ? [0, 2] : [2, 0];
        tone(a, 0, 0, 0.113, 0.111, 'triangle');
        tone(b, 0, 0.074, 0.122, 0.106);
        break;
      }
      case 'receive':
        tone(2, 0, 0, 0.164, 0.105);
        break;
      case 'yes':
        tone(0, 0, 0, 0.187, 0.103, 'triangle');
        tone(2, 0, 0.013, 0.186, 0.075);
        tone(4, 0, 0.033, 0.202, 0.069);
        break;
      case 'error':
        tone(0, -3, 0, 0.143, 0.124);
        noise(0, 0.074, 0.075, 'lowpass', 360);
        break;
      case 'stack-cleared':
        noise(0, 0.068, 0.073, 'highpass', 1650);
        for (let i = 0; i < 5; i++) tone(i, 1, i * 0.027, 0.129, 0.069);
        break;
    }
    return true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    page?.removeEventListener('visibilitychange', syncMaster);
    syncMaster();
    context?.close()?.catch(() => {});
  }

  page?.addEventListener('visibilitychange', syncMaster);
  return {
    get enabled() { return enabled; },
    get fireBed() { return fireBed; },
    unlock, setEnabled, setFireBed, play, dispose,
  };
}

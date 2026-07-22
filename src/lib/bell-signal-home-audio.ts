/**
 * Bell & Signal — Catalog No. 2 audio engine.
 *
 * No files are loaded. Each strike is synthesized in the browser from
 * oscillators and newly generated pink noise. Bells use stretched partials
 * and a short generated room; utility signals stay dry.
 */

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type Voice = {
  gain: GainNode;
  endsAt: number;
};

let context: AudioContext | null = null;
let master: GainNode | null = null;
let wetBus: GainNode | null = null;
let voices: Voice[] = [];

function ensureAudio() {
  if (!context) {
    const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.');

    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.56;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;
    master.connect(compressor);
    compressor.connect(context.destination);

    const room = context.createConvolver();
    room.buffer = makeRoom(context, 2.7);
    wetBus = context.createGain();
    wetBus.gain.value = 0.38;
    wetBus.connect(room);
    room.connect(master);
  }

  if (context.state === 'suspended') void context.resume();
  return context;
}

function makeRoom(ctx: AudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    let pink = 0;
    for (let i = 0; i < length; i += 1) {
      const position = i / length;
      const white = Math.random() * 2 - 1;
      pink = 0.985 * pink + 0.015 * white;
      data[i] = pink * 5.8 * Math.pow(1 - position, 2.35);
    }
  }
  return impulse;
}

function pinkBuffer(ctx: AudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
    b6 = white * 0.115926;
  }
  return buffer;
}

function beginVoice(ctx: AudioContext, wet = false) {
  const now = ctx.currentTime;
  voices = voices.filter((voice) => voice.endsAt > now);

  // Foundry Law VII: cues do not pile up. A fresh strike politely fades any
  // prior homepage casting instead of building an uncontrolled loud stack.
  for (const voice of voices) {
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.018);
  }

  const gain = ctx.createGain();
  gain.gain.value = 1;
  gain.connect(master!);
  if (wet) {
    const send = ctx.createGain();
    send.gain.value = 0.82;
    gain.connect(send);
    send.connect(wetBus!);
  }
  voices = [{ gain, endsAt: now + 8 }];
  return gain;
}

function envelope(gain: AudioParam, when: number, peak: number, attack: number, release: number) {
  gain.setValueAtTime(0.0001, when);
  gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
  gain.exponentialRampToValueAtTime(0.0001, when + release);
}

function oscillator(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  when: number,
  duration: number,
  peak: number,
  type: OscillatorType = 'sine',
  attack = 0.006,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);
  envelope(gain.gain, when, peak, attack, duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(when);
  osc.stop(when + duration + 0.08);
  return osc;
}

function bell(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  when: number,
  duration: number,
  brightness = 1,
  glass = false,
) {
  const partials: Array<[number, number, number]> = glass
    ? [[1, 1, 1], [2.04, 0.42, 0.66], [3.11, 0.2, 0.43], [4.23, 0.12, 0.31], [6.08, 0.06, 0.22]]
    : [[0.5, 0.44, 1.05], [1, 1, 1], [1.19, 0.58, 0.76], [1.51, 0.28, 0.58], [2.03, 0.38, 0.42], [2.71, 0.15, 0.3]];

  partials.forEach(([ratio, amplitude, decay], index) => {
    const partialGain = ctx.createGain();
    const end = duration * decay;
    envelope(partialGain.gain, when, amplitude * 0.13 * brightness, 0.003 + index * 0.0015, end);
    partialGain.connect(destination);
    const stretch = 0.00115 + index * 0.00016;
    oscillator(ctx, partialGain, frequency * ratio * (1 - stretch), when, end, 0.5);
    oscillator(ctx, partialGain, frequency * ratio * (1 + stretch), when, end, 0.5);
  });
}

function notes(
  ctx: AudioContext,
  destination: AudioNode,
  sequence: number[],
  when: number,
  step: number,
  duration: number,
  peak = 0.105,
  type: OscillatorType = 'sine',
) {
  sequence.forEach((frequency, index) => {
    oscillator(ctx, destination, frequency, when + index * step, duration, peak, type, 0.004);
    oscillator(ctx, destination, frequency * 2.01, when + index * step, duration * 0.62, peak * 0.2, 'sine', 0.006);
  });
}

function noiseGesture(
  ctx: AudioContext,
  destination: AudioNode,
  when: number,
  duration: number,
  peak: number,
  low: number,
  high: number,
  wet = false,
) {
  const source = ctx.createBufferSource();
  source.buffer = pinkBuffer(ctx, duration + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(low, when);
  filter.frequency.exponentialRampToValueAtTime(high, when + duration * 0.55);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, low * 0.8), when + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + Math.min(0.18, duration * 0.3));
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  if (wet) gain.connect(wetBus!);
  source.start(when);
  source.stop(when + duration + 0.05);
}

function stamp(ctx: AudioContext, destination: AudioNode, when: number) {
  noiseGesture(ctx, destination, when, 0.17, 0.14, 160, 1900);
  const thud = ctx.createOscillator();
  const gain = ctx.createGain();
  thud.type = 'triangle';
  thud.frequency.setValueAtTime(116, when);
  thud.frequency.exponentialRampToValueAtTime(48, when + 0.16);
  envelope(gain.gain, when, 0.12, 0.002, 0.18);
  thud.connect(gain);
  gain.connect(destination);
  thud.start(when);
  thud.stop(when + 0.2);
}

export function playHomeCasting(id: string) {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.015;
  const wet = ['BEL-05', 'BRE-03', 'BLM-03', 'BEL-06', 'BEL-07', 'BLM-04', 'SIG-10', 'DRN-02', 'RIT-03'].includes(id);
  const voice = beginVoice(ctx, wet);

  switch (id) {
    case 'BEL-05':
      bell(ctx, voice, 587.33, now, 2.4, 0.92);
      break;
    case 'SIG-05':
      notes(ctx, voice, [587.33, 739.99, 880], now, 0.18, 0.28, 0.085, 'triangle');
      break;
    case 'SIG-06':
      stamp(ctx, voice, now);
      oscillator(ctx, voice, 1174.66, now + 0.12, 0.16, 0.045, 'sine', 0.002);
      break;
    case 'BRE-03':
      noiseGesture(ctx, voice, now, 2.35, 0.09, 140, 1300, true);
      oscillator(ctx, voice, 146.83, now + 0.18, 2.1, 0.026, 'sine', 0.3);
      break;
    case 'BLM-03':
      notes(ctx, voice, [293.66, 369.99, 440, 587.33], now, 0.19, 1.3, 0.055);
      oscillator(ctx, voice, 1760, now + 0.64, 1.15, 0.025, 'sine', 0.02);
      break;
    case 'SIG-07':
      noiseGesture(ctx, voice, now, 0.38, 0.075, 420, 3100);
      oscillator(ctx, voice, 1318.51, now + 0.25, 0.19, 0.035, 'sine', 0.002);
      break;
    case 'SIG-08':
      notes(ctx, voice, [440, 659.25], now, 0.23, 0.34, 0.09, 'sine');
      break;
    case 'BEL-06':
      bell(ctx, voice, 220, now, 3.7, 1.02);
      oscillator(ctx, voice, 110, now, 3.5, 0.035, 'sine', 0.02);
      break;
    case 'SIG-09':
      notes(ctx, voice, [659.25, 523.25], now, 0.24, 0.42, 0.075, 'triangle');
      break;
    case 'BEL-07':
      bell(ctx, voice, 698.46, now, 2.55, 0.72, true);
      break;
    case 'BLM-04':
      notes(ctx, voice, [369.99, 440, 587.33, 739.99], now, 0.13, 0.94, 0.047);
      break;
    case 'SIG-10':
      bell(ctx, voice, 440, now, 2.1, 0.45, true);
      break;
    case 'TIK-02':
      stamp(ctx, voice, now);
      stamp(ctx, voice, now + 0.46);
      oscillator(ctx, voice, 1760, now, 0.08, 0.024, 'square', 0.001);
      oscillator(ctx, voice, 1320, now + 0.46, 0.08, 0.022, 'square', 0.001);
      break;
    case 'DRN-02':
      oscillator(ctx, voice, 73.42, now, 3, 0.052, 'sine', 0.48);
      oscillator(ctx, voice, 110, now + 0.08, 2.8, 0.034, 'sine', 0.42);
      noiseGesture(ctx, voice, now, 2.85, 0.025, 90, 380, true);
      break;
    case 'RIT-03':
      bell(ctx, voice, 293.66, now, 2.4, 0.72);
      bell(ctx, voice, 369.99, now + 0.82, 2.4, 0.64);
      bell(ctx, voice, 440, now + 1.64, 2.65, 0.58);
      break;
    default:
      throw new Error(`Unknown Bell & Signal casting: ${id}`);
  }

  const matchingDuration = id === 'RIT-03' ? 4.6 : id === 'BEL-06' ? 3.9 : id === 'DRN-02' ? 3.2 : 2.8;
  voices[0].endsAt = now + matchingDuration;
}

export function quietHomeCastings() {
  if (!context) return;
  const now = context.currentTime;
  for (const voice of voices) {
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.02);
  }
  voices = [];
}


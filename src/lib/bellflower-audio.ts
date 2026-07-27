type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export type BellflowerSound = {
  id: string;
  baseHz: number;
  partials: number[];
  sequence: number[];
  decay: number;
  attack: number;
  brightness: number;
  noise: number;
  wet: number;
};

export type BellflowerGesture = {
  x: number;
  y: number;
  variation: number;
};

type ActiveVoice = {
  gain: GainNode;
  endsAt: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function createBellflowerAudio() {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let roomSend: GainNode | null = null;
  let muted = false;
  let voices: ActiveVoice[] = [];

  function makeRoom(ctx: AudioContext, seconds = 3.6) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      let pink = 0;
      for (let index = 0; index < length; index += 1) {
        const white = Math.random() * 2 - 1;
        pink = pink * 0.982 + white * 0.018;
        const envelope = Math.pow(1 - index / length, 2.65);
        data[index] = pink * 4.2 * envelope;
      }
    }
    return impulse;
  }

  function makePinkNoise(ctx: AudioContext, seconds: number) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      data[index] = (b0 + b1 + b2 + b3 + white * 0.1848) * 0.08;
    }
    return buffer;
  }

  async function ensureAudio() {
    if (!context) {
      const AudioContextClass =
        window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return null;

      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.38;

      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -24;
      limiter.knee.value = 12;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.32;
      master.connect(limiter);
      limiter.connect(context.destination);

      const room = context.createConvolver();
      room.buffer = makeRoom(context);
      roomSend = context.createGain();
      roomSend.gain.value = 0.38;
      roomSend.connect(room);
      room.connect(master);
    }

    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {}
    }
    return context;
  }

  function quietPriorVoices(ctx: AudioContext) {
    const now = ctx.currentTime;
    voices = voices.filter((voice) => voice.endsAt > now);
    for (const voice of voices) {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0.0001, now, 0.035);
    }
    voices = [];
  }

  function envelope(
    param: AudioParam,
    when: number,
    peak: number,
    attack: number,
    release: number,
  ) {
    param.setValueAtTime(0.0001, when);
    param.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
    param.exponentialRampToValueAtTime(0.0001, when + Math.max(attack + 0.02, release));
  }

  function playNoise(
    ctx: AudioContext,
    destination: AudioNode,
    sound: BellflowerSound,
    when: number,
    warmth: number,
  ) {
    if (sound.noise <= 0) return;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const duration = Math.min(1.8, Math.max(0.34, sound.decay * 0.28));
    source.buffer = makePinkNoise(ctx, duration);
    filter.type = 'bandpass';
    filter.frequency.value = 280 + warmth * 1600;
    filter.Q.value = 0.7;
    envelope(gain.gain, when, sound.noise, 0.02, duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(when);
    source.stop(when + duration + 0.05);
  }

  function playTone(
    ctx: AudioContext,
    destination: AudioNode,
    sound: BellflowerSound,
    frequency: number,
    when: number,
    gesture: BellflowerGesture,
  ) {
    const brightness = clamp(sound.brightness * (0.72 + (1 - gesture.y) * 0.5));
    sound.partials.forEach((ratio, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const partialDecay = sound.decay * Math.max(0.22, 1 - index * 0.105);
      const rolloff = Math.pow(index + 1, 0.88);
      const peak = Math.min(0.105, (0.115 * brightness) / rolloff);
      oscillator.type = index < 2 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency * ratio, when);
      oscillator.detune.setValueAtTime((gesture.x - 0.5) * 12 + index * 0.42, when);
      envelope(
        gain.gain,
        when,
        peak,
        sound.attack + index * 0.0015,
        partialDecay,
      );
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start(when);
      oscillator.stop(when + partialDecay + 0.08);
    });
  }

  async function play(sound: BellflowerSound, gesture: BellflowerGesture) {
    const ctx = await ensureAudio();
    if (!ctx) return { supported: false, state: 'unavailable' as const };
    quietPriorVoices(ctx);

    const now = ctx.currentTime + 0.015;
    const voice = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const normalizedGesture = {
      x: clamp(gesture.x),
      y: clamp(gesture.y),
      variation: Math.max(0, gesture.variation || 0),
    };

    voice.gain.value = 1;
    filter.type = 'lowpass';
    filter.frequency.value = 1800 + (1 - normalizedGesture.y) * 5600;
    filter.Q.value = 0.55 + normalizedGesture.variation * 0.06;
    panner.pan.value = (normalizedGesture.x - 0.5) * 1.2;
    dry.gain.value = Math.max(0.34, 1 - sound.wet * 0.55);
    wet.gain.value = clamp(sound.wet);

    voice.connect(filter);
    filter.connect(panner);
    panner.connect(dry);
    panner.connect(wet);
    dry.connect(master!);
    wet.connect(roomSend!);

    const step = 0.16 + Math.min(0.13, normalizedGesture.variation * 0.012);
    sound.sequence.forEach((ratio, index) => {
      playTone(
        ctx,
        voice,
        sound,
        sound.baseHz * ratio,
        now + index * step,
        normalizedGesture,
      );
    });
    playNoise(ctx, voice, sound, now, 1 - normalizedGesture.y);

    const duration = sound.decay + sound.sequence.length * step + 0.2;
    voices.push({ gain: voice, endsAt: now + duration });
    return { supported: true, state: muted ? ('muted' as const) : ('sounding' as const) };
  }

  async function setMuted(nextMuted: boolean) {
    muted = nextMuted;
    const ctx = await ensureAudio();
    if (ctx && master) {
      master.gain.setTargetAtTime(muted ? 0 : 0.38, ctx.currentTime, 0.025);
    }
    return muted;
  }

  function quiet() {
    if (!context) return;
    quietPriorVoices(context);
  }

  function getState() {
    if (!context) return 'locked';
    if (muted) return 'muted';
    return context.state;
  }

  return {
    play,
    setMuted,
    quiet,
    getState,
    isSupported: () =>
      Boolean(window.AudioContext || (window as AudioWindow).webkitAudioContext),
  };
}

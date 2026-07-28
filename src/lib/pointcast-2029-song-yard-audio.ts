import { SONG_YARD_PROGRAMS } from './pointcast-college-football-magazine';
import {
  SONG_YARD_PARTS,
  SONG_YARD_SEEDS,
  type SongYardMode,
  type SongYardPartId,
  type SongYardSeed,
} from './pointcast-2029-song-yard';

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type TransportMode = 'part' | 'bowl';

const SCALE_STEPS: Record<SongYardMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

const PART_PANS: Record<SongYardPartId, number> = {
  call: -0.72,
  answer: 0.72,
  floor: -0.12,
  hands: 0.28,
};

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

function degreeToSemitones(degree: number, mode: SongYardMode) {
  const scale = SCALE_STEPS[mode];
  const length = scale.length;
  const octave = Math.floor(degree / length);
  const index = ((degree % length) + length) % length;
  return scale[index] + octave * 12;
}

function midiToHz(midi: number) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function midiLabel(midi: number) {
  const rounded = Math.round(midi);
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}

function createDeterministicNoise(context: AudioContext, seconds: number, seed = 2029) {
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * seconds)), context.sampleRate);
  const channel = buffer.getChannelData(0);
  let value = seed >>> 0;
  for (let index = 0; index < channel.length; index += 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    channel[index] = ((value / 0xffffffff) * 2) - 1;
  }
  return buffer;
}

function autoCorrelate(buffer: Float32Array, sampleRate: number) {
  let energy = 0;
  for (const sample of buffer) energy += sample * sample;
  const rms = Math.sqrt(energy / buffer.length);
  if (rms < 0.018) return null;

  const minLag = Math.floor(sampleRate / 900);
  const maxLag = Math.min(Math.floor(sampleRate / 70), buffer.length - 1);
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let index = 0; index < buffer.length - lag; index += 1) {
      correlation += buffer[index] * buffer[index + lag];
    }
    correlation /= buffer.length - lag;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorrelation < 0.01) return null;
  return sampleRate / bestLag;
}

export function mountSongYard(root: HTMLElement) {
  if (root.dataset.songYardReady === 'true') return () => {};
  root.dataset.songYardReady = 'true';

  const identitySelect = root.querySelector<HTMLSelectElement>('[data-identity-select]');
  const seedButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-seed-id]'));
  const partButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-practice-part]'));
  const beatCells = Array.from(root.querySelectorAll<HTMLElement>('[data-beat-step]'));
  const sectionCells = Array.from(root.querySelectorAll<HTMLElement>('[data-bowl-section]'));
  const bpmInput = root.querySelector<HTMLInputElement>('[data-bpm]');
  const bpmOutput = root.querySelector<HTMLOutputElement>('[data-bpm-output]');
  const keyInput = root.querySelector<HTMLInputElement>('[data-key]');
  const keyOutput = root.querySelector<HTMLOutputElement>('[data-key-output]');
  const loopInput = root.querySelector<HTMLInputElement>('[data-loop]');
  const transportStatus = root.querySelector<HTMLElement>('[data-transport-status]');
  const startPartButton = root.querySelector<HTMLButtonElement>('[data-play-part]');
  const startBowlButton = root.querySelector<HTMLButtonElement>('[data-play-bowl]');
  const stopButton = root.querySelector<HTMLButtonElement>('[data-stop]');
  const songTitle = root.querySelector<HTMLElement>('[data-song-title]');
  const songKicker = root.querySelector<HTMLElement>('[data-song-kicker]');
  const songCall = root.querySelector<HTMLElement>('[data-song-call]');
  const songAnswer = root.querySelector<HTMLElement>('[data-song-answer]');
  const songNote = root.querySelector<HTMLElement>('[data-song-note]');
  const partTitle = root.querySelector<HTMLElement>('[data-part-title]');
  const partInstruction = root.querySelector<HTMLElement>('[data-part-instruction]');
  const mark = root.querySelector<SVGSVGElement>('[data-identity-mark]');
  const identityName = root.querySelector<HTMLElement>('[data-identity-name]');
  const identityMarkName = root.querySelector<HTMLElement>('[data-identity-mark-name]');
  const micButton = root.querySelector<HTMLButtonElement>('[data-mic-toggle]');
  const micStatus = root.querySelector<HTMLElement>('[data-mic-status]');
  const pitchNote = root.querySelector<HTMLElement>('[data-pitch-note]');
  const pitchMeter = root.querySelector<HTMLElement>('[data-pitch-meter]');
  const targetNote = root.querySelector<HTMLElement>('[data-target-note]');

  let seed: SongYardSeed = SONG_YARD_SEEDS[0];
  let selectedPart: SongYardPartId = 'call';
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let dry: GainNode | null = null;
  let wet: GainNode | null = null;
  let reverb: ConvolverNode | null = null;
  let clapBuffer: AudioBuffer | null = null;
  let playing = false;
  let transportMode: TransportMode = 'part';
  let roundTimer: number | null = null;
  const visualTimers = new Set<number>();
  const activeSources = new Set<AudioScheduledSourceNode>();
  let micStream: MediaStream | null = null;
  let micContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let pitchFrame: number | null = null;
  let pitchSamples: Float32Array | null = null;

  const status = (message: string) => {
    if (transportStatus) transportStatus.textContent = message;
  };

  const clearVisualState = () => {
    beatCells.forEach((cell) => cell.removeAttribute('data-active'));
    sectionCells.forEach((cell) => cell.removeAttribute('data-active'));
    partButtons.forEach((button) => button.removeAttribute('data-sounding'));
  };

  const stopTransport = (message = 'The yard is quiet. Choose a part or open the whole bowl.') => {
    playing = false;
    if (roundTimer !== null) window.clearTimeout(roundTimer);
    roundTimer = null;
    visualTimers.forEach((timer) => window.clearTimeout(timer));
    visualTimers.clear();
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // A source that already ended is safe to ignore.
      }
    });
    activeSources.clear();
    clearVisualState();
    startPartButton?.removeAttribute('aria-pressed');
    startBowlButton?.removeAttribute('aria-pressed');
    status(message);
  };

  const ensureContext = () => {
    if (context && master && dry && wet && reverb && clapBuffer) return context;
    const ContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!ContextClass) throw new Error('Web Audio is not available in this browser.');

    context = new ContextClass();
    master = context.createGain();
    master.gain.value = 0.56;
    dry = context.createGain();
    dry.gain.value = 0.86;
    wet = context.createGain();
    wet.gain.value = 0.25;
    reverb = context.createConvolver();
    reverb.buffer = createDeterministicNoise(context, 1.65, 20290728);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.24;

    dry.connect(master);
    reverb.connect(wet);
    wet.connect(master);
    master.connect(compressor);
    compressor.connect(context.destination);
    clapBuffer = createDeterministicNoise(context, 0.09, 527);
    return context;
  };

  const connectVoice = (source: AudioNode, panValue: number) => {
    if (!context || !dry || !reverb) return null;
    const panner = context.createStereoPanner();
    panner.pan.value = panValue;
    source.connect(panner);
    panner.connect(dry);
    panner.connect(reverb);
    return panner;
  };

  const trackSource = (source: AudioScheduledSourceNode) => {
    activeSources.add(source);
    source.addEventListener('ended', () => activeSources.delete(source), { once: true });
  };

  const scheduleTone = (
    frequency: number,
    when: number,
    duration: number,
    part: Exclude<SongYardPartId, 'hands'>,
  ) => {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = part === 'call' ? 'triangle' : part === 'answer' ? 'sine' : 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, when);
    if (part !== 'floor') oscillator.detune.setValueAtTime(part === 'call' ? -3 : 3, when);

    const peak = part === 'floor' ? 0.11 : 0.085;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.018);
    gain.gain.setValueAtTime(peak, Math.max(when + 0.02, when + duration - 0.1));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    oscillator.connect(gain);
    connectVoice(gain, PART_PANS[part]);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.03);
    trackSource(oscillator);
  };

  const scheduleClap = (when: number, panValue: number) => {
    if (!context || !clapBuffer) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = clapBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1450;
    filter.Q.value = 0.75;
    gain.gain.setValueAtTime(0.075, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.075);
    source.connect(filter);
    filter.connect(gain);
    connectVoice(gain, panValue);
    source.start(when);
    source.stop(when + 0.09);
    trackSource(source);
  };

  const scheduleClick = (when: number, strong: boolean) => {
    if (!context || !dry) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = strong ? 1080 : 720;
    gain.gain.setValueAtTime(strong ? 0.028 : 0.014, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.035);
    oscillator.connect(gain);
    gain.connect(dry);
    oscillator.start(when);
    oscillator.stop(when + 0.04);
    trackSource(oscillator);
  };

  const currentRootMidi = () => 60 + seed.root + Number(keyInput?.value || 0);

  const updateTarget = () => {
    const targetMidi = currentRootMidi() + degreeToSemitones(seed.callDegrees.find((degree) => degree !== null) ?? 0, seed.mode);
    if (targetNote) targetNote.textContent = midiLabel(targetMidi);
    if (keyOutput) {
      const offset = Number(keyInput?.value || 0);
      keyOutput.textContent = offset === 0 ? 'home' : `${offset > 0 ? '+' : ''}${offset}`;
    }
  };

  const pulseStep = (step: number, partIds: SongYardPartId[]) => {
    clearVisualState();
    beatCells[step]?.setAttribute('data-active', 'true');
    partIds.forEach((partId) => {
      root.querySelector<HTMLElement>(`[data-practice-part="${partId}"]`)?.setAttribute('data-sounding', 'true');
      root.querySelector<HTMLElement>(`[data-bowl-section="${partId}"]`)?.setAttribute('data-active', 'true');
    });
  };

  const scheduleVisual = (delay: number, step: number, parts: SongYardPartId[]) => {
    const timer = window.setTimeout(() => {
      visualTimers.delete(timer);
      if (playing) pulseStep(step, parts);
    }, Math.max(0, delay));
    visualTimers.add(timer);
  };

  const partsAtStep = (step: number, mode: TransportMode) => {
    const parts: SongYardPartId[] = [];
    if ((mode === 'bowl' || selectedPart === 'call') && step < 8 && seed.callDegrees[step] !== null) parts.push('call');
    if ((mode === 'bowl' || selectedPart === 'answer') && step >= 8 && seed.answerDegrees[step - 8] !== null) parts.push('answer');
    if ((mode === 'bowl' || selectedPart === 'floor') && step % 4 === 0) parts.push('floor');
    if ((mode === 'bowl' || selectedPart === 'hands') && seed.handSteps.includes(step)) parts.push('hands');
    return parts;
  };

  const scheduleRound = () => {
    if (!playing) return;
    const audio = ensureContext();
    const bpm = Number(bpmInput?.value || seed.bpm);
    const stepSeconds = 60 / bpm / 2;
    const startAt = audio.currentTime + 0.07;
    const rootMidi = currentRootMidi();

    for (let step = 0; step < 16; step += 1) {
      const when = startAt + step * stepSeconds;
      const parts = partsAtStep(step, transportMode);
      if (transportMode === 'part' && step % 4 === 0) scheduleClick(when, step === 0 || step === 8);

      if (parts.includes('call')) {
        const degree = seed.callDegrees[step];
        if (degree !== null) scheduleTone(midiToHz(rootMidi + degreeToSemitones(degree, seed.mode)), when, stepSeconds * 1.55, 'call');
      }
      if (parts.includes('answer')) {
        const degree = seed.answerDegrees[step - 8];
        if (degree !== null) scheduleTone(midiToHz(rootMidi + degreeToSemitones(degree, seed.mode)), when, stepSeconds * 1.55, 'answer');
      }
      if (parts.includes('floor')) {
        const floorDegree = seed.floorDegrees[Math.floor(step / 4) % seed.floorDegrees.length];
        scheduleTone(midiToHz(rootMidi - 12 + degreeToSemitones(floorDegree, seed.mode)), when, stepSeconds * 3.45, 'floor');
      }
      if (parts.includes('hands')) {
        scheduleClap(when, step % 4 === 2 ? -0.36 : 0.42);
      }

      scheduleVisual((when - audio.currentTime) * 1000, step, parts);
    }

    const roundMs = stepSeconds * 16 * 1000;
    roundTimer = window.setTimeout(() => {
      roundTimer = null;
      if (playing && loopInput?.checked) {
        scheduleRound();
      } else {
        stopTransport('One complete pass. Keep the part, change the song, or open the whole bowl.');
      }
    }, roundMs + 80);
  };

  const stopMic = async (message = 'Pitch listener off. No audio was recorded or uploaded.') => {
    if (pitchFrame !== null) cancelAnimationFrame(pitchFrame);
    pitchFrame = null;
    micStream?.getTracks().forEach((track) => track.stop());
    micStream = null;
    analyser = null;
    pitchSamples = null;
    if (micContext) await micContext.close().catch(() => {});
    micContext = null;
    micButton?.setAttribute('aria-pressed', 'false');
    if (micButton) micButton.textContent = 'Listen to my pitch';
    if (micStatus) micStatus.textContent = message;
    if (pitchNote) pitchNote.textContent = '—';
    pitchMeter?.style.setProperty('--pitch-position', '50%');
  };

  const readPitch = () => {
    if (!analyser || !pitchSamples || !micContext) return;
    analyser.getFloatTimeDomainData(pitchSamples);
    const frequency = autoCorrelate(pitchSamples, micContext.sampleRate);
    if (frequency) {
      const midi = 69 + 12 * Math.log2(frequency / 440);
      const nearest = Math.round(midi);
      const cents = Math.round((midi - nearest) * 100);
      if (pitchNote) pitchNote.textContent = `${midiLabel(nearest)} ${cents > 0 ? '+' : ''}${cents}¢`;
      pitchMeter?.style.setProperty('--pitch-position', `${Math.max(4, Math.min(96, 50 + cents * 0.9))}%`);
      if (micStatus) {
        micStatus.textContent = Math.abs(cents) < 14
          ? 'Centered. Hold it without pushing.'
          : cents < 0
            ? 'A little low. Let the note rise.'
            : 'A little high. Let the note settle.';
      }
    } else if (pitchNote) {
      pitchNote.textContent = 'listening…';
    }
    pitchFrame = requestAnimationFrame(readPitch);
  };

  const startMic = async () => {
    if (micStream) {
      await stopMic();
      return;
    }
    stopTransport('The guide is quiet so the pitch listener only hears you.');
    if (!navigator.mediaDevices?.getUserMedia) {
      if (micStatus) micStatus.textContent = 'This browser does not offer microphone access.';
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      });
      const ContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!ContextClass) throw new Error('Web Audio is unavailable.');
      micContext = new ContextClass();
      analyser = micContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      pitchSamples = new Float32Array(analyser.fftSize);
      micContext.createMediaStreamSource(micStream).connect(analyser);
      micButton?.setAttribute('aria-pressed', 'true');
      if (micButton) micButton.textContent = 'Stop listening';
      if (micStatus) micStatus.textContent = 'Listening only in this browser. Hum the target note gently.';
      readPitch();
    } catch {
      await stopMic('Microphone permission was not available. The rest of the Song Yard still works.');
    }
  };

  const startTransport = async (mode: TransportMode) => {
    await stopMic('Pitch listener off while the guide is playing.');
    stopTransport();
    try {
      const audio = ensureContext();
      if (audio.state === 'suspended') await audio.resume();
      playing = true;
      transportMode = mode;
      startPartButton?.setAttribute('aria-pressed', mode === 'part' ? 'true' : 'false');
      startBowlButton?.setAttribute('aria-pressed', mode === 'bowl' ? 'true' : 'false');
      const part = SONG_YARD_PARTS.find((item) => item.id === selectedPart);
      status(mode === 'bowl'
        ? `${seed.title}: Transit Porch, Student End, Band Terrace, and Afterglow Table are entering together.`
        : `${seed.title}: practicing ${part?.name.toLowerCase() || selectedPart}.`);
      scheduleRound();
    } catch (error) {
      stopTransport(error instanceof Error ? error.message : 'The audio guide could not start.');
    }
  };

  const renderSeed = () => {
    if (songTitle) songTitle.textContent = seed.title;
    if (songKicker) songKicker.textContent = seed.kicker;
    if (songCall) songCall.textContent = seed.call;
    if (songAnswer) songAnswer.textContent = seed.answer;
    if (songNote) songNote.textContent = seed.note;
    if (bpmInput) bpmInput.value = String(seed.bpm);
    if (bpmOutput) bpmOutput.textContent = String(seed.bpm);
    seedButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.seedId === seed.id)));
    updateTarget();
    stopTransport(`${seed.title} loaded. Choose one part or open the whole bowl.`);
  };

  const renderPart = () => {
    const part = SONG_YARD_PARTS.find((item) => item.id === selectedPart) || SONG_YARD_PARTS[0];
    partButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.practicePart === selectedPart)));
    if (partTitle) partTitle.textContent = `${part.name} · ${part.section}`;
    if (partInstruction) partInstruction.textContent = part.instruction;
    stopTransport(`${part.name} selected. ${part.short}.`);
  };

  const renderIdentity = () => {
    const identity = SONG_YARD_PROGRAMS.find((item) => item.slug === identitySelect?.value) || SONG_YARD_PROGRAMS[0];
    root.style.setProperty('--team', identity.primary);
    root.style.setProperty('--team-two', identity.secondary);
    root.style.setProperty('--team-paper', identity.paper);
    if (identityName) identityName.textContent = identity.school;
    if (identityMarkName) identityMarkName.textContent = identity.markName;
    if (mark) {
      while (mark.firstChild) mark.removeChild(mark.firstChild);
      identity.markPaths.forEach((pathData) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        mark.append(path);
      });
      mark.setAttribute('aria-label', `${identity.markName}, PointCast's unofficial 2029 abstract mark proposal for ${identity.school}`);
    }
  };

  identitySelect?.addEventListener('change', renderIdentity);
  seedButtons.forEach((button) => button.addEventListener('click', () => {
    seed = SONG_YARD_SEEDS.find((item) => item.id === button.dataset.seedId) || SONG_YARD_SEEDS[0];
    renderSeed();
  }));
  partButtons.forEach((button) => button.addEventListener('click', () => {
    selectedPart = (button.dataset.practicePart as SongYardPartId) || 'call';
    renderPart();
  }));
  bpmInput?.addEventListener('input', () => {
    if (bpmOutput) bpmOutput.textContent = bpmInput.value;
    if (playing) startTransport(transportMode);
  });
  keyInput?.addEventListener('input', () => {
    updateTarget();
    if (playing) startTransport(transportMode);
  });
  startPartButton?.addEventListener('click', () => startTransport('part'));
  startBowlButton?.addEventListener('click', () => startTransport('bowl'));
  stopButton?.addEventListener('click', () => stopTransport());
  micButton?.addEventListener('click', startMic);

  const onVisibility = () => {
    if (document.hidden) {
      stopTransport('Paused while this page is out of view.');
      stopMic('Pitch listener stopped while this page is out of view.');
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  renderIdentity();
  renderSeed();
  renderPart();

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    stopTransport();
    stopMic();
    context?.close().catch(() => {});
    context = null;
    delete root.dataset.songYardReady;
  };
}

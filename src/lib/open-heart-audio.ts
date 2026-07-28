type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type GardenNodes = {
  context: AudioContext;
  master: GainNode;
  delay: DelayNode;
  feedback: GainNode;
  shimmer: BiquadFilterNode;
};

const TUNING = [196, 220.5, 261.33, 294, 343];
const LOOP = [0, null, 2, 1, null, 3, 0, 4, null, 2, 1, 3] as const;
const STEP_MS = Math.round((60_000 / 92) / 2);

function createNoise(context: AudioContext, duration: number) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.93 + white * 0.07;
    data[i] = last;
  }
  return buffer;
}

export function mountOpenHeartAudio(root: HTMLElement) {
  let nodes: GardenNodes | null = null;
  let loopTimer = 0;
  let loopStep = 0;
  let running = false;

  const status = root.querySelector<HTMLElement>('[data-audio-status]');
  const loopButton = root.querySelector<HTMLButtonElement>('[data-loop-toggle]');
  const volume = root.querySelector<HTMLInputElement>('[data-volume]');
  const stepNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const toneButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tone]'));

  const setStatus = (message: string) => {
    if (status) status.textContent = message;
  };

  const ensureAudio = async () => {
    if (!nodes) {
      const AudioContextClass =
        window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) {
        setStatus('Web Audio is not available here. The visual garden still works.');
        return null;
      }

      const context = new AudioContextClass();
      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const delay = context.createDelay(1.5);
      const feedback = context.createGain();
      const shimmer = context.createBiquadFilter();

      master.gain.value = Number(volume?.value ?? 0.62);
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.34;
      delay.delayTime.value = 0.31;
      feedback.gain.value = 0.28;
      shimmer.type = 'highpass';
      shimmer.frequency.value = 760;
      shimmer.Q.value = 0.7;

      master.connect(compressor);
      master.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(shimmer);
      shimmer.connect(compressor);
      compressor.connect(context.destination);

      nodes = { context, master, delay, feedback, shimmer };
    }

    if (nodes.context.state === 'suspended') await nodes.context.resume();
    root.dataset.audio = 'ready';
    return nodes;
  };

  const pulseVisual = (voice: number, source?: HTMLElement) => {
    root.dataset.voice = String(voice);
    root.dispatchEvent(new CustomEvent('openheart:bloom', {
      detail: {
        voice,
        x: source ? source.getBoundingClientRect().left + source.offsetWidth / 2 : window.innerWidth / 2,
        y: source ? source.getBoundingClientRect().top + source.offsetHeight / 2 : window.innerHeight / 2,
      },
    }));
  };

  const strike = async (voice: number, source?: HTMLElement, quiet = false) => {
    const audio = await ensureAudio();
    if (!audio) return;

    const { context, master } = audio;
    const now = context.currentTime + 0.008;
    const frequency = TUNING[voice] ?? TUNING[0];
    const level = quiet ? 0.085 : 0.16;
    const pan = context.createStereoPanner();
    pan.pan.value = (voice - 2) * 0.22;
    pan.connect(master);

    if (voice === 0) {
      const fundamental = context.createOscillator();
      const glow = context.createOscillator();
      const gain = context.createGain();
      fundamental.type = 'triangle';
      glow.type = 'sine';
      fundamental.frequency.setValueAtTime(frequency, now);
      fundamental.frequency.exponentialRampToValueAtTime(frequency * 0.985, now + 0.8);
      glow.frequency.value = frequency * 2.01;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
      fundamental.connect(gain);
      glow.connect(gain);
      gain.connect(pan);
      fundamental.start(now);
      glow.start(now);
      fundamental.stop(now + 1.4);
      glow.stop(now + 1.4);
    } else if (voice === 1 || voice === 2) {
      const partials = voice === 1 ? [1, 2.76, 5.4] : [1, 1.5, 3.02];
      partials.forEach((ratio, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency * ratio;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(level / (index + 1), now + 0.006 + index * 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 - index * 0.22);
        oscillator.connect(gain);
        gain.connect(pan);
        oscillator.start(now);
        oscillator.stop(now + 1.9);
      });
    } else if (voice === 3) {
      const sourceNode = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      sourceNode.buffer = createNoise(context, 0.42);
      filter.type = 'bandpass';
      filter.frequency.value = 1480;
      filter.Q.value = 1.8;
      gain.gain.setValueAtTime(level * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
      sourceNode.connect(filter);
      filter.connect(gain);
      gain.connect(pan);
      sourceNode.start(now);
    } else {
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency / 2, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency, now + 0.36);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.32);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level * 0.62, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(pan);
      oscillator.start(now);
      oscillator.stop(now + 0.94);
    }

    pulseVisual(voice, source);
    setStatus(`${toneButtons[voice]?.dataset.toneLabel ?? 'Garden tone'} sounded.`);
  };

  const paintStep = () => {
    stepNodes.forEach((node, index) => {
      node.dataset.active = index === loopStep ? 'true' : 'false';
    });
  };

  const scheduleNext = () => {
    if (!running) return;
    paintStep();
    const voice = LOOP[loopStep];
    if (typeof voice === 'number') void strike(voice, toneButtons[voice], true);
    loopStep = (loopStep + 1) % LOOP.length;
    loopTimer = window.setTimeout(scheduleNext, STEP_MS);
  };

  const stopLoop = () => {
    running = false;
    window.clearTimeout(loopTimer);
    stepNodes.forEach((node) => {
      node.dataset.active = 'false';
    });
    if (loopButton) {
      loopButton.setAttribute('aria-pressed', 'false');
      loopButton.textContent = 'Start garden loop';
    }
    setStatus('Garden loop resting. Tap any tone.');
  };

  const startLoop = async () => {
    if (!(await ensureAudio())) return;
    running = true;
    loopStep = 0;
    if (loopButton) {
      loopButton.setAttribute('aria-pressed', 'true');
      loopButton.textContent = 'Rest garden loop';
    }
    setStatus('Original 12-step garden loop playing at 92 BPM.');
    scheduleNext();
  };

  toneButtons.forEach((button, voice) => {
    button.addEventListener('click', () => void strike(voice, button));
  });

  loopButton?.addEventListener('click', () => {
    if (running) stopLoop();
    else void startLoop();
  });

  volume?.addEventListener('input', () => {
    if (!nodes) return;
    nodes.master.gain.setTargetAtTime(Number(volume.value), nodes.context.currentTime, 0.03);
  });

  return {
    strike,
    stop: stopLoop,
    destroy: () => {
      stopLoop();
      void nodes?.context.close();
    },
  };
}

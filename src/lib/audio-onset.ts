export interface OnsetOptions {
  threshold?: number;
  minIntervalMs?: number;
  sampleWindow?: number;
}

export interface OnsetDetector {
  start: () => Promise<void>;
  stop: () => void;
  onOnset: (cb: (at: number, energy: number) => void) => () => void;
}

export function createOnsetDetector(opts: OnsetOptions = {}): OnsetDetector {
  const threshold = opts.threshold ?? 0.15;
  const minIntervalMs = opts.minIntervalMs ?? 120;
  const sampleWindow = opts.sampleWindow ?? 1024;
  const listeners = new Set<(at: number, energy: number) => void>();
  let audioContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let frameId = 0;
  let lastOnsetAt = -Infinity;
  let samples: Float32Array | null = null;

  const stop = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    analyser?.disconnect();
    source?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    audioContext?.close().catch(() => undefined);
    analyser = null;
    source = null;
    stream = null;
    samples = null;
    audioContext = null;
    lastOnsetAt = -Infinity;
  };

  const tick = () => {
    if (!analyser || !samples) return;
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const value = samples[i];
      sum += value * value;
    }
    const energy = Math.sqrt(sum / samples.length);
    const now = performance.now();
    if (energy >= threshold && now - lastOnsetAt >= minIntervalMs) {
      lastOnsetAt = now;
      listeners.forEach((cb) => cb(now, energy));
    }
    frameId = requestAnimationFrame(tick);
  };

  const start = async () => {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown error";
      throw new Error(`Microphone access failed: ${detail}`);
    }
    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    const size = Math.max(32, Math.min(sampleWindow, analyser.fftSize));
    samples = new Float32Array(size);
    source.connect(analyser);
    if (audioContext.state === "suspended") await audioContext.resume();
    frameId = requestAnimationFrame(tick);
  };

  const onOnset = (cb: (at: number, energy: number) => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  return { start, stop, onOnset };
}

export type PadFamily = "drums" | "bass" | "mallets" | "chords" | "ear-candy";
export type PadDefinition = {
  id: string;
  key: string;
  code: string;
  label: string;
  family: PadFamily;
  color: string;
  note?: number;
};

export const PAD_KEYS = "1234567890QWERTYUIOPASDFGHJKLZXCVBNM" as const;

const drumPads: Array<Omit<PadDefinition, "key" | "code">> = [
  { id: "kick", label: "Big Kick", family: "drums", color: "#ff5c35" },
  { id: "snare", label: "Snap Snare", family: "drums", color: "#ff7a45" },
  { id: "clap", label: "Crew Clap", family: "drums", color: "#ff9861" },
  { id: "hat-closed", label: "Tight Hat", family: "drums", color: "#ffc247" },
  { id: "hat-open", label: "Open Hat", family: "drums", color: "#ffdb5c" },
  { id: "tom-low", label: "Low Tom", family: "drums", color: "#f14d84" },
  { id: "tom-high", label: "High Tom", family: "drums", color: "#ed70a7" },
  { id: "rim", label: "Rim Click", family: "drums", color: "#dc83cc" },
  { id: "shaker", label: "Shaker", family: "drums", color: "#b78de7" },
  { id: "tambourine", label: "Tambourine", family: "drums", color: "#9479e8" },
];

const bassNotes = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64];
const bassNames = ["C", "D", "E", "F", "G", "A", "B", "C2", "D2", "E2"];
const bassPads = bassNotes.map((note, index) => ({
  id: `bass-${bassNames[index].toLowerCase()}`,
  label: `Bass ${bassNames[index]}`,
  family: "bass" as const,
  color: index < 5 ? "#168a91" : "#17a6a2",
  note,
}));

const malletNotes = [60, 62, 64, 65, 67, 69, 71, 72, 74];
const malletNames = ["C", "D", "E", "F", "G", "A", "B", "C2", "D2"];
const malletPads = malletNotes.map((note, index) => ({
  id: `mallet-${malletNames[index].toLowerCase()}`,
  label: `Mallet ${malletNames[index]}`,
  family: "mallets" as const,
  color: index < 5 ? "#3988f5" : "#5c9dfa",
  note,
}));

const chordPads: Array<Omit<PadDefinition, "key" | "code">> = [
  {
    id: "chord-c",
    label: "C Major",
    family: "chords",
    color: "#6d56e8",
    note: 60,
  },
  {
    id: "chord-dm",
    label: "D Minor",
    family: "chords",
    color: "#725fe7",
    note: 62,
  },
  {
    id: "chord-em",
    label: "E Minor",
    family: "chords",
    color: "#7e68e9",
    note: 64,
  },
  {
    id: "chord-f",
    label: "F Major",
    family: "chords",
    color: "#8b73eb",
    note: 65,
  },
  {
    id: "chord-g",
    label: "G Major",
    family: "chords",
    color: "#987def",
    note: 67,
  },
  {
    id: "chord-am",
    label: "A Minor",
    family: "chords",
    color: "#a786f1",
    note: 69,
  },
  {
    id: "sparkle",
    label: "Noun Sparkle",
    family: "ear-candy",
    color: "#d954df",
    note: 84,
  },
];

const rawPads = [...drumPads, ...bassPads, ...malletPads, ...chordPads];
export const PAD_DEFINITIONS: readonly PadDefinition[] = Object.freeze(
  rawPads.map((pad, index) =>
    Object.freeze({
      ...pad,
      key: PAD_KEYS[index],
      code: /^\d$/.test(PAD_KEYS[index])
        ? `Digit${PAD_KEYS[index]}`
        : `Key${PAD_KEYS[index]}`,
    }),
  ),
);

export const PAD_BY_ID: ReadonlyMap<string, PadDefinition> = new Map(
  PAD_DEFINITIONS.map((pad) => [pad.id, pad]),
);
export const PAD_BY_CODE: ReadonlyMap<string, PadDefinition> = new Map(
  PAD_DEFINITIONS.map((pad) => [pad.code, pad]),
);
export const PAD_FAMILIES_BY_ROW = Object.freeze([
  "drums",
  "bass",
  "mallets",
  "chords",
] as const);

type AudioContextConstructor = new () => AudioContext;
type Voice = {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  stop: () => void;
};
export type NounsDrumClubAudioOptions = {
  contextFactory?: () => AudioContext;
  maxVoices?: number;
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

/** Sample-free Web Audio instrument. Creating it is silent; enable() must be called from a user gesture. */
export class NounsDrumClubAudio {
  #context: AudioContext | null = null;
  #master: GainNode | null = null;
  #compressor: DynamicsCompressorNode | null = null;
  #analyser: AnalyserNode | null = null;
  #levelData: Uint8Array<ArrayBuffer> | null = null;
  #voices = new Set<Voice>();
  #noise: AudioBuffer | null = null;
  #contextFactory?: () => AudioContext;
  #volume = 0.72;
  #muted = false;
  #disposed = false;
  #maxVoices: number;
  #enableSerial = 0;

  constructor(options: NounsDrumClubAudioOptions = {}) {
    this.#contextFactory = options.contextFactory;
    this.#maxVoices = clamp(Math.round(options.maxVoices ?? 40), 8, 64);
  }

  get enabled() {
    return this.#context?.state === "running" && !this.#disposed;
  }
  get currentTime() {
    return this.#context?.currentTime ?? 0;
  }
  get volume() {
    return this.#volume;
  }
  get muted() {
    return this.#muted;
  }
  /** Current output RMS (0..1), useful for an honest visual meter. */
  get level() {
    if (!this.#analyser || this.#muted || this.#volume === 0 || !this.enabled)
      return 0;
    this.#levelData ??= new Uint8Array(this.#analyser.fftSize);
    this.#analyser.getByteTimeDomainData(this.#levelData);
    let sum = 0;
    for (const sample of this.#levelData) {
      const centered = (sample - 128) / 128;
      sum += centered * centered;
    }
    return clamp(Math.sqrt(sum / this.#levelData.length), 0, 1);
  }

  async enable(): Promise<boolean> {
    if (this.#disposed) return false;
    const attempt = this.#enableSerial;
    try {
      if (!this.#context) {
        const Audio =
          globalThis.AudioContext ??
          (
            globalThis as typeof globalThis & {
              webkitAudioContext?: AudioContextConstructor;
            }
          ).webkitAudioContext;
        this.#context =
          this.#contextFactory?.() ?? (Audio ? new Audio() : null);
        if (!this.#context) return false;
        this.#master = this.#context.createGain();
        // Avoid the GainNode default of 1.0 leaking through during the first
        // setTargetAtTime ramp when a gesture immediately triggers a hit.
        this.#master.gain.value = this.#muted ? 0 : this.#volume * 0.58;
        this.#compressor = this.#context.createDynamicsCompressor();
        this.#compressor.threshold.value = -12;
        this.#compressor.knee.value = 18;
        this.#compressor.ratio.value = 5;
        this.#compressor.attack.value = 0.003;
        this.#compressor.release.value = 0.18;
        this.#analyser = this.#context.createAnalyser();
        this.#analyser.fftSize = 256;
        this.#master.connect(this.#compressor);
        this.#compressor.connect(this.#analyser);
        this.#analyser.connect(this.#context.destination);
        this.#applyVolume();
      }
      const context = this.#context;
      if (context.state !== "running") await context.resume();
      if (
        this.#disposed ||
        attempt !== this.#enableSerial ||
        context !== this.#context
      ) {
        if (context.state !== "closed")
          try {
            await context.close();
          } catch {}
        return false;
      }
      return context.state === "running";
    } catch {
      if (
        this.#context &&
        (!this.#master || !this.#compressor || !this.#analyser)
      ) {
        const incomplete = this.#context;
        this.#context = null;
        this.#master = null;
        this.#compressor = null;
        this.#analyser = null;
        try {
          await incomplete.close();
        } catch {}
      }
      return false;
    }
  }

  setVolume(value: number) {
    if (!Number.isFinite(value)) return;
    this.#volume = clamp(value, 0, 1);
    if (this.#volume === 0) this.#stopVoices();
    this.#applyVolume();
  }

  setMuted(value: boolean) {
    this.#muted = Boolean(value);
    if (this.#muted) this.#stopVoices();
    this.#applyVolume();
  }

  /** Immediately cancels active and look-ahead scheduled voices without changing mute or volume. */
  stop() {
    this.#stopVoices();
  }

  #applyVolume() {
    if (!this.#master || !this.#context) return;
    const target = this.#muted ? 0 : this.#volume * 0.58;
    this.#master.gain.cancelScheduledValues(this.#context.currentTime);
    this.#master.gain.setTargetAtTime(target, this.#context.currentTime, 0.012);
  }

  hit(padId: string, velocity = 1, when?: number): boolean {
    const pad = PAD_BY_ID.get(padId);
    const context = this.#context;
    if (
      !pad ||
      !context ||
      !this.#master ||
      context.state !== "running" ||
      this.#disposed ||
      this.#muted ||
      this.#volume === 0
    )
      return false;
    if (!Number.isFinite(velocity) || velocity <= 0) return false;
    const level = clamp(velocity, 0.05, 1);
    const requestedAt = Number.isFinite(when) ? when! : context.currentTime;
    if (requestedAt > context.currentTime + 2) return false;
    const at = Math.max(context.currentTime, requestedAt);
    while (this.#voices.size >= this.#maxVoices)
      this.#voices.values().next().value?.stop();
    if (pad.family === "drums") this.#drum(pad.id, level, at);
    else if (pad.family === "bass") this.#bass(pad.note!, level, at);
    else if (pad.family === "mallets") this.#mallet(pad.note!, level, at);
    else if (pad.family === "chords") this.#chord(pad.id, pad.note!, level, at);
    else this.#sparkle(pad.note!, level, at);
    return true;
  }

  #newVoice(
    sources: AudioScheduledSourceNode[],
    nodes: AudioNode[],
    stopAt: number,
  ) {
    let done = false;
    const voice: Voice = {
      sources,
      nodes,
      stop: () => {
        if (done) return;
        done = true;
        this.#voices.delete(voice);
        for (const source of sources) {
          try {
            source.stop();
          } catch {
            /* already stopped */
          }
          try {
            source.disconnect();
          } catch {}
        }
        for (const node of nodes)
          try {
            node.disconnect();
          } catch {}
      },
    };
    this.#voices.add(voice);
    sources[0]?.addEventListener("ended", voice.stop, { once: true });
    for (const source of sources) source.stop(stopAt);
  }

  #stopVoices() {
    for (const voice of [...this.#voices]) voice.stop();
  }

  #osc(
    type: OscillatorType,
    frequency: number,
    at: number,
    end: number,
    gainPeak: number,
    destination: AudioNode,
    detune = 0,
  ) {
    const context = this.#context!;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, gainPeak),
      at + 0.006,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(at);
    return { oscillator, gain };
  }

  #noiseSource(
    at: number,
    end: number,
    peak: number,
    frequency: number,
    type: BiquadFilterType = "bandpass",
  ) {
    const context = this.#context!;
    if (!this.#noise) {
      this.#noise = context.createBuffer(
        1,
        Math.round(context.sampleRate * 1.2),
        context.sampleRate,
      );
      const channel = this.#noise.getChannelData(0);
      for (let index = 0; index < channel.length; index++)
        channel[index] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = this.#noise;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(Math.max(0.0002, peak), at);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.#master!);
    source.start(at);
    return { source, filter, gain };
  }

  #drum(id: string, velocity: number, at: number) {
    const context = this.#context!;
    if (id === "kick" || id === "tom-low" || id === "tom-high") {
      const duration = id === "kick" ? 0.46 : 0.3,
        end = at + duration;
      const frequency = id === "kick" ? 56 : id === "tom-low" ? 92 : 142;
      const tone = this.#osc(
        "sine",
        frequency,
        at,
        end,
        velocity * 0.75,
        this.#master!,
      );
      tone.oscillator.frequency.exponentialRampToValueAtTime(
        id === "kick" ? 42 : frequency * 0.72,
        end,
      );
      this.#newVoice([tone.oscillator], [tone.gain], end + 0.01);
      return;
    }
    const durations: Record<string, number> = {
      snare: 0.2,
      clap: 0.16,
      "hat-closed": 0.065,
      "hat-open": 0.34,
      rim: 0.08,
      shaker: 0.1,
      tambourine: 0.22,
    };
    const frequencies: Record<string, number> = {
      snare: 1700,
      clap: 1200,
      "hat-closed": 7200,
      "hat-open": 6600,
      rim: 2500,
      shaker: 5400,
      tambourine: 7800,
    };
    const duration = durations[id] ?? 0.12,
      end = at + duration;
    const noise = this.#noiseSource(
      at,
      end,
      velocity * (id === "snare" ? 0.48 : 0.3),
      frequencies[id] ?? 4000,
      id.includes("hat") || id === "tambourine" ? "highpass" : "bandpass",
    );
    const sources: AudioScheduledSourceNode[] = [noise.source],
      nodes: AudioNode[] = [noise.filter, noise.gain];
    if (id === "snare" || id === "rim") {
      const tone = this.#osc(
        "triangle",
        id === "rim" ? 760 : 190,
        at,
        at + 0.08,
        velocity * 0.18,
        this.#master!,
      );
      sources.push(tone.oscillator);
      nodes.push(tone.gain);
    }
    this.#newVoice(sources, nodes, end + 0.01);
  }

  #bass(note: number, velocity: number, at: number) {
    const end = at + 0.42,
      filter = this.#context!.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(680, at);
    filter.frequency.exponentialRampToValueAtTime(190, end);
    filter.Q.value = 1.4;
    filter.connect(this.#master!);
    const first = this.#osc(
      "triangle",
      midiToHz(note),
      at,
      end,
      velocity * 0.42,
      filter,
    );
    const second = this.#osc(
      "sine",
      midiToHz(note - 12),
      at,
      end,
      velocity * 0.24,
      filter,
    );
    this.#newVoice(
      [first.oscillator, second.oscillator],
      [first.gain, second.gain, filter],
      end + 0.01,
    );
  }

  #mallet(note: number, velocity: number, at: number) {
    const end = at + 0.62;
    const fundamental = this.#osc(
      "sine",
      midiToHz(note),
      at,
      end,
      velocity * 0.34,
      this.#master!,
    );
    const overtone = this.#osc(
      "sine",
      midiToHz(note) * 3.01,
      at,
      at + 0.2,
      velocity * 0.11,
      this.#master!,
    );
    this.#newVoice(
      [fundamental.oscillator, overtone.oscillator],
      [fundamental.gain, overtone.gain],
      end + 0.01,
    );
  }

  #chord(id: string, root: number, velocity: number, at: number) {
    const minor = id.endsWith("m"),
      intervals = minor ? [0, 3, 7] : [0, 4, 7],
      end = at + 0.9;
    const filter = this.#context!.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1450;
    filter.connect(this.#master!);
    const parts = intervals.map((interval, index) =>
      this.#osc(
        "triangle",
        midiToHz(root + interval),
        at + index * 0.006,
        end,
        velocity * 0.13,
        filter,
        index * 3 - 3,
      ),
    );
    this.#newVoice(
      parts.map((part) => part.oscillator),
      [...parts.map((part) => part.gain), filter],
      end + 0.01,
    );
  }

  #sparkle(note: number, velocity: number, at: number) {
    const offsets = [0, 7, 12, 19],
      sources: AudioScheduledSourceNode[] = [],
      nodes: AudioNode[] = [];
    for (let index = 0; index < offsets.length; index++) {
      const start = at + index * 0.055,
        part = this.#osc(
          "sine",
          midiToHz(note + offsets[index]),
          start,
          start + 0.5,
          velocity * 0.14,
          this.#master!,
        );
      sources.push(part.oscillator);
      nodes.push(part.gain);
    }
    this.#newVoice(sources, nodes, at + 0.72);
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#enableSerial++;
    this.#stopVoices();
    this.#noise = null;
    try {
      this.#master?.disconnect();
    } catch {}
    try {
      this.#compressor?.disconnect();
    } catch {}
    try {
      this.#analyser?.disconnect();
    } catch {}
    const context = this.#context;
    this.#context = null;
    this.#master = null;
    this.#compressor = null;
    this.#analyser = null;
    this.#levelData = null;
    if (context && context.state !== "closed")
      try {
        await context.close();
      } catch {}
  }
}

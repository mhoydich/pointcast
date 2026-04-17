/**
 * chimes — shared Web Audio synth for PointCast's sound system.
 *
 * One deterministic "voice" per Noun ID (0–1199). Each noun gets a unique
 * combination of:
 *
 *   • base note     (16-note extended Yō pentatonic, 3 octaves)
 *   • chord partner (60% of nouns play a 2-note arpeggio; intervals stay
 *                    inside the pentatonic so anything harmonizes)
 *   • waveform      (sine-dominant, sprinkle of triangle/square/saw)
 *   • decay         (200ms–1000ms, skewed short)
 *   • brightness    (how loud the 2nd + 3rd harmonics are)
 *   • attack        (sharp vs. soft onset)
 *   • arpeggio gap  (time between the two notes of a chord)
 *
 * Same noun → same voice, every session. The pentatonic constraint means
 * tapping any two nouns in quick succession always sounds consonant, so
 * the presence strip / bells grid / drum room can be rapid-fire tapped
 * without turning into noise.
 *
 * Also exports emoji/emoji-add/drum helpers and a broadcast wrapper that
 * fires every local chime up to /api/sounds so other visitors hear it too
 * (with the hear-others toggle, throttled server-side to 5/sec per client).
 */

export type ChimeKind = 'profile' | 'emoji' | 'emoji-add' | 'drum';

export interface NounVoice {
  baseFreq: number;
  secondFreq: number | null;
  waveform: OscillatorType;
  decay: number;
  brightness: number;
  attack: number;      // 0.0 (sharp) .. 0.03 (soft)
  secondDelay: number; // ms between notes of a 2-note voice
}

// 16-note extended Yō pentatonic (C3 → C6). All intervals harmonize.
export const SCALE = [
  130.81, 146.83, 164.81, 196.00, 220.00,  // C3 D3 E3 G3 A3
  261.63, 293.66, 329.63, 392.00, 440.00,  // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.00,  // C5 D5 E5 G5 A5
  1046.5,                                   // C6
];

/** Deterministic hash → [0,1) given a nounId + sub-seed. */
function h(nounId: number, seed: number): number {
  const x = Math.sin(nounId * (seed * 1337.42 + 1) + seed * 97.31) * 43758.5453;
  return x - Math.floor(x);
}

/** Compute the unique voice for a noun. Pure — safe to call anywhere. */
export function nounVoice(nounId: number): NounVoice {
  const baseIdx = Math.floor(h(nounId, 1) * SCALE.length);
  const baseFreq = SCALE[baseIdx];

  // Chord decision — 60% of nouns get a 2-note voice for richness.
  const chordRoll = h(nounId, 2);
  let secondFreq: number | null = null;
  if (chordRoll > 0.4) {
    const offsets = [2, 3, 4, 5, -2, -3];   // third, fourth, fifth, octave-ish, inverse
    const off = offsets[Math.floor(h(nounId, 3) * offsets.length)];
    const secIdx = Math.max(0, Math.min(SCALE.length - 1, baseIdx + off));
    if (secIdx !== baseIdx) secondFreq = SCALE[secIdx];
  }

  // Waveform: sine-heavy, with occasional texture.
  const waveRoll = h(nounId, 4);
  const waveform: OscillatorType =
    waveRoll < 0.55 ? 'sine' :
    waveRoll < 0.80 ? 'triangle' :
    waveRoll < 0.94 ? 'square' :
                       'sawtooth';

  // Decay — biased short, long tails for a few.
  const decay = 0.22 + Math.pow(h(nounId, 5), 1.6) * 0.8;

  // Brightness — 2nd/3rd harmonic mix. 0.10 is bell-pure, 0.5 is metallic.
  const brightness = 0.12 + h(nounId, 6) * 0.38;

  // Attack — 80% sharp, 20% softer.
  const attack = Math.pow(h(nounId, 7), 2.5) * 0.03;

  // Arpeggio gap.
  const secondDelay = 25 + Math.floor(h(nounId, 8) * 110);

  return { baseFreq, secondFreq, waveform, decay, brightness, attack, secondDelay };
}

// ---- Audio runtime -----------------------------------------------------

let audioCtx: AudioContext | null = null;
export function getAudioCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return null;
    audioCtx = new Ctx();
  } catch { audioCtx = null; }
  return audioCtx;
}

function playPartial(
  ctx: AudioContext,
  freq: number,
  gainPeak: number,
  decay: number,
  wave: OscillatorType,
  attack: number,
  brightness: number,
): void {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(gainPeak, now + 0.006 + attack);
  master.gain.exponentialRampToValueAtTime(0.001, now + decay);
  master.connect(ctx.destination);

  // Fundamental + 2 harmonic overtones — gives each voice body + timbre.
  const partials = [
    { mult: 1, gain: 0.60 },
    { mult: 2, gain: brightness },
    { mult: 3, gain: brightness * 0.35 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = freq * p.mult;
    const g = ctx.createGain();
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + decay + 0.06);
  }
}

/**
 * Play the unique voice for a Noun ID. Starts silent if the AudioContext
 * was suspended by browser autoplay rules; first user gesture resumes it.
 */
export function playNounVoice(nounId: number, volumePeak = 0.22): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const v = nounVoice(nounId);
  playPartial(ctx, v.baseFreq, volumePeak, v.decay, v.waveform, v.attack, v.brightness);
  if (v.secondFreq !== null) {
    const second = v.secondFreq;
    setTimeout(
      () => playPartial(ctx, second, volumePeak * 0.72, v.decay * 0.85, v.waveform, v.attack, v.brightness * 0.8),
      v.secondDelay,
    );
  }
}

/** Reaction toggle — bright G5 → C6 flick. */
export function playEmojiChime(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  playPartial(ctx, SCALE[8], 0.18, 0.28, 'sine', 0, 0.25);
  setTimeout(() => playPartial(ctx, SCALE[10], 0.15, 0.35, 'sine', 0, 0.25), 50);
}

/** Emoji picker selection — descending temple-bell feel. */
export function playEmojiAddChime(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  playPartial(ctx, SCALE[10], 0.22, 0.45, 'sine', 0, 0.3);
  setTimeout(() => playPartial(ctx, SCALE[7], 0.15, 0.55, 'sine', 0, 0.3), 70);
}

/**
 * Dispatcher — routes a ChimeKind to the right synth. Callers that just
 * want "play the sound for this event kind" use this; callers who know
 * they want a specific noun can call `playNounVoice` directly.
 */
export function playKind(kind: ChimeKind, seed = 0): void {
  switch (kind) {
    case 'profile': playNounVoice(seed); return;
    case 'emoji': playEmojiChime(); return;
    case 'emoji-add': playEmojiAddChime(); return;
    case 'drum':
      // Drum-room pages provide their own taiko synth; here's a soft
      // fallback so remote broadcasts from /drum still play back quietly
      // in other sections (e.g. someone on the homepage hears a distant
      // drum tap).
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      playPartial(ctx, 100, 0.18, 0.25, 'sine', 0, 0.15);
      return;
  }
}

// ---- Cross-client broadcast --------------------------------------------

/** LocalStorage keys shared with VisitLog + Drum Room. */
export const SESSION_KEY = 'pc:reactSessionId';
export const HEAR_OTHERS_KEY = 'pc:hearOthers';

export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto as any).randomUUID?.() ??
           `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function hearOthers(): boolean {
  try {
    const raw = localStorage.getItem(HEAR_OTHERS_KEY);
    return raw === null ? true : raw === '1';
  } catch { return true; }
}

let lastBroadcastAt = 0;
const MIN_BROADCAST_MS = 200;

/**
 * Fire-and-forget POST to /api/sounds so other visitors can hear it.
 * Throttled to ~5/sec per client to protect the KV backend. Returns
 * immediately — never awaits network.
 */
export function broadcastSound(kind: ChimeKind, seed = 0): void {
  const now = Date.now();
  if (now - lastBroadcastAt < MIN_BROADCAST_MS) return;
  lastBroadcastAt = now;
  const sessionId = getSessionId();
  fetch('/api/sounds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: kind, seed, sessionId }),
    keepalive: true,
  }).catch(() => { /* best-effort */ });
}

/** Play + broadcast in one call — the default for any user-driven chime. */
export function playAndBroadcast(kind: ChimeKind, seed = 0): void {
  playKind(kind, seed);
  broadcastSound(kind, seed);
}

// --- Module-level audio priming ---------------------------------------
// Browser autoplay policies keep AudioContext suspended until the user
// interacts with THIS page. Without priming, if Mike taps on his phone
// the event broadcasts to KV, the desktop's poll picks it up and calls
// `playKind(...)` — but the desktop's AudioContext hasn't been unlocked
// yet, so the drum plays to silence.
//
// Solution: as soon as ANYONE imports chimes.ts, attach one-time
// listeners for the first interaction events. First click / key / scroll
// / touch anywhere resumes the context, and every subsequent chime
// (local or remote-broadcast) plays audibly.
//
// Guarded by `typeof document` so SSR doesn't explode when this module
// is imported during Astro's build.
if (typeof document !== 'undefined') {
  const primeAudio = () => {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* best-effort */ });
    }
  };
  const primeEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
  for (const evt of primeEvents) {
    document.addEventListener(evt, primeAudio, { once: true, passive: true, capture: true });
  }
}

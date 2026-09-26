/**
 * The keyboard signal — one keyboard, many sources.
 *
 * Same source rules as the drum signal (see ./drum-signal.ts): a sender may
 * declare { kind, app, place }; otherwise it is inferred from Origin/Referer,
 * and only PointCast's own origin can call itself `pointcast`.
 *
 * A note is a MIDI number (60 = middle C). Surfaces that only know "a key
 * was pressed" send an unpitched `count` instead, never the key itself.
 */

export { resolveSource, requestCountry, signalSlug } from './drum-signal.ts';

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

// Krumhansl–Kessler key profiles, index 0 = tonic.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlate(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export interface KeyEstimate {
  tonic: string;
  mode: 'major' | 'minor';
  name: string;
  confidence: number;
  notes: number;
}

/**
 * Which key a pitch-class histogram sounds like (Krumhansl–Schmuckler).
 * Null until there are enough pitched notes to mean anything.
 */
export function estimateKey(pitchClasses: unknown, minNotes = 12): KeyEstimate | null {
  if (!Array.isArray(pitchClasses) || pitchClasses.length !== 12) return null;
  const hist = pitchClasses.map((v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0));
  const notes = hist.reduce((s, v) => s + v, 0);
  if (notes < minNotes) return null;
  let best: { tonic: number; mode: 'major' | 'minor'; r: number } = { tonic: 0, mode: 'major', r: -2 };
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = hist.map((_, i) => hist[(i + tonic) % 12]);
    const major = correlate(rotated, MAJOR);
    const minor = correlate(rotated, MINOR);
    if (major > best.r) best = { tonic, mode: 'major', r: major };
    if (minor > best.r) best = { tonic, mode: 'minor', r: minor };
  }
  const tonic = NOTE_NAMES[best.tonic];
  return { tonic, mode: best.mode, name: `${tonic} ${best.mode}`, confidence: Math.round(best.r * 100) / 100, notes };
}

/** "C4", "F#5" … for a MIDI number. */
export function noteName(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/**
 * Letters → notes, the same mapping /keyboard.js and the MCP tool use, so an
 * agent can "play a word". Letters walk a C major pentatonic across C4–A5
 * by alphabet position; digits sit below in C3–A4; everything else rests.
 */
const PENTATONIC = [0, 2, 4, 7, 9];
export function textToNotes(text: string, max = 64): number[] {
  const out: number[] = [];
  for (const ch of text.toLowerCase()) {
    if (out.length >= max) break;
    const code = ch.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      const i = code - 97;
      out.push(60 + (Math.floor(i / 5) % 2) * 12 + PENTATONIC[i % 5]);
    } else if (code >= 48 && code <= 57) {
      const i = code - 48;
      out.push(48 + Math.floor(i / 5) * 12 + PENTATONIC[i % 5]);
    }
  }
  return out;
}

/**
 * Local motif plans for the seven moods. Pure data: the harness turns a plan
 * into WebAudio nodes. Preview and (later) receiver motifs come from here.
 * No modem bytes are ever involved; a motif is not a transmission.
 *
 * Note: { f: Hz, t: start seconds, d: seconds, type?: 'sine'|'triangle'|'square'|'noise', g?: gain 0..1, bendTo?: Hz }
 */
export const MOTIF_MAX_SECONDS = 2.5;
export const STORM_GAIN_CAP = 0.5;

const seq = (freqs, step, d, type = 'sine', g = 0.6) => freqs.map((f, i) => ({ f, t: i * step, d, type, g }));

export const MOTIFS = Object.freeze({
  1: Object.freeze({ name: 'Calm',      notes: seq([523.25, 440, 349.23], 0.55, 0.7, 'sine', 0.5) }),            // slow falling 3-note sine
  2: Object.freeze({ name: 'Hype',      notes: seq([261.63, 329.63, 392, 523.25, 659.25], 0.11, 0.18, 'triangle', 0.6) }), // fast rising arpeggio
  3: Object.freeze({ name: 'Love',      notes: [...seq([659.25, 783.99], 0.22, 0.3, 'sine', 0.5), ...seq([659.25, 783.99], 0.22, 0.3, 'sine', 0.5).map(n => ({ ...n, t: n.t + 0.7 }))] }), // two-note chime, repeated
  4: Object.freeze({ name: 'Silly',     notes: [{ f: 300, t: 0, d: 0.9, type: 'square', g: 0.35, bendTo: 900 }, { f: 900, t: 0.9, d: 0.5, type: 'square', g: 0.35, bendTo: 250 }] }), // pitch-bend wobble
  5: Object.freeze({ name: 'Focus',     notes: [{ f: 110, t: 0, d: 1.4, type: 'sine', g: 0.6 }] }),               // single low tone
  6: Object.freeze({ name: 'Storm',     notes: [{ f: 0, t: 0, d: 1.6, type: 'noise', g: STORM_GAIN_CAP }] }),    // noise swell, capped
  7: Object.freeze({ name: 'Goodnight', notes: seq([523.25, 466.16, 392, 329.63], 0.4, 0.55, 'sine', 0.45) }),   // descending 4-note lullaby
});

export function motifPlan(moodId) {
  const m = MOTIFS[moodId];
  if (!m) throw new RangeError(`no motif for mood ${moodId}`);
  const seconds = Math.max(...m.notes.map(n => n.t + n.d));
  return { name: m.name, notes: m.notes, seconds };
}

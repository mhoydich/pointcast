/**
 * src/lib/violent-crimes-score.ts
 *
 * Noun-voice score for the ViolentCrimesBlock player — a Kanye "Violent
 * Crimes" structural tribute performed by 24 distinct Nouns (0-1199),
 * each mapped to their deterministic voice via chimes.ts `playNounVoice()`.
 *
 * Structure (48 beats @ 75 BPM ≈ 38.4s):
 *   • Intro        beats  0–7    (8 beats) — one-note piano-like phrases,
 *                                 ascending, each Noun held 2 beats.
 *   • Verse        beats  8–23  (16 beats) — ascending melody, eight
 *                                 half-beat notes per 4-beat phrase.
 *   • Chorus       beats 24–31   (8 beats) — four-note overlapping cluster
 *                                 (each note overlaps the next by 1 beat)
 *                                 that acts as the song's gravity well.
 *                                 Marked remixable via CHORUS_NOTE_INDICES.
 *   • Bridge       beats 32–39   (8 beats) — descending answer to the
 *                                 verse melody, sparser.
 *   • Outro        beats 40–47   (8 beats) — fading arpeggio, emphasis→0.
 *
 * Noun IDs are hand-picked across the full 0-1199 range so the scene hears
 * 24 visually + sonically distinct voices. No IPFS / no external data —
 * chimes.ts produces every note deterministically from the nounId.
 */

export interface Note {
  nounId: number;        // 0-1199, fed into playNounVoice()
  time: number;          // start beat (0-indexed float beats)
  duration: number;      // beats (can fractionally overlap with next note)
  emphasis?: number;     // 0..1 — scales playNounVoice volumePeak (default 0.65)
}

/** Indices into `score` that belong to the chorus cluster. Remix button
 *  rolls these Nouns from the full pool via seeded PRNG for per-listen
 *  variation without touching intro/verse/bridge/outro. */
export const CHORUS_NOTE_INDICES: number[] = [18, 19, 20, 21, 22, 23, 24, 25];

/** Target BPM — mirrored as a constant in ViolentCrimesBlock.astro for
 *  the on-screen "75 BPM" label. Change both together. */
export const TARGET_BPM = 75;

export const score: Note[] = [
  // ── INTRO · beats 0–7 · sparse piano-like, each Noun held 2 beats ─────
  { nounId:   12, time:  0, duration: 2.0, emphasis: 0.42 },
  { nounId:   45, time:  2, duration: 2.0, emphasis: 0.48 },
  { nounId:   88, time:  4, duration: 2.0, emphasis: 0.55 },
  { nounId:  120, time:  6, duration: 2.0, emphasis: 0.62 },

  // ── VERSE · beats 8–23 · ascending, half-beat notes in 4-beat phrases ──
  // Phrase A (8–11)
  { nounId:  210, time:  8.0, duration: 1.0, emphasis: 0.58 },
  { nounId:  255, time:  9.0, duration: 1.0, emphasis: 0.60 },
  { nounId:  301, time: 10.0, duration: 1.0, emphasis: 0.62 },
  { nounId:  350, time: 11.0, duration: 1.0, emphasis: 0.64 },
  // Phrase B (12–15) — same rhythm, lifted
  { nounId:  412, time: 12.0, duration: 1.0, emphasis: 0.64 },
  { nounId:  480, time: 13.0, duration: 1.0, emphasis: 0.66 },
  { nounId:  512, time: 14.0, duration: 1.0, emphasis: 0.68 },
  { nounId:  596, time: 15.0, duration: 1.0, emphasis: 0.72 },
  // Phrase C (16–19) — breath, pair of held notes before the chorus enters
  { nounId:  650, time: 16.0, duration: 2.0, emphasis: 0.72 },
  { nounId:  711, time: 18.0, duration: 2.0, emphasis: 0.78 },
  // Phrase D (20–23) — a pickup line into the chorus cluster
  { nounId:  756, time: 20.0, duration: 1.0, emphasis: 0.70 },
  { nounId:  802, time: 21.0, duration: 1.0, emphasis: 0.70 },
  { nounId:  850, time: 22.0, duration: 1.0, emphasis: 0.74 },
  { nounId:  900, time: 23.0, duration: 1.0, emphasis: 0.80 },

  // ── CHORUS · beats 24–31 · overlapping cluster — 4 voices x 2 hits ────
  // These 8 indices are the "remixable" notes. Each note overlaps the
  // next by 1 beat so the cluster rings.
  { nounId:  137, time: 24.0, duration: 4.0, emphasis: 0.92 }, // Mike's identity noun as anchor
  { nounId:  420, time: 25.0, duration: 4.0, emphasis: 0.88 },
  { nounId:  777, time: 26.0, duration: 4.0, emphasis: 0.95 },
  { nounId:  999, time: 27.0, duration: 4.0, emphasis: 0.90 },
  { nounId:  137, time: 28.0, duration: 3.0, emphasis: 0.88 }, // reprise for rhythmic weight
  { nounId:  420, time: 29.0, duration: 3.0, emphasis: 0.85 },
  { nounId:  777, time: 30.0, duration: 2.0, emphasis: 0.82 },
  { nounId:  999, time: 31.0, duration: 2.0, emphasis: 0.78 },

  // ── BRIDGE · beats 32–39 · descending, sparser than verse ─────────────
  { nounId:  950, time: 32.0, duration: 2.0, emphasis: 0.62 },
  { nounId: 1024, time: 34.0, duration: 2.0, emphasis: 0.58 },
  { nounId: 1080, time: 36.0, duration: 2.0, emphasis: 0.54 },
  { nounId: 1112, time: 38.0, duration: 2.0, emphasis: 0.50 },

  // ── OUTRO · beats 40–47 · arpeggio fade, emphasis tapers to near-zero ──
  { nounId: 1199, time: 40.0, duration: 1.5, emphasis: 0.46 },
  { nounId:  650, time: 41.5, duration: 1.5, emphasis: 0.38 },
  { nounId:  412, time: 43.0, duration: 1.5, emphasis: 0.30 },
  { nounId:  210, time: 44.5, duration: 1.5, emphasis: 0.22 },
  { nounId:   88, time: 46.0, duration: 2.0, emphasis: 0.14 },
];

/** Utility: distinct Noun IDs in the score, sorted ascending. Used by
 *  ViolentCrimesBlock to render the pixel-art "choir" legend. */
export function scoreNouns(src: Note[] = score): number[] {
  return [...new Set(src.map((n) => n.nounId))].sort((a, b) => a - b);
}

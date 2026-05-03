/**
 * spells.ts — magic words, the Peach 2016 way.
 *
 * Mike 2026-05-01: "research peach app, 90s i think, those type of
 * controls and then adding elements to pages in the footer bar, like
 * confetti, virtual pets, cats, pups, penguins, meditative,
 * directionally pleasant".
 *
 * Each spell is a typed word that, when cast, drops a small element
 * into a fixed-position overlay layer (`SpellLayer.astro`). Spells
 * fall into three kinds:
 *
 *   burst    — one-shot, cleans itself up after `durationMs`
 *   companion — small pixel-emoji creature that walks across screen
 *   ambient  — persistent surface (breath circle, candle, rain)
 *              that stays until dismissed via the spell tray's
 *              "clear all" button or pc:spell:clear event
 *
 * Render functions are inlined in SpellLayer.astro (vanilla JS,
 * no framework dependency, tiny JSON-serializable surface).
 *
 * Adding a spell = adding a row here + one case in the renderer
 * switch in SpellLayer.astro.
 */

export type SpellKind = 'burst' | 'companion' | 'ambient';

export interface Spell {
  /** Stable id used by `pc:spell:cast` and the omnibox `+id` syntax. */
  id: string;
  /** Display label in the CAST tray + omnibox preview. */
  label: string;
  /** One-line evocative blurb for the tray. */
  blurb: string;
  /** Glyph for the chip (emoji or single char). */
  glyph: string;
  /** burst | companion | ambient. */
  kind: SpellKind;
  /** Burst duration in ms; companions auto-dismiss after this; ambient ignores. */
  durationMs?: number;
  /** Hex used as the chip's accent. */
  accent: string;
}

export const SPELLS: Spell[] = [
  // ─── BURSTS ──────────────────────────────────────────────────
  {
    id: 'confetti',
    label: 'confetti',
    blurb: 'Pixel rectangles in the PC palette. Falls, drifts, fades.',
    glyph: '🎊',
    kind: 'burst',
    durationMs: 4500,
    accent: '#d4a437',
  },

  // ─── COMPANIONS ──────────────────────────────────────────────
  {
    id: 'cat',
    label: 'cat',
    blurb: 'A pixel cat walks across the bottom. Pauses to lick a paw.',
    glyph: '🐈',
    kind: 'companion',
    durationMs: 60_000,
    accent: '#8a2432',
  },
  {
    id: 'pup',
    label: 'pup',
    blurb: 'A bouncy puppy trots across the bottom, tail wagging.',
    glyph: '🐶',
    kind: 'companion',
    durationMs: 50_000,
    accent: '#c4952e',
  },
  {
    id: 'penguin',
    label: 'penguin',
    blurb: 'A penguin waddles across with a tidy side-to-side rock.',
    glyph: '🐧',
    kind: 'companion',
    durationMs: 70_000,
    accent: '#1b3a5b',
  },

  // ─── AMBIENT (persistent) ────────────────────────────────────
  {
    id: 'breath',
    label: 'breath',
    blurb: 'A soft circle expands and contracts. 4-7-8 breathing rhythm.',
    glyph: '🫧',
    kind: 'ambient',
    accent: '#4A9EFF',
  },
  {
    id: 'candle',
    label: 'candle',
    blurb: 'A small flickering candle in the corner. Stays lit until you snuff it.',
    glyph: '🕯',
    kind: 'ambient',
    accent: '#c4952e',
  },
  {
    id: 'rain',
    label: 'rain',
    blurb: 'Gentle pixel rain drifts down the page. Soft, patient.',
    glyph: '🌧',
    kind: 'ambient',
    accent: '#4A9EFF',
  },
  {
    id: 'starfield',
    label: 'starfield',
    blurb: 'Slow-twinkling stars drift in from the edges. Calming.',
    glyph: '✨',
    kind: 'ambient',
    accent: '#a78bfa',
  },
];

/** Lookup helper. */
export const SPELLS_BY_ID = Object.fromEntries(SPELLS.map((s) => [s.id, s]));

/** Spells exposed as kit-tray quick-actions (top 4 by order). */
export const SPELL_TRAY_ACTIONS = SPELLS.slice(0, 4).map((s) => ({
  id: s.id,
  label: s.label,
  glyph: s.glyph,
  hint: s.blurb,
}));

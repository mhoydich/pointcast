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

  // ─── BURSTS (continued) ──────────────────────────────────────
  {
    id: 'firework',
    label: 'firework',
    blurb: 'Three colorful bursts shoot outward. Good for any occasion.',
    glyph: '🎆',
    kind: 'burst',
    durationMs: 3500,
    accent: '#d4a437',
  },

  // ─── COMPANIONS (continued) ──────────────────────────────────
  {
    id: 'fish',
    label: 'fish',
    blurb: 'A fish glides past, unhurried. Gentle bob.',
    glyph: '🐟',
    kind: 'companion',
    durationMs: 45_000,
    accent: '#4A9EFF',
  },
  {
    id: 'moth',
    label: 'moth',
    blurb: 'A moth flutters mid-screen, drawn toward the light.',
    glyph: '🦋',
    kind: 'companion',
    durationMs: 55_000,
    accent: '#c4952e',
  },

  // ─── AMBIENT (continued) ─────────────────────────────────────
  {
    id: 'snow',
    label: 'snow',
    blurb: 'Soft snowflakes drift down. Quiet company.',
    glyph: '❄️',
    kind: 'ambient',
    accent: '#b8d4f0',
  },

  // ─── BURSTS (batch 4) ─────────────────────────────────────────
  {
    id: 'shout',
    label: 'shout',
    blurb: 'Punctuation bursts outward from center. Pure typographic energy.',
    glyph: '📣',
    kind: 'burst',
    durationMs: 2200,
    accent: '#8a2432',
  },
  {
    id: 'wave',
    label: 'wave',
    blurb: 'A wave of hands sweeps across the screen. Hello!',
    glyph: '👋',
    kind: 'burst',
    durationMs: 3000,
    accent: '#c4952e',
  },

  // ─── COMPANIONS (batch 4) ─────────────────────────────────────
  {
    id: 'firefly',
    label: 'firefly',
    blurb: 'A soft-glowing firefly drifts by, pulsing gold.',
    glyph: '🪲',
    kind: 'companion',
    durationMs: 40_000,
    accent: '#d4a437',
  },

  // ─── AMBIENT (batch 4) ────────────────────────────────────────
  {
    id: 'chimes',
    label: 'chimes',
    blurb: 'Wind chimes hang in the corner, swaying quietly.',
    glyph: '🎐',
    kind: 'ambient',
    accent: '#2f8f5f',
  },

  // ─── BURSTS (batch 5) ─────────────────────────────────────────
  {
    id: 'bloom',
    label: 'bloom',
    blurb: 'A garden erupts from center — flowers scatter outward in all directions.',
    glyph: '🌸',
    kind: 'burst',
    durationMs: 2800,
    accent: '#8a2432',
  },

  // ─── AMBIENT (batch 5) ────────────────────────────────────────
  {
    id: 'aurora',
    label: 'aurora',
    blurb: 'Northern lights ripple across the top of the viewport. Slow, shifting.',
    glyph: '🌌',
    kind: 'ambient',
    accent: '#2f8f5f',
  },

  // ─── IDENTITY (batch 5) ───────────────────────────────────────
  {
    id: 'here',
    label: 'here',
    blurb: 'You are here. A pulsing beacon in the center of the screen.',
    glyph: '📍',
    kind: 'ambient',
    accent: '#8a2432',
  },
  {
    id: 'mood',
    label: 'mood',
    blurb: 'A color-shifting orb that broadcasts the current vibe. No words needed.',
    glyph: '🎨',
    kind: 'ambient',
    accent: '#a78bfa',
  },

  // ─── BURSTS (batch 6) ─────────────────────────────────────────
  {
    id: 'bubble',
    label: 'bubble',
    blurb: 'Soap bubbles drift upward and quietly pop. Gentle, iridescent.',
    glyph: '🫧',
    kind: 'burst',
    durationMs: 3200,
    accent: '#4A9EFF',
  },
  {
    id: 'dice',
    label: 'dice',
    blurb: 'Six dice tumble outward from center. Roll the vibe.',
    glyph: '🎲',
    kind: 'burst',
    durationMs: 2500,
    accent: '#2f8f5f',
  },

  // ─── COMPANIONS (batch 6) ─────────────────────────────────────
  {
    id: 'bee',
    label: 'bee',
    blurb: 'A bee zigzags across the screen, busy with invisible business.',
    glyph: '🐝',
    kind: 'companion',
    durationMs: 35_000,
    accent: '#d4a437',
  },

  // ─── AMBIENT (batch 6) ────────────────────────────────────────
  {
    id: 'fog',
    label: 'fog',
    blurb: 'Low mist rolls across the bottom of the viewport. Quiet and cool.',
    glyph: '🌫️',
    kind: 'ambient',
    accent: '#b8d4f0',
  },

  // ─── BURSTS (batch 7) ─────────────────────────────────────────
  {
    id: 'balloon',
    label: 'balloon',
    blurb: 'Colorful balloons float up from the bottom, drifting apart as they rise.',
    glyph: '🎈',
    kind: 'burst',
    durationMs: 4200,
    accent: '#8a2432',
  },

  // ─── COMPANIONS (batch 7) ─────────────────────────────────────
  {
    id: 'turtle',
    label: 'turtle',
    blurb: 'The slowest companion. A turtle ambles across, unbothered, without urgency.',
    glyph: '🐢',
    kind: 'companion',
    durationMs: 90_000,
    accent: '#2f8f5f',
  },
  {
    id: 'ghost',
    label: 'ghost',
    blurb: 'A friendly ghost drifts by mid-screen, oscillating gently. Hello there.',
    glyph: '👻',
    kind: 'companion',
    durationMs: 50_000,
    accent: '#a78bfa',
  },

  // ─── AMBIENT (batch 7) ────────────────────────────────────────
  {
    id: 'campfire',
    label: 'campfire',
    blurb: 'A warm campfire crackles in the corner. Cozier than a candle.',
    glyph: '🔥',
    kind: 'ambient',
    accent: '#c4952e',
  },

  // ─── BURSTS (batch 8) ─────────────────────────────────────────
  {
    id: 'spark',
    label: 'spark',
    blurb: 'Electric sparks scatter outward from a point. Sharp, quick, bright.',
    glyph: '⚡',
    kind: 'burst',
    durationMs: 2000,
    accent: '#fdf2d6',
  },

  // ─── COMPANIONS (batch 8) ─────────────────────────────────────
  {
    id: 'frog',
    label: 'frog',
    blurb: 'A frog hops across the bottom in lazy arcs. No hurry at all.',
    glyph: '🐸',
    kind: 'companion',
    durationMs: 35_000,
    accent: '#2f8f5f',
  },

  // ─── AMBIENT (batch 8) ────────────────────────────────────────
  {
    id: 'leaves',
    label: 'leaves',
    blurb: 'Autumn leaves spin and drift down. A seasonal tumble.',
    glyph: '🍂',
    kind: 'ambient',
    accent: '#c4952e',
  },
  {
    id: 'lantern',
    label: 'lantern',
    blurb: 'A paper lantern glows in the top corner. Warm and quiet company.',
    glyph: '🏮',
    kind: 'ambient',
    accent: '#8a2432',
  },

  // ─── NOUNS (batch 12) ─────────────────────────────────────────
  // CC0 Nouns IP — SVGs pulled live from noun.pics for any seed
  // 0–1199 (matches the Visit Nouns FA2 collection on Tezos).
  {
    id: 'noun',
    label: 'noun',
    blurb: 'A random Noun walks across the bottom. Click to send home.',
    glyph: '🟥',
    kind: 'companion',
    durationMs: 60_000,
    accent: '#d63c5e',
  },
  {
    id: 'noggles',
    label: 'noggles',
    blurb: 'A wave of pixel noggles drifts across — the signature glasses.',
    glyph: '👓',
    kind: 'burst',
    durationMs: 5500,
    accent: '#1f1d29',
  },
  {
    id: 'proliferate',
    label: 'proliferate',
    blurb: 'Twelve mini Nouns scatter outward — proliferation in pixel form.',
    glyph: '✨',
    kind: 'burst',
    durationMs: 4200,
    accent: '#d63c5e',
  },
  {
    id: 'lilnoun',
    label: 'lilnoun',
    blurb: 'A tiny Noun bounces across the bottom. Lil. Energetic.',
    glyph: '🟢',
    kind: 'companion',
    durationMs: 45_000,
    accent: '#5b6ea8',
  },

  // ─── COMPANIONS (batch 13) ────────────────────────────────────
  {
    id: 'ladybug',
    label: 'ladybug',
    blurb: 'A ladybug marches across the bottom. Tiny, determined, cheerful.',
    glyph: '🐞',
    kind: 'companion',
    durationMs: 42_000,
    accent: '#8a2432',
  },

  // ─── AMBIENT (batch 13) ───────────────────────────────────────
  {
    id: 'rainbow',
    label: 'rainbow',
    blurb: 'A soft arc of color at the top of the screen. Good omen.',
    glyph: '🌈',
    kind: 'ambient',
    accent: '#4A9EFF',
  },
  {
    id: 'vinyl',
    label: 'vinyl',
    blurb: 'A spinning record in the corner. Lo-fi company.',
    glyph: '⏺',
    kind: 'ambient',
    accent: '#1b3a5b',
  },

  // ─── BURSTS (batch 13) ────────────────────────────────────────
  {
    id: 'gems',
    label: 'gems',
    blurb: 'Gemstones scatter outward from center. Briefly dazzling.',
    glyph: '💎',
    kind: 'burst',
    durationMs: 2800,
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

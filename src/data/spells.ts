/**
 * spells.ts — magic words, the Peach 2016 way.
 *
 * Mike 2026-05-01: "research peach app, 90s i think, those type of
 * controls and then adding elements to pages in the footer bar, like
 * little components you can add to a page"
 *
 * Every entry here maps to a Peach-style "spell" the viewer can cast.
 * SpellLayer.astro picks these up at build time and renders the CSS/HTML
 * needed for each spell, then the kit-tray UI lets the viewer toggle them.
 *
 * Anatomy of a spell:
 *   id       — kebab-case, used as CSS class prefix + localStorage key
 *   label    — short display name shown in the kit tray
 *   glyph    — single emoji shown as the tray button icon
 *   blurb    — one-sentence tooltip / aria-label
 *   kind     — 'ambient' | 'companion' | 'burst' | 'overlay'
 *   duration — total animation cycle length (ms); 0 = CSS-only / static
 *
 * Implementation notes live in SpellLayer.astro.
 */

export interface Spell {
  id: string;
  label: string;
  glyph: string;
  blurb: string;
  kind: 'ambient' | 'companion' | 'burst' | 'overlay';
  /** Animation cycle ms. 0 = static / CSS-only. */
  duration: number;
}

export const SPELLS: Spell[] = [
  // ── Companions ──────────────────────────────────────────────────────────
  {
    id: 'pup',
    label: 'Pup',
    glyph: '🐶',
    blurb: 'A small dog trots across the screen.',
    kind: 'companion',
    duration: 48000,
  },
  {
    id: 'cat',
    label: 'Cat',
    glyph: '🐱',
    blurb: 'A cat slinks along the bottom of the screen.',
    kind: 'companion',
    duration: 52000,
  },
  {
    id: 'rabbit',
    label: 'Rabbit',
    glyph: '🐰',
    blurb: 'A rabbit hops energetically across the screen.',
    kind: 'companion',
    duration: 42000,
  },
  {
    id: 'fox',
    label: 'Fox',
    glyph: '🦊',
    blurb: 'A fox trots confidently across the screen.',
    kind: 'companion',
    duration: 45000,
  },
  {
    id: 'noun',
    label: 'Noun',
    glyph: '⬛',
    blurb: 'A Noun glasses-head bobs across the viewport.',
    kind: 'companion',
    duration: 55000,
  },
  {
    id: 'lilnoun',
    label: 'Lil Noun',
    glyph: '🟦',
    blurb: 'A tiny Noun bounces along the bottom of the page.',
    kind: 'companion',
    duration: 38000,
  },

  // ── Ambient ──────────────────────────────────────────────────────────────
  {
    id: 'starfield',
    label: 'Starfield',
    glyph: '✨',
    blurb: 'Twinkling stars drift across the background.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'clouds',
    label: 'Clouds',
    glyph: '☁️',
    blurb: 'Fluffy clouds drift across the sky.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'rain',
    label: 'Rain',
    glyph: '🌧️',
    blurb: 'Gentle rain falls across the screen.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'fireflies',
    label: 'Fireflies',
    glyph: '🪲',
    blurb: 'Fireflies drift and blink in the darkness.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'leaves',
    label: 'Leaves',
    glyph: '🍃',
    blurb: 'Autumn leaves drift and tumble across the screen.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'snow',
    label: 'Snow',
    glyph: '❄️',
    blurb: 'Snowflakes drift gently downward.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'bubbles',
    label: 'Bubbles',
    glyph: '🫧',
    blurb: 'Bubbles float upward and pop.',
    kind: 'ambient',
    duration: 0,
  },
  {
    id: 'petals',
    label: 'Petals',
    glyph: '🌸',
    blurb: 'Cherry blossom petals drift across the screen.',
    kind: 'ambient',
    duration: 0,
  },

  // ── Bursts ───────────────────────────────────────────────────────────────
  {
    id: 'confetti',
    label: 'Confetti',
    glyph: '🎊',
    blurb: 'A burst of confetti rains down.',
    kind: 'burst',
    duration: 3000,
  },
  {
    id: 'fireworks',
    label: 'Fireworks',
    glyph: '🎆',
    blurb: 'Fireworks explode across the screen.',
    kind: 'burst',
    duration: 3500,
  },
  {
    id: 'hearts',
    label: 'Hearts',
    glyph: '❤️',
    blurb: 'Hearts burst from the center of the screen.',
    kind: 'burst',
    duration: 2500,
  },
  {
    id: 'rings',
    label: 'Rings',
    glyph: '💍',
    blurb: 'Concentric rings expand outward from the center.',
    kind: 'burst',
    duration: 2400,
  },
  {
    id: 'sparkle',
    label: 'Sparkle',
    glyph: '💫',
    blurb: 'Sparkles scatter across the screen.',
    kind: 'burst',
    duration: 2000,
  },
  {
    id: 'boom',
    label: 'Boom',
    glyph: '💥',
    blurb: 'An explosion radiates outward.',
    kind: 'burst',
    duration: 1800,
  },

  // ── Overlays ─────────────────────────────────────────────────────────────
  {
    id: 'vhs',
    label: 'VHS',
    glyph: '📼',
    blurb: 'CRT scanlines and VHS tracking artifacts.',
    kind: 'overlay',
    duration: 0,
  },
  {
    id: 'matrix',
    label: 'Matrix',
    glyph: '🟩',
    blurb: 'Green digital rain cascades down the screen.',
    kind: 'overlay',
    duration: 0,
  },
  {
    id: 'retro',
    label: 'Retro',
    glyph: '🕹️',
    blurb: 'A pixelated retro-computing color palette.',
    kind: 'overlay',
    duration: 0,
  },
  {
    id: 'noggles',
    label: 'Noggles',
    glyph: '🕶️',
    blurb: 'Noggles glasses float across the viewport.',
    kind: 'overlay',
    duration: 0,
  },
  {
    id: 'proliferate',
    label: 'Proliferate',
    glyph: '⬛',
    blurb: 'Nouns proliferate across the entire screen.',
    kind: 'overlay',
    duration: 0,
  },
];

/** Look up a spell by id. Returns undefined if not found. */
export function getSpell(id: string): Spell | undefined {
  return SPELLS.find((s) => s.id === id);
}

/** All companion spells, in order. */
export const COMPANION_SPELLS = SPELLS.filter((s) => s.kind === 'companion');

/** All ambient spells, in order. */
export const AMBIENT_SPELLS = SPELLS.filter((s) => s.kind === 'ambient');

/** All burst spells, in order. */
export const BURST_SPELLS = SPELLS.filter((s) => s.kind === 'burst');

/** All overlay spells, in order. */
export const OVERLAY_SPELLS = SPELLS.filter((s) => s.kind === 'overlay');

/** Spells exposed as kit-tray quick-actions (top 4 by order). */
export const SPELL_TRAY_ACTIONS = SPELLS.slice(0, 4).map((s) => ({
  id: s.id,
  label: s.label,
  glyph: s.glyph,
  hint: s.blurb,
}));

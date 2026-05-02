/**
 * mood-spells.ts — wire moods to ambient spells.
 *
 * Mike 2026-05-02 sprint: "the dock becomes a room dial". Picking a
 * mood already plays a soundtrack (ears); now it also casts a
 * thematically-matched spell (eyes). Three already-shipped systems
 * compose: mood selector + soundtrack catalog + spell catalog.
 *
 * Usage:
 *   import { MOOD_SPELLS } from '../data/mood-spells';
 *   const spellId = MOOD_SPELLS[moodId];
 *   if (spellId) window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId } }));
 *
 * Decoupled from spells.ts and SpellLayer.astro on purpose: this
 * module only emits string ids. If SpellLayer isn't mounted (e.g.
 * BaseLayout pages that haven't migrated to FooterBar yet), the
 * dispatch is a silent no-op.
 *
 * Mappings target spells that ship in PRs #305 + #310 (the first
 * two batches): confetti, cat, breath, candle, rain, starfield.
 * Later batches (firework, snow, aurora, etc.) are great future
 * additions — extend this file as the catalog grows.
 *
 * Design rules:
 *   - quiet/contemplative moods → breath or candle
 *   - active/celebratory moods → confetti
 *   - night/long-haul moods → starfield
 *   - moisture/LA-coastal moods → rain
 *   - playful low-stakes moods → cat
 */

export const MOOD_SPELLS: Record<string, string> = {
  // Coastal / weather
  'marine-layer': 'rain',
  'rainy-week':   'rain',

  // Working modes
  'building':           'breath',
  'quiet-coordination': 'breath',
  'ready-when-mike-is': 'breath',

  // Celebratory / energetic
  'sprint-pulse':    'confetti',
  'shipping':        'confetti',
  'pre-shop-ritual': 'confetti',

  // Long-haul / night
  'overnight-ship':  'starfield',
  'shelf-ready':     'starfield',
  'good-feels':      'starfield',
  'morning':         'starfield',

  // Vigil / cozy
  'late-night-calm': 'candle',
  'pending-mint':    'candle',

  // Playful / low-stakes
  'quiet-play':      'cat',
};

/** Spell ids referenced by this mapping — useful for the binder UI. */
export const MOOD_SPELL_IDS = Array.from(new Set(Object.values(MOOD_SPELLS)));

/**
 * localStorage key for the auto-cast preference. '1' = on (default),
 * '0' = off. Operator command `>autocast on/off` flips this.
 */
export const AUTO_CAST_KEY = 'pc:dock:auto-cast';

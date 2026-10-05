/**
 * The marine-layer constants and the words printed next to the chart.
 * No imports: Sky Calls and the node tests can share this file without
 * pulling in the astronomical math in sky.ts.
 *
 * burnoff.ts re-exports these. Change the rule here, not in a copy.
 */

/** A deck above this is weather, not the marine layer. Feet above ground. */
export const DECK_CEILING_FT = 3000;

/** How long the sky has to stay open before we believe it. */
export const HOLD_MINUTES = 120;

/** Covers that make a ceiling. Mirrors scripts/fetch-burnoff.mjs exactly. */
export const DECK_COVERS = ['BKN', 'OVC', 'VV'];

/** The definition, in words, printed next to the chart so you can argue with it. */
export const BURN_OFF_DEFINITION = [
  `Under the layer means a broken or overcast deck — or an indefinite ceiling, which is fog on the ground — below ${DECK_CEILING_FT.toLocaleString()} feet. Few and scattered do not count. You can see sky through them.`,
  'The lowest deck is often reported in the second or third layer, not the first, so each cover is paired with its own height by index and the lowest one wins.',
  `The sky opened at the first hourly report after sunrise with no such deck, where every report in the following ${HOLD_MINUTES / 60} hours is also free of it.`,
  'A day with no deck anywhere around sunrise has no layer to burn off. It is not a fast morning. It is a different kind of morning.',
  'If the sky clears in the last hour we watch and nothing follows to confirm it, the day reads as never opened. We do not claim what we could not watch.',
];

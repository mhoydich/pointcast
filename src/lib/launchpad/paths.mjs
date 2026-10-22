/**
 * URL paths for the launchpad's coin images, kept apart from coin-art.mjs so
 * the browser board can link them without bundling the Noun art data.
 */
export const COIN_BASE = '/case-studies/launchpad/coins';
export const PREVIEW_BASE = '/case-studies/launchpad/nouns';

export const coinSlug = (scenarioId, symbol) => `${scenarioId}-${symbol.toLowerCase()}`;
/** A scenario coin's portrait, built at build time. */
export const coinPath = (scenarioId, symbol) => `${COIN_BASE}/${coinSlug(scenarioId, symbol)}.svg`;
/** The coin face for a Noun before it has a symbol (Create preview, viewer-launched coins). */
export const previewPath = (nounId) => `${PREVIEW_BASE}/${nounId}.svg`;

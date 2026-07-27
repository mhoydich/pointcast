/**
 * Known live Visit Noun tokens.
 *
 * TzKT remains the freshness source during builds, but static route generation
 * must not collapse when its public API is unavailable or rate-limited.
 */
export const KNOWN_VISIT_TOKEN_IDS = [
  '1',
  '42',
  '88',
  '99',
  '137',
  '174',
  '205',
  '247',
  '417',
  '420',
  '557',
  '777',
  '808',
  '945',
  '1020',
  '1086',
  '1111',
] as const;

/**
 * Nouns semantic picker.
 *
 * Shared by scripts/claude-visit.mjs (CLI) and any future runtime callers.
 * Given an optional read slug, picks a noun ID from a themed pool; otherwise
 * returns one from the default curated set.
 *
 * Curated IDs are swappable — expand/retune pools as the taste sharpens.
 */

const SEMANTIC_POOLS = {
  pickleball:   [925, 1178, 1453],
  ai:           [387, 1014, 1389],
  coordination: [1111, 164, 1334],
  cannabis:     [869, 1232, 236],
  creative:     [1390, 1113, 1448],
  broadcast:    [77, 512, 1203],
  // default pool pulls one from each theme
  default:      [387, 925, 1111, 1178, 1389, 869, 1232, 1334, 1390, 1014, 77],
};

const SLUG_PATTERNS = [
  [/pickleball/i,                    'pickleball'],
  [/ai|agent|front.?door|claude/i,   'ai'],
  [/mesh|coordination|network/i,     'coordination'],
  [/cannabis|good.?feels|hemp/i,     'cannabis'],
  [/art|design|midjourney|ideogram/i,'creative'],
  [/broadcast|dispatch|signal|zine/i,'broadcast'],
];

/**
 * @param {{ readSlug?: string }} opts
 * @returns {number}
 */
export function pickNoun(opts = {}) {
  const { readSlug } = opts;
  let pool = SEMANTIC_POOLS.default;

  if (readSlug) {
    for (const [pattern, key] of SLUG_PATTERNS) {
      if (pattern.test(readSlug)) {
        pool = SEMANTIC_POOLS[key];
        break;
      }
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

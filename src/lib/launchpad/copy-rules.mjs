/**
 * Copy rules for launchpad text (plan §2.4): the house "Never use" list, the
 * offer and chain words, and the item 6 checks (Nouns Money serials,
 * "$NOUNS", "official", the Nouns treasury, and real units). Viewer text, such
 * as a coin's name and symbol, is refused on any hit before it is used.
 */
import { scanText } from '../nouns-money/honest-copy.mjs';

/** Currency Builder offer words and the chain words, plus regex-dodging variants. */
export const OFFER_WORDS = /\b(invest\w*|shares?|backed|redeemable|returns?|profit\w*|yield\w*|guaranteed|worth|main\s*net|cash(?:es|ing)? out)\b/i;
/** Nouns Money serials and endorsement words a coin must never carry. */
export const NOUNS_MARKS = /\bNM27-|\bnm100-|\$NOUNS|\bofficial\b|\bNouns treasury\b/i;
/** Real units: never a unit in Stage A. Page copy is checked for amounts in them; viewer text for the words at all. */
export const UNIT_WORDS = /\b(?:SOL|USDC|tez|BOT|ATTN)\b/;
export const UNIT_AMOUNTS = /\d[\d,.]*\s*(?:SOL|USDC|tez|BOT|ATTN)\b|\b(?:SOL|USDC|tez|BOT|ATTN)\s*\d/;

/**
 * Every problem in `text`, after the exact `approved` strings are cut out.
 * `viewer: true` applies the stricter unit rule used for viewer text.
 */
export function copyProblems(text, { approved = [], viewer = false } = {}) {
  let hay = String(text);
  for (const line of approved) hay = hay.split(line).join(' ');
  const problems = scanText(hay, { approved: [] }).map((h) => `${h.id}: "${h.match}"`);
  for (const [label, re] of [['offer word', OFFER_WORDS], ['Nouns mark', NOUNS_MARKS], ['unit', viewer ? UNIT_WORDS : UNIT_AMOUNTS]]) {
    const m = hay.match(re);
    if (m) problems.push(`${label}: "${m[0]}"`);
  }
  return problems;
}

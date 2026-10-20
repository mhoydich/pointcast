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
 * Latin look-alikes from other scripts, for a second scan of the same text: a
 * small subset of Unicode's confusables (UTS #39) whose target is a plain
 * letter or "$". Cyrillic, Greek and Cherokee letters, small capitals,
 * negative circled and squared letters, and the heavy dollar sign.
 */
const LOOK_ALIKES = new Map([
  ...pairs('АAВBЕEЅSІIЈJКKМMНHОOРPСCТTХXУYҮYԚQԜWаaеeоoрpсcуyхxѕsіiјjԁdԛqԝwһhӏl'),
  ...pairs('ΑAΒBΕEΖZΗHΙIΚKΜMΝNΟOΡPΤTΥYΧXοoνvρpιiκkαaυu'),
  ...pairs('ᎪAᏴBᏟCᎠDᎬEᏀGᎻHᎫJᏦKᏞLᎷMᏢPᏒRᏚSᎢTᏙVᏔWᏃZ'),
  ...pairs('ᴀAʙBᴄCᴅDᴇEꜰFɢGʜHɪIᴊJᴋKʟLᴍMɴNᴏOᴘPǫQʀRꜱSᴛTᴜUᴠVᴡWʏYᴢZ'),
  ...Array.from({ length: 26 }, (_, i) => [String.fromCodePoint(0x1f150 + i), String.fromCharCode(65 + i)]),
  ...Array.from({ length: 26 }, (_, i) => [String.fromCodePoint(0x1f170 + i), String.fromCharCode(65 + i)]),
  ['\u{1f4b2}', '$'],
]);
function pairs(s) {
  const cs = [...s];
  return cs.flatMap((c, i) => (i % 2 ? [] : [[c, cs[i + 1]]]));
}

/**
 * Every problem in `text`, after the exact `approved` strings are cut out.
 * The rest is scanned as it reads: NFKC folds fullwidth and compatibility
 * letters, invisible characters (zero-width, bidi, soft hyphen, variation
 * selectors, fillers) are dropped, and every run of spaces, blanks, control
 * characters and underscores reads as one space, so none of them can hide a
 * word. Text with look-alike letters is scanned a second time as it looks.
 * `viewer: true` applies the stricter unit rule used for viewer text.
 */
export function copyProblems(text, { approved = [], viewer = false } = {}) {
  let hay = String(text);
  for (const line of approved) hay = hay.split(line).join(' ');
  hay = hay.normalize('NFKC').replace(/[\p{Cf}\p{Default_Ignorable_Code_Point}]/gu, '').replace(/[\p{Cc}\p{Z}_\u2800\u{1d159}]+/gu, ' ');
  const looks = [...hay].map((c) => LOOK_ALIKES.get(c) ?? c).join('');
  const problems = [];
  for (const h of looks === hay ? [hay] : [hay, looks]) {
    problems.push(...scanText(h, { approved: [] }).map((x) => `${x.id}: "${x.match}"`));
    for (const [label, re] of [['offer word', OFFER_WORDS], ['Nouns mark', NOUNS_MARKS], ['unit', viewer ? UNIT_WORDS : UNIT_AMOUNTS]]) {
      const m = h.match(re);
      if (m) problems.push(`${label}: "${m[0]}"`);
    }
  }
  return [...new Set(problems)];
}

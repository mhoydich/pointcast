// kind-words.js: a small, best-effort word list for the Channels page (/chain/channels).
//
// The devnet's own word filter reads the body of a post when it is stored, and nothing else: not a
// station's name, not a post's title (docs/DEVNET.md; the Worker's signedDoor). This page keeps its
// own short list for the two things the devnet does not read, so that (1) the page will not seal a
// station name or a post title that matches it, and (2) the page shows a name or a title from the
// devnet that matches it as "held back" instead of as written. The chain still holds the real
// text; this is the page's rule, not the chain's, and it is best-effort: expect a miss and the odd
// harmless name held back.
//
// The terms are the same list as the first-mints page's handle filter
// (public/chain/first-mints/index.html), kept in ROT13 so this source stays clean; the test suite
// compares the two lists so they cannot drift. The rule differs from the handle filter's in three
// ways, because a title is a sentence, not a handle: letters spelled out one at a time are joined
// only when they run on for three or more; a token that is only digits is never read as leet speak
// (a block height is a number); and the handle filter's rule about one numeral is left out, for the
// same reason.

/** Substrings: any word that contains one of these (letters repeated or not) is held back. */
export const BLOCK_SUB = ["shpx","fuvg","phag","avtt","sntt","xvxr","ergneq","juber","ovgpu","chffl","nffubyr","zbgures","gjng","genaal","jrgonpx","enturnq","ornare","puvax","fyhg","wvmm","cbea","obyybpx","qvyqb"];
/** Whole words: a word that is exactly one of these (with repeats, and a plural s) is held back. */
export const BLOCK_TOK = ["nff","pbpx","qvpx","gvg","gvgf","fcvp","pbba","snt","qlxr","tbbx","cnxv","encr","anmv","urvy","phz","cevpx","ubzb","xxx","cvff","onfgneq","ubr","arteb","wnc","xlxr","fxnax","gneq","jnax"];

const rot13 = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '!': 'i', '@': 'a', $: 's' };
const stretch = (w) => w.split('').map((c) => c + '+').join('');
const SUB_RE = BLOCK_SUB.map(rot13).map((w) => new RegExp(stretch(w)));
const TOK_RE = BLOCK_TOK.map(rot13).map((w) => new RegExp('^' + stretch(w) + 's*$'));

/** The shown text of a name or title that is held back. */
export const HELD_BACK = '[held back by this page’s word list]';

/** Is this text on the list? Case, accents of the common leet kind, repeated letters and spaced-out letters do not hide a term. */
export function isBlocked(raw) {
  const low = String(raw === undefined || raw === null ? '' : raw).toLowerCase();
  const tokens = low.split(/[\s_]+/).filter(Boolean);
  const words = [];
  for (const t of tokens) {
    // leet speak is read only in a token that has a letter in it: a plain number is a number
    const spelled = /[a-z]/.test(t) ? t.split('').map((c) => LEET[c] || c).join('') : t;
    const w = spelled.replace(/[^a-z]/g, '');
    if (w) words.push(w);
  }
  // letters spelled out one at a time, three or more in a row, are one word
  const pool = [...words];
  for (let i = 0; i < words.length; i++) {
    let j = i;
    while (j < words.length && words[j].length === 1) j++;
    if (j - i >= 3) { pool.push(words.slice(i, j).join('')); i = j - 1; }
  }
  if (pool.some((w) => SUB_RE.some((re) => re.test(w)))) return true;
  return words.some((w) => TOK_RE.some((re) => re.test(w)));
}

/** The text as the page shows it: itself, or HELD_BACK. */
export const shownText = (text) => (isBlocked(text) ? HELD_BACK : text);

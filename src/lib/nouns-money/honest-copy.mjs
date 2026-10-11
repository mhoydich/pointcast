// The "Never use" list for Nouns Money copy (nouns-money-final plan §6),
// as a scanner. Pure module: no fs, no DOM, so the Astro build and the node
// tests run the same rules.
//
//   scanText(text)        → [{ id, group, match, index }]  (approved lines removed first)
//   extractCopy(src, ext) → the visible copy of a source file: string literals,
//                           template text, alt/title/aria-label values, JSON
//                           strings. Style blocks, comments and single-token
//                           identifiers (paths, URLs, selectors) are skipped.
//
// The approved lines (NM_APPROVED_LINES) are cut out before scanning, so the
// standard line may say "$NOUNS" and "redemption" and the replacement line
// may say "balance": nothing else may.
import { NM_APPROVED_LINES } from './chain-copy.mjs';

/** [id, group, RegExp]. Word-bounded, case-insensitive unless the unit is a symbol. */
export const BANNED = Object.freeze([
  // money units
  ['dollar-amount', 'money units', /\$\s?\d/g],
  ['dollar-ticker', 'money units', /\$[A-Z]{2,}\b/g],
  ['usd', 'money units', /\bUSD\b/gi],
  ['cents', 'money units', /\bcents?\b/gi],
  ['dollars', 'money units', /\bdollars?\b/gi],
  ['legal-tender', 'money units', /\blegal tender\b/gi],
  // printing
  ['print', 'printing', /\bprint(?:s|ed|ing|er|ers)?\b/gi],
  ['mint-money', 'printing', /\bmint(?:ing)? money\b/gi],
  // banking
  ['backed', 'banking', /\bback(?:ed|ing)\b/gi],
  ['reserve', 'banking', /\breserves?\b/gi],
  ['peg', 'banking', /\bpeg(?:s|ged|ging)?\b/gi],
  ['stake', 'banking', /\bstak(?:e|es|ed|ing)\b/gi],
  ['redeem', 'banking', /\bredeem(?:s|ed|ing|able)?\b|\bredemptions?\b/gi],
  ['cash-out', 'banking', /\bcash(?:ing)? out\b/gi],
  ['convert', 'banking', /\bconvert(?:s|ed|ing|ible)?\b/gi],
  ['bank', 'banking', /\bbank(?:s|ing|er|ers)?\b/gi],
  ['deposit', 'banking', /\bdeposit(?:s|ed|ing)?\b/gi],
  ['balance', 'banking', /\bbalances?\b/gi],
  // investment
  ['invest', 'investment', /\binvest(?:s|ed|ing|ment|ments|or|ors)?\b/gi],
  ['appreciate', 'investment', /\bappreciat(?:e|es|ed|ing|ion)\b/gi],
  ['floor', 'investment', /\bfloor\b/gi],
  ['early-holders', 'investment', /\bearly holders?\b/gi],
  ['airdrop', 'investment', /\bairdrops?\b/gi],
  ['allocation', 'investment', /\ballocations?\b/gi],
  ['allowlist', 'investment', /\ballow-?lists?\b/gi],
  // spending
  ['pay-with', 'spending', /\bpay with\b/gi],
  ['spend', 'spending', /\bspend(?:s|ing)?\b/gi],
  ['tip', 'spending', /\btip(?:s|ped|ping)?\b/gi],
  ['accepted-at', 'spending', /\baccepted at\b/gi],
  ['merchant', 'spending', /\bmerchants?\b/gi],
  // hype
  ['a-billion', 'hype', /\ba billion\b/gi],
  ['pump', 'hype', /\bpump(?:s|ed|ing)?\b/gi],
  ['dex-screener', 'hype', /\bdex ?screener\b/gi],
  // endorsement
  ['official-nouns', 'endorsement', /\bofficial nouns\b/gi],
  ['dao-backed', 'endorsement', /\bdao-backed\b/gi],
  ['endorsed', 'endorsement', /\bendorsed\b/gi],
  // evasive wordplay
  ['no-transfer-of-value', 'evasive', /\bno transfer of value\b/gi],
]);

/** Cut the approved lines out of `text` (exact, and with HTML-escaped apostrophes). */
export function stripApproved(text, approved = NM_APPROVED_LINES) {
  let out = String(text);
  for (const line of approved) out = out.split(line).join(' ');
  return out;
}

/** Banned matches in plain text, after the approved lines are removed. */
export function scanText(text, { approved = NM_APPROVED_LINES } = {}) {
  const hay = stripApproved(text, approved);
  const hits = [];
  for (const [id, group, re] of BANNED) {
    re.lastIndex = 0;
    for (const m of hay.matchAll(re)) hits.push({ id, group, match: m[0], index: m.index });
  }
  return hits.sort((a, b) => a.index - b.index || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------- copy extraction

/** A single token with path/URL/selector punctuation and no spaces: code, not copy. */
const isIdentifierLike = (s) => !/\s/.test(s) && /[-/#.:_=?&@]/.test(s);

const stripComments = (code) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\'"`])\/\/[^\n]*/g, '$1 ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

/** String literals in JS/TS: '…', "…", and the static parts of `…${…}…`. */
export function stringLiterals(code) {
  const out = [];
  const src = stripComments(code);
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  for (const m of src.matchAll(re)) {
    let s = m[1] ?? m[2] ?? m[3] ?? '';
    if (m[3] !== undefined) s = s.replace(/\$\{[^}]*\}/g, ' ');
    if (s && !isIdentifierLike(s)) out.push(s);
  }
  return out;
}

const VISIBLE_ATTRS = /\b(?:alt|title|aria-label|aria-description|placeholder|description|content|label|summary)\s*=\s*"([^"]*)"/gi;

/** The copy a reader can see in an .astro (or .html) file. */
export function astroCopy(src) {
  const parts = [];
  let body = String(src);
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(body);
  if (fm) {
    parts.push(...stringLiterals(fm[1]));
    body = body.slice(fm[0].length);
  }
  body = body.replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  // Inline scripts: their strings are copy if they reach the page; JSON islands are data.
  body = body.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, code) => {
    if (!/application\/(?:ld\+)?json/.test(attrs)) parts.push(...stringLiterals(code));
    return ' ';
  });
  body = body.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const m of body.matchAll(VISIBLE_ATTRS)) parts.push(m[1]);
  // {expressions}: keep their string literals, drop the code.
  body = body.replace(/\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (_, expr) => {
    parts.push(...stringLiterals(expr));
    return ' ';
  });
  body = body.replace(/<[^>]+>/g, ' ');
  parts.push(body);
  return parts.join('\n');
}

/** Every string value in a JSON document (keys skipped). */
export function jsonCopy(src) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') {
      if (!isIdentifierLike(v)) out.push(v);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(JSON.parse(src));
  return out.join('\n');
}

/** Copy of a source file by extension: .astro/.html, .json, else JS/TS string literals. */
export function extractCopy(src, path = '') {
  if (/\.(?:astro|html)$/.test(path)) return astroCopy(src);
  if (/\.json$/.test(path)) return jsonCopy(src);
  return stringLiterals(src).join('\n');
}

/** Banned hits in a source file's copy. */
export function scanSource(src, path) {
  return scanText(extractCopy(src, path));
}

/** { patternId: count } for a list of hits, sorted by id (stable for a baseline file). */
export function countHits(hits) {
  const counts = {};
  for (const h of hits) counts[h.id] = (counts[h.id] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

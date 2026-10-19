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
  // "any face value in a real currency": other currency symbols and codes next to a number, a trailing $
  ['currency-amount', 'money units', /[€£¥₩₹]\s?\d|\d\s?[€£¥₩₹$]|\b\d[\d,.]*\s?(?:EUR|GBP|JPY|CNY|CAD|AUD|CHF|MXN)\b|\b(?:EUR|GBP|JPY|CNY|CAD|AUD|CHF|MXN)\s?\d/g],
  ['currency-name', 'money units', /\beuros?\b|\bpounds? sterling\b|\bpesos?\b/gi],
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

/** Hyphenated or dotted forms that are copy even written as one token. */
const ALWAYS_COPY = /pump\.fun|dex-?screener|dao-backed|legal-tender|cash-out|money-printer/i;

/**
 * A single token with path/URL/selector punctuation and no spaces is code
 * (a class name, a path, a key), not copy. Exceptions, which are copy even as
 * one token: a money amount or ticker ("$1.00", "€5", "$NOUNS"), a capitalised
 * word that is not a path or file name ("DAO-backed", "USD-pegged"), and the
 * ALWAYS_COPY forms ("pump.fun").
 */
export function isCodeToken(s) {
  const t = String(s);
  if (/\s/.test(t) || !/[-/#.:_=?&@]/.test(t)) return false;
  if (ALWAYS_COPY.test(t)) return false;
  if (/[$€£¥]\s?\d|\d\s?[$€£¥]|\$[A-Z]{2,}/.test(t)) return false;
  const pathLike = /[/#=?&@\\]/.test(t) || /^[.\w-]+\.[a-z0-9]{2,5}$/.test(t);
  if (/[A-Z]/.test(t) && !pathLike) return false;
  return true;
}

const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const IDENT = /[A-Za-z0-9_$]/;

/** '…' or "…" starting at i: [content, index after the closing quote], or null when the line ends first. */
function readQuoted(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') j += 2;
    else if (c === q) return [src.slice(i + 1, j), j + 1];
    else if (c === '\n') return null;
    else j += 1;
  }
  return null;
}

/** The index of the "}" closing the "{" just before `j`, skipping strings, templates and comments. */
function closeBrace(src, j) {
  let depth = 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '/' && src[j + 1] === '/') {
      const k = src.indexOf('\n', j);
      j = k < 0 ? src.length : k;
    } else if (c === '/' && src[j + 1] === '*') {
      const k = src.indexOf('*/', j + 2);
      j = k < 0 ? src.length : k + 2;
    } else if (c === "'" || c === '"') {
      const r = readQuoted(src, j);
      j = r ? r[1] : j + 1;
    } else if (c === '`') {
      j = readTemplate(src, j, []);
    } else {
      if (c === '{') depth += 1;
      else if (c === '}' && --depth === 0) return j;
      j += 1;
    }
  }
  return src.length;
}

/** A template literal at i: pushes its static text (each ${…} as one space) and the strings inside each ${…}. */
function readTemplate(src, i, out) {
  let text = '';
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') {
      text += src.slice(j, j + 2);
      j += 2;
    } else if (c === '`') {
      out.push(text);
      return j + 1;
    } else if (c === '$' && src[j + 1] === '{') {
      const end = closeBrace(src, j + 2);
      lexStrings(src.slice(j + 2, end), out);
      text += ' ';
      j = end + 1;
    } else {
      text += c;
      j += 1;
    }
  }
  out.push(text);
  return j;
}

/** Skip a regex literal at i (its "/" already judged to start one). */
function skipRegex(src, i) {
  let j = i + 1;
  let inClass = false;
  while (j < src.length && src[j] !== '\n') {
    const c = src[j];
    if (c === '\\') j += 1;
    else if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) return j + 1;
    j += 1;
  }
  return j;
}

/** Every string literal in JS/TS source, in order: comments and regex literals are skipped, "//" inside a string is text. */
function lexStrings(src, out) {
  let prev = '';
  let word = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      const k = src.indexOf('\n', i);
      i = k < 0 ? src.length : k;
    } else if (c === '/' && src[i + 1] === '*') {
      const k = src.indexOf('*/', i + 2);
      i = k < 0 ? src.length : k + 2;
    } else if (c === "'" || c === '"') {
      const r = readQuoted(src, i);
      if (r) {
        out.push(r[0]);
        i = r[1];
        prev = c;
        word = '';
      } else i += 1;
    } else if (c === '`') {
      i = readTemplate(src, i, out);
      prev = '`';
      word = '';
    } else if (c === '/' && (!prev || /[(,=:[!&|?{};+\-*%<>~^]/.test(prev) || REGEX_AFTER_WORD.has(word))) {
      i = skipRegex(src, i);
      prev = '/';
      word = '';
    } else if (IDENT.test(c)) {
      let k = i;
      while (k < src.length && IDENT.test(src[k])) k += 1;
      word = src.slice(i, k);
      prev = src[k - 1];
      i = k;
    } else {
      if (!/\s/.test(c)) {
        prev = c;
        word = '';
      }
      i += 1;
    }
  }
  return out;
}

/** String literals in JS/TS: '…', "…", and the static parts of `…${…}…` (plus strings inside ${…}). Code tokens are dropped. */
export function stringLiterals(code) {
  return lexStrings(String(code), []).filter((s) => s && !isCodeToken(s));
}

const VISIBLE_ATTRS = /\b(?:alt|title|aria-label|aria-description|placeholder|description|content|label|summary)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const TAG = /<[A-Za-z/][^<>]*>/g;

/** Replace each top-level {expression} in Astro markup with a space, handing its text to `onExpr`. Braces are counted plainly. */
function cutExpressions(markup, onExpr) {
  let out = '';
  let i = 0;
  while (i < markup.length) {
    const open = markup.indexOf('{', i);
    if (open < 0) {
      out += markup.slice(i);
      break;
    }
    out += markup.slice(i, open);
    let depth = 0;
    let j = open;
    for (; j < markup.length; j += 1) {
      if (markup[j] === '{') depth += 1;
      else if (markup[j] === '}' && --depth === 0) break;
    }
    onExpr(markup.slice(open + 1, j));
    out += ' ';
    i = j + 1;
  }
  return out;
}

/** The copy inside one {expression}: JSX text between tags, string literals in the code, and the same for nested expressions. */
function expressionCopy(expr, parts) {
  const flat = cutExpressions(expr, (inner) => expressionCopy(inner, parts));
  for (const m of flat.matchAll(/<[A-Za-z/][^<>]*>([^<>]*)(?=<)/g)) if (m[1].trim()) parts.push(m[1]);
  const code = flat.replace(/(<[A-Za-z/][^<>]*>)[^<>]*(?=<)/g, '$1').replace(TAG, ' ');
  parts.push(...stringLiterals(code));
}

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
  for (const m of body.matchAll(VISIBLE_ATTRS)) parts.push(m[1] ?? m[2]);
  // {expressions}: their JSX text and string literals are copy, their code is not.
  body = cutExpressions(body, (expr) => expressionCopy(expr, parts));
  body = body.replace(TAG, ' ');
  parts.push(body);
  return parts.join('\n');
}

/** Every string value in a JSON document (keys skipped). */
export function jsonCopy(src) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') {
      if (!isCodeToken(v)) out.push(v);
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

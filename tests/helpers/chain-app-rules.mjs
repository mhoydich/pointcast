// Shared checks for the four devnet-app suites (Observatory, Daily Mint,
// Notary, Time Capsules). Not a test file: the suites import it.
//
// What the rules mean, one place:
//   - nothing the devnet sends is ever markup: no innerHTML or friends, no
//     href, src, srcdoc or style set from data, no inline handler, no eval;
//   - the copy never uses the words a fundraising page would use, and never a
//     currency sign (a dollar sign followed by a digit; ${...} and a $ in a
//     regular expression are code, not money);
//   - the apps carry the honesty line and say what a claim is.
import assert from 'node:assert/strict';

export const J = (...parts) => parts.join('');

export const BANNED = [
  J('ca', 'sh'), J('in', 'vest'), J('pro', 'fit'), J('ea', 'rn'), J('air', 'drop'), J('real', ' ', 'money'),
  J('yi', 'eld'), J('sta', 'ke'), J('re', 'deem'), J('back', 'ed'), J('U', 'SD'), J('u', 'sd'),
];

const re = (w) => new RegExp('\\b' + w.replace(' ', '\\s+') + (w.toUpperCase() === J('U', 'SD') ? '\\b' : ''), 'i');
export const bannedHits = (text) => [...new Set(BANNED.filter((w) => re(w).test(text)).map((w) => w.toLowerCase()))];

/** A dollar sign followed by a number is a price. ${...}, $VAR and a regular expression's $ are code. */
export const currencyHits = (text) => text.match(/\$\s?\d/g) || [];

/** Strip comments so rules read code and copy, not the notes about them. */
export const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, (_, keep) => keep);

/**
 * Throws a message naming the first sink found. `label` names the file.
 * Allowed: setAttribute with a fixed, harmless name (geometry, aria, role,
 * class, data-*, tabindex, type, width, height ...), and style.left / style.top
 * set from numbers the view computes (the tooltip).
 */
export function assertNoSinks(src, label, { allow = [] } = {}) {
  let c = code(src);
  for (const a of allow) c = c.replace(a, '');
  const html = /\.(innerHTML|outerHTML)\s*[+]?=|insertAdjacentHTML|document\.write|createContextualFragment|new\s+DOMParser|\beval\s*\(|new\s+Function\s*\(|\bsrcdoc\b|\bsetHTML\b/;
  const m1 = html.exec(c);
  if (m1) throw new Error(label + ': an HTML sink (' + m1[0] + ')');
  const link = /\.(href|src|action|formAction)\s*=[^=]|setAttribute\(\s*['"](href|src|style|srcdoc|action|formaction|xlink:href|on[a-z]+)['"]|\.style\.(?!left\b|top\b|width\b|height\b|transform\b)[a-zA-Z]+\s*=|\.style\.cssText/i;
  const m2 = link.exec(c);
  if (m2) throw new Error(label + ': a link, source or style sink (' + m2[0] + ')');
  if (/\son[a-z]+\s*=\s*["']/i.test(c)) throw new Error(label + ': an inline event handler');
  // A sink reached another way, written to dodge the checks above: a quoted or computed key (n['innerHTML'] = x), a key spelled in two
  // halves ('inner' + 'HTML'), Reflect.set or Object.defineProperty. None has a use in these pages, so none is allowed.
  const other = /\[\s*(['"`])(?:innerHTML|outerHTML|insertAdjacentHTML|srcdoc|href|src|action|formAction|cssText|on[a-z]+)\1\s*\]|(['"`])(?:inner|outer)\2\s*\+|\+\s*(['"`])(?:inner|outer)?HTML\3|\bReflect\.(?:set|defineProperty|apply)\s*\(|\bObject\.defineProperty\s*\(|\bObject\.(?:assign|setPrototypeOf)\s*\(\s*(?:n|el|node|li|td|th|span|host|box|a)\b/i;
  const m3 = other.exec(c);
  if (m3) throw new Error(label + ': a sink reached another way (' + m3[0] + ')');
}

/** The reads of a read-only app are GETs: no POST, no method override, no XHR. */
export function assertReadOnly(src, label) {
  const c = code(src);
  assert.doesNotMatch(c, /method\s*:\s*['"]POST['"]|\.post\(|XMLHttpRequest|sendBeacon|method\s*:\s*['"](PUT|PATCH|DELETE)['"]/, label + ' writes');
}


/** The argument text of every call of `callee` (e.g. "net.get("), parentheses balanced, comments stripped. */
export function callArgs(src, callee) {
  const c = code(src);
  const out = [];
  let at = c.indexOf(callee);
  while (at >= 0) {
    let depth = 0;
    let i = at + callee.length - 1;
    for (; i < c.length; i++) {
      if (c[i] === '(') depth++;
      else if (c[i] === ')') { depth--; if (depth === 0) break; }
    }
    out.push(c.slice(at + callee.length, i).trim());
    at = c.indexOf(callee, i);
  }
  return out;
}

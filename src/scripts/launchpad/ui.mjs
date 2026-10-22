/**
 * DOM and formatting helpers for the launchpad live board. Views build their
 * DOM once and update text in place, so focus and scroll survive a 100×
 * run. Viewer text (coin names, symbols) is only ever set with textContent.
 */
import { fmt, toNumber } from '../../lib/launchpad/units.mjs';

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create an element with attributes and children. Strings become text nodes, never HTML. */
export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) node.append(kid);
  return node;
}

/** Create an SVG element with attributes. */
export function svg(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const kid of kids.flat()) if (kid) node.append(kid);
  return node;
}

/** Set text only when it changed (cheap, and it keeps screen readers quiet). */
export function setText(node, text) {
  const t = String(text);
  if (node.textContent !== t) node.textContent = t;
}

/** Set an attribute only when it changed. */
export function setAttr(node, name, value) {
  const v = String(value);
  if (node.getAttribute(name) !== v) node.setAttribute(name, v);
}

/**
 * Keep a container's children in step with a list of items, by key, creating
 * rows once and updating them after. `create(item)` returns { node, update(item) }.
 */
export function keyedRows(container, items, key, create) {
  const rows = container.__rows ?? (container.__rows = new Map());
  const seen = new Set();
  let prev = null;
  for (const item of items) {
    const k = key(item);
    seen.add(k);
    let row = rows.get(k);
    if (!row) { row = create(item); rows.set(k, row); }
    row.update(item);
    const want = prev ? prev.nextSibling : container.firstChild;
    if (want !== row.node) place(container, row.node, want);
    prev = row.node;
  }
  for (const [k, row] of rows) if (!seen.has(k)) { row.node.remove(); rows.delete(k); }
}

/**
 * Move a row into place. Element.moveBefore keeps focus and state on a row that is already in the
 * container; browsers without it, and rows not yet attached, fall back to insertBefore.
 */
function place(container, node, ref) {
  if (typeof container.moveBefore === 'function' && node.parentNode === container) {
    try { container.moveBefore(node, ref); return; } catch { /* fall through */ }
  }
  container.insertBefore(node, ref);
}

/* ---------- formatting ---------- */

/** Credits with a fixed number of decimals and the cr unit. */
export const cr = (micro, digits = 2) => `${fmt(micro, digits)} cr`;
/** Credits without the unit (for table cells under a "cr" header). */
export const num = (micro, digits = 2) => fmt(micro, digits);
/** Whole tokens, grouped. */
export const tokens = (micro, digits = 0) => fmt(micro, digits);
/** A ratio as a percent with one decimal. */
export const pct = (x, digits = 1) => `${(x * 100).toFixed(digits)}%`;
/** Basis points as a percent. */
export const bpsPct = (bps, digits = 2) => `${(bps / 100).toFixed(digits)}%`;
/** A signed percent change (e.g. +12.4%). */
export const change = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}%`;
/** A per-token price in credits, with enough significant digits for tiny prices. */
export const price = (p) => (p >= 1 ? p.toFixed(2) : p.toPrecision(3));
/** Age in ticks (one tick is one simulated second) as 45s, 12m or 3h. */
export function age(ticks) {
  if (ticks < 0) return `opens in ${-ticks}s`;
  if (ticks < 120) return `${ticks}s`;
  if (ticks < 7200) return `${Math.floor(ticks / 60)}m`;
  return `${Math.floor(ticks / 3600)}h`;
}
export { toNumber };

/* ---------- roles and badges ---------- */

/** The tape and holder badges (plan §3): BOT, DEV, SNIPER, BUNDLE, plus COPY, YOU and RETAIL. */
export const ROLE_BADGE = Object.freeze({ bot: 'BOT', sniper: 'SNIPER', dev: 'DEV', bundler: 'BUNDLE', copy: 'COPY', human: 'YOU', retail: 'RETAIL' });
export const badgeFor = (role) => ROLE_BADGE[role] ?? role.toUpperCase();
/** A small role badge element; roles that read as risk get the warning color. */
export const roleBadge = (role) => el('span', { class: `lp-role ${role}` }, badgeFor(role));
/** A risk badge (low, caution, high) and one badge per hard flag. */
export const riskBadges = (risk) => [el('span', { class: `lp-badge ${risk.badge}` }, `${risk.badge} ${risk.score}`), ...risk.flags.map((f) => el('span', { class: 'lp-badge flag' }, f))];

/**
 * Parse a decimal credit or token amount typed by a viewer; null when it is not a positive amount with
 * at most 6 decimals. Commas are allowed only as thousands separators (1,000.5), so a slip like 1,0 is refused.
 */
export function parseAmount(text) {
  let t = String(text ?? '').trim();
  if (t.includes(',')) {
    if (!/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(t)) return null;
    t = t.replace(/,/g, '');
  }
  if (!/^\d+(\.\d{1,6})?$/.test(t) || /^0+(\.0+)?$/.test(t)) return null;
  return t;
}

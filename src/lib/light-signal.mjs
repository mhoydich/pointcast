/**
 * The light signal — one small event that says "this member's light was lit"
 * or "this member's light was snuffed". It is the whole wire format of Light
 * Companion (/light/). Nothing else travels between people.
 *
 * The shape does not depend on how it is carried. Today the carrier is HTTP
 * polling against /api/light. A later carrier (a relay, a radio link, a
 * physical "place" that senses a flame) can move the same event unchanged.
 * Full notes: docs/light-signal.md.
 *
 *   {
 *     v: 0,                       format version
 *     kind: "lit" | "snuffed",
 *     circle: "lc_<32 hex>",      a reference derived from the circle link;
 *                                 it is not the link and cannot open the circle
 *     member: "<8 chars>",        the member's id inside that circle
 *     at: 1794400320000,          when it happened, UTC milliseconds
 *     expires: 1794441600000      when a lit light fades on its own, UTC ms;
 *                                 null on a snuffed signal
 *   }
 *
 * Rules a carrier or a receiver can rely on:
 *   - A signal carries no name, no colour, no text, no location.
 *   - For one member, the signal with the latest `at` wins. Ties go to snuffed.
 *   - A lit signal past its `expires` reads as not lit. No "expired" event is sent.
 *   - Receivers drop anything that fails isLightSignal().
 */

export const LIGHT_SIGNAL_VERSION = 0;
export const LIGHT_SIGNAL_KINDS = Object.freeze(['lit', 'snuffed']);
/** A lit light never lasts longer than this, whatever the sender asks for. */
export const LIGHT_MAX_LIT_MS = 26 * 60 * 60 * 1000;
/** Upper bound on one encoded signal, so any carrier can size its frames. */
export const LIGHT_SIGNAL_MAX_BYTES = 200;

const CIRCLE_REF_RE = /^lc_[0-9a-f]{32}$/;
const MEMBER_RE = /^[a-z0-9]{8}$/;
const KEYS = ['v', 'kind', 'circle', 'member', 'at', 'expires'];

const isMs = (n) => Number.isSafeInteger(n) && n > 0;

/** True when `x` is a well-formed light signal. */
export function isLightSignal(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  const keys = Object.keys(x);
  if (keys.length !== KEYS.length || !KEYS.every((k) => keys.includes(k))) return false;
  if (x.v !== LIGHT_SIGNAL_VERSION) return false;
  if (!LIGHT_SIGNAL_KINDS.includes(x.kind)) return false;
  if (typeof x.circle !== 'string' || !CIRCLE_REF_RE.test(x.circle)) return false;
  if (typeof x.member !== 'string' || !MEMBER_RE.test(x.member)) return false;
  if (!isMs(x.at)) return false;
  if (x.kind === 'snuffed') return x.expires === null;
  return isMs(x.expires) && x.expires > x.at && x.expires - x.at <= LIGHT_MAX_LIT_MS;
}

/** Build a signal. Throws on anything malformed, so a bad one is never sent. */
export function lightSignal({ kind, circle, member, at, expires = null }) {
  const signal = { v: LIGHT_SIGNAL_VERSION, kind, circle, member, at, expires: kind === 'snuffed' ? null : expires };
  if (!isLightSignal(signal)) throw new Error('not a light signal');
  return Object.freeze(signal);
}

/** Is this signal showing a lit light at `now`? */
export function signalIsLit(signal, now = Date.now()) {
  return isLightSignal(signal) && signal.kind === 'lit' && signal.expires > now;
}

/** Canonical text form: fixed key order, no spaces. Safe to hash or sign later. */
export function encodeLightSignal(signal) {
  if (!isLightSignal(signal)) throw new Error('not a light signal');
  return JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, signal[k]])));
}

/** Parse text from any carrier. Returns the signal, or null if it is not one. */
export function decodeLightSignal(text) {
  if (typeof text !== 'string' || text.length > LIGHT_SIGNAL_MAX_BYTES) return null;
  try {
    const parsed = JSON.parse(text);
    return isLightSignal(parsed) ? Object.freeze(parsed) : null;
  } catch {
    return null;
  }
}

/**
 * Fold any number of signals, in any order, into who is lit at `now`.
 * Returns Map<member, { lit, at, expires }>. Signals for other circles are ignored.
 */
export function reduceLightSignals(signals, { circle, now = Date.now() } = {}) {
  const latest = new Map();
  for (const s of signals || []) {
    if (!isLightSignal(s) || (circle && s.circle !== circle)) continue;
    const prev = latest.get(s.member);
    if (!prev || s.at > prev.at || (s.at === prev.at && s.kind === 'snuffed')) latest.set(s.member, s);
  }
  const out = new Map();
  for (const [member, s] of latest) out.set(member, { lit: signalIsLit(s, now), at: s.at, expires: s.expires });
  return out;
}

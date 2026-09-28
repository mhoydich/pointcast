// Pure parts of /api/air — request validation, ids and hashing — kept in a
// plain module so tests run them under node without the Pages runtime.
// Every parser rejects, never repairs: a value is an exact v1 bucket or the
// request is refused. The spots config (src/data/air-spots.json) is passed in
// so this file has no imports; WebCrypto is a global in Workers and node.

export const AIR_REASONS = [
  'bad-json', 'bad-spot', 'bad-kind', 'bad-value', 'bad-extras', 'bad-device',
  'bad-code', 'bad-observed-at', 'stale-observation', 'bad-report', 'bad-verdict',
];
export const VERDICTS = ['still', 'changed', 'cant'];
export const MAX_EXTRAS = 3;
export const STALE_MS = 15 * 60_000;
export const FUTURE_MS = 60_000;
export const SLOT_MS = 1_800_000;
/** D1-counted rate limits, checked before insert. The body cap is shared by every POST. */
export const AIR_LIMITS = { bodyBytes: 4000, reportsPerHour: 12, confirmsPerHour: 30, ipWritesPer10Min: 40 };

export const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const REPORT_ID_RE = /^ar_[0-9a-f]{16,40}$/;
const CODE_RE = /^[A-Za-z0-9]{2,16}$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => isObj(o) && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

/** A spot from the config, or null for unknown and reserved ids. */
export function spotOf(config, spotId) {
  if (typeof spotId !== 'string' || config.reserved.includes(spotId)) return null;
  return config.spots.find((s) => s.id === spotId) ?? null;
}

/** A kind config ({question, decayMin, options, readingLabels, extras}) or null. */
export function kindOf(config, spotId, kind) {
  const spot = spotOf(config, spotId);
  return spot && own(spot.kinds, kind) ? spot.kinds[kind] : null;
}

export const ROLES = Object.freeze(['live', 'side', 'rating']);

/**
 * A kind's role, from its config's `role`:
 * - 'live' (absent, today's behavior): First Light, the station post, the crew.
 * - 'side' (parking): a reading and confirms, but nothing goes on the air.
 * - 'rating' (vibe): a 30-day aggregate; no reading, no confirms.
 * An unknown role fails closed to 'side': it can be read and confirmed but
 * never posts, takes First Light or forms a crew.
 */
export function kindRole(kindCfg) {
  const role = kindCfg?.role;
  if (role == null) return 'live';
  return ROLES.includes(role) ? role : 'side';
}

/** The reading label for a bucket: "1–4 waiting". Falls back to the button label. */
export function labelOf(kindCfg, value) {
  if (value == null) return null;
  const labels = kindCfg.readingLabels ?? {};
  if (own(labels, value)) return labels[value];
  return kindCfg.options.find((o) => o.v === value)?.label ?? String(value);
}

/** Pure: a device id is a lowercase uuid v4, or null. */
export function parseDevice(v) {
  return typeof v === 'string' && UUID_V4_RE.test(v) ? v : null;
}

/**
 * Pure: the spot code from `?c=`. Absent is `{code:null}` (a remote report);
 * a malformed one is a reason. Codes are case-insensitive, hashed upper-case.
 */
export function parseCode(v) {
  if (v == null || v === '') return { code: null };
  if (typeof v !== 'string' || !CODE_RE.test(v)) return { reason: 'bad-code' };
  return { code: v.toUpperCase() };
}

/**
 * Pure: parse and validate a report body for the spot in the path, or return
 * `{reason}`. Returns `{spot, kind, value, extras, device, code, asGuest, observedAt}`.
 * A clock up to 60 s fast is read as `now`.
 */
export function parseAirReport(config, spotId, body, now = Date.now()) {
  if (!isObj(body)) return { reason: 'bad-json' };
  const spot = spotOf(config, spotId);
  if (!spot) return { reason: 'bad-spot' };
  const kind = typeof body.kind === 'string' && own(spot.kinds, body.kind) ? body.kind : null;
  if (!kind) return { reason: 'bad-kind' };
  const cfg = spot.kinds[kind];
  const value = typeof body.value === 'string' && cfg.options.some((o) => o.v === body.value) ? body.value : null;
  if (value == null) return { reason: 'bad-value' };
  const extras = body.extras == null ? [] : body.extras;
  if (!Array.isArray(extras) || extras.length > MAX_EXTRAS || new Set(extras).size !== extras.length
    || !extras.every((x) => typeof x === 'string' && cfg.extras.includes(x))) return { reason: 'bad-extras' };
  const device = parseDevice(body.device);
  if (!device) return { reason: 'bad-device' };
  const code = parseCode(body.code);
  if (code.reason) return code;
  if (body.asGuest != null && typeof body.asGuest !== 'boolean') return { reason: 'bad-json' };
  let observedAt = now;
  if (body.observedAt != null) {
    const t = body.observedAt;
    if (typeof t !== 'number' || !Number.isInteger(t) || t > now + FUTURE_MS) return { reason: 'bad-observed-at' };
    if (t < now - STALE_MS) return { reason: 'stale-observation' };
    observedAt = Math.min(t, now);
  }
  return { spot: spot.id, kind, value, extras: [...extras], device, code: code.code, asGuest: body.asGuest === true, observedAt };
}

/** Pure: parse a confirm body, or `{reason}`. Returns `{reportId, verdict, device, code}`. */
export function parseConfirm(body) {
  if (!isObj(body)) return { reason: 'bad-json' };
  const reportId = typeof body.reportId === 'string' && REPORT_ID_RE.test(body.reportId) ? body.reportId : null;
  if (!reportId) return { reason: 'bad-report' };
  const verdict = typeof body.verdict === 'string' && VERDICTS.includes(body.verdict) ? body.verdict : null;
  if (!verdict) return { reason: 'bad-verdict' };
  const device = parseDevice(body.device);
  if (!device) return { reason: 'bad-device' };
  const code = parseCode(body.code);
  if (code.reason) return code;
  return { reportId, verdict, device, code: code.code };
}

/** The one-per-phone slot: 30-minute buckets of epoch time. */
export const slotOf = (ms) => Math.floor(ms / SLOT_MS);

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/** A fresh row id: `ar_` + 20 hex for reports; pass another prefix for points and stamps. */
export function newAirId(prefix = 'ar') {
  return `${prefix}_${hex(crypto.getRandomValues(new Uint8Array(10)))}`;
}

/** First 16 hex chars of sha256(text). */
export async function hash16(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return hex(new Uint8Array(buf)).slice(0, 16);
}

export const pidHash = (device) => hash16(`air:v1:${device}`);
export const ipHash = (ip, day, salt) => hash16(`${ip}|${day}|${salt || 'pointcast-air-v1'}`);

/**
 * A spot code's stored hash: HMAC-SHA-256 keyed by the AIR_CODE_PEPPER secret,
 * first 32 hex chars. No pepper, no hash (null): without the secret no code
 * verifies and every report files from away, so a short code can never be
 * brute-forced from a public seed or a copied table. There is deliberately no
 * default pepper. scripts/air-codes.mjs prints the air_codes INSERT.
 */
export async function codeHash(spot, code, pepper) {
  if (typeof pepper !== 'string' || !pepper) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`air-code:${spot}:${code}`));
  return hex(new Uint8Array(sig)).slice(0, 32);
}

/** The points/stamps owner: 'user:<id>' when signed in, else 'dev:<pid_hash>'. */
export function ownerOf({ user_id, pid_hash }) {
  return user_id ? `user:${user_id}` : `dev:${pid_hash}`;
}

/** "Guest 4471": the anonymous byline, stable per phone. */
export function guestByline(pid) {
  return `Guest ${1000 + (parseInt(String(pid).slice(0, 4), 16) % 9000)}`;
}

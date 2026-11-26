/**
 * Light Companion: a circle of people, one light each. Page: /light/.
 * Endpoint: functions/api/light.ts. Signal format: src/lib/light-signal.mjs.
 *
 * What is kept for a circle, and nothing else:
 *   - a one-way hash of the circle link (the link itself is never stored)
 *   - each member's display name, flame colour and chosen duration
 *   - each member's lit / snuffed timestamps and the time the light fades
 *   - when the circle was made and last touched, and a one-minute write counter
 * No IP address, location, device id or message is stored here.
 *
 * Storage follows the Family Room pattern: the existing AUTH_DB D1 binding,
 * with the table created on first use. When AUTH_DB is not bound (local dev,
 * tests) an in-memory store stands in, and every response says so.
 */
import { LIGHT_MAX_LIT_MS, lightSignal } from '../../src/lib/light-signal.mjs';

export const SCHEMA_ID = 'pointcast.light/v0';
export const MEMBER_CAP = 12;
export const NAME_MAX = 24;
export const CIRCLE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const TOUCH_EVERY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const BURST_WINDOW_MS = 60 * 1000;
export const BURST_MAX = 40;
export const COLOURS = ['amber', 'rose', 'gold', 'moss', 'sky', 'lilac'];
export const MODES = ['tonight', 'hour'];
export const NOTICE = 'This is not an emergency or monitoring service. It cannot call for help. A dark window only means a light is not lit.';

const ALPHABET = 'abcdefghjkmnpqrstvwxyz0123456789'; // 32 symbols, 5 bits each
const CIRCLE_ID_RE = /^[a-z0-9]{32}$/;
const MEMBER_ID_RE = /^[a-z0-9]{8}$/;

function randomId(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b & 31];
  return out;
}

/** A new circle id: 32 symbols, 160 bits from the platform's secure random source. */
export const newCircleId = () => randomId(32);
export const newMemberId = () => randomId(8);
export const isCircleId = (value) => typeof value === 'string' && CIRCLE_ID_RE.test(value);
export const isMemberId = (value) => typeof value === 'string' && MEMBER_ID_RE.test(value);

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Storage key. The link is hashed so the table alone cannot open a circle. */
export const storageKey = (circleId) => sha256Hex(`pointcast-light:store:${circleId}`);
/** The circle's name on a signal carrier. Cannot be turned back into the link. */
export const signalRef = async (circleId) => `lc_${(await sha256Hex(`pointcast-light:signal:${circleId}`)).slice(0, 32)}`;
/** The circle's drum room code: an existing /drum-room-v2 room, named by a hash. */
export const drumRoom = async (circleId) => `light-${(await sha256Hex(`pointcast-light:drum:${circleId}`)).slice(0, 20)}`;

/** Display name: plain text, one line, no control or direction-override characters. */
export function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  const text = raw
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(text).slice(0, NAME_MAX).join('').trim();
}

const fail = (status, error) => ({ ok: false, status, error });

// ── The circle document: pure functions, no storage ──────────────────

export function emptyCircle(now) {
  return { v: 0, createdAt: now, members: [], burst: [now, 0] };
}

function memberOf(doc, memberId) {
  return isMemberId(memberId) ? doc.members.find((m) => m.id === memberId) : undefined;
}

/** Count a write against the circle's one-minute budget. */
function spend(doc, now) {
  const [start, count] = Array.isArray(doc.burst) ? doc.burst : [now, 0];
  if (now - start >= BURST_WINDOW_MS) { doc.burst = [now, 1]; return true; }
  if (count >= BURST_MAX) return false;
  doc.burst = [start, count + 1];
  return true;
}

/**
 * Apply one action to a circle document. Returns { ok, doc, member? } with a
 * new document, or { ok: false, status, error }. Never mutates its input.
 */
export function applyAction(input, action, body, now) {
  const doc = structuredClone(input);
  if (!spend(doc, now)) return fail(429, 'This circle is changing too fast. Wait a minute.');

  if (action === 'join') {
    const name = cleanName(body.name);
    if (!name) return fail(400, 'Pick a name, up to 24 characters.');
    if (!COLOURS.includes(body.colour)) return fail(400, `colour must be one of ${COLOURS.join(', ')}.`);
    if (doc.members.length >= MEMBER_CAP) return fail(409, `This circle is full. A circle holds ${MEMBER_CAP} lights.`);
    let id = newMemberId();
    while (doc.members.some((m) => m.id === id)) id = newMemberId();
    const member = { id, name, colour: body.colour, mode: 'tonight', litAt: null, expiresAt: null, snuffedAt: null };
    doc.members.push(member);
    return { ok: true, doc, member: id };
  }

  const member = memberOf(doc, body.member);
  if (!member) return fail(404, 'That light is not in this circle.');

  if (action === 'update') {
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (!name) return fail(400, 'Pick a name, up to 24 characters.');
      member.name = name;
    }
    if (body.colour !== undefined) {
      if (!COLOURS.includes(body.colour)) return fail(400, `colour must be one of ${COLOURS.join(', ')}.`);
      member.colour = body.colour;
    }
    if (body.mode !== undefined) {
      if (!MODES.includes(body.mode)) return fail(400, 'mode must be tonight or hour.');
      member.mode = body.mode;
    }
    return { ok: true, doc, member: member.id };
  }

  if (action === 'light') {
    const mode = body.mode === undefined ? member.mode : body.mode;
    if (!MODES.includes(mode)) return fail(400, 'mode must be tonight or hour.');
    let expiresAt;
    if (mode === 'hour') {
      expiresAt = now + HOUR_MS;
    } else {
      // "Until tonight" ends at the lighter's own midnight, which only their
      // device knows. The server checks it is a sane time and no more.
      expiresAt = Number(body.until);
      if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt - now > LIGHT_MAX_LIT_MS) {
        return fail(400, 'until must be a time later today, in UTC milliseconds, at most 26 hours away.');
      }
    }
    member.mode = mode;
    member.litAt = now;
    member.expiresAt = expiresAt;
    member.snuffedAt = null;
    return { ok: true, doc, member: member.id };
  }

  if (action === 'snuff') {
    if (member.litAt && member.expiresAt > now) member.snuffedAt = now;
    return { ok: true, doc, member: member.id };
  }

  if (action === 'remove') {
    doc.members = doc.members.filter((m) => m.id !== member.id);
    return { ok: true, doc, member: member.id };
  }

  return fail(400, 'Unknown action.');
}

const isLit = (m, now) => Boolean(m.litAt && m.expiresAt > now && !m.snuffedAt);

/** The current signal for one member, or null if they have never lit a light. */
function currentSignal(m, ref, now) {
  if (!m.litAt) return null;
  if (m.snuffedAt) return lightSignal({ kind: 'snuffed', circle: ref, member: m.id, at: m.snuffedAt });
  if (m.expiresAt <= now) return null; // faded on its own: no event, by design
  return lightSignal({ kind: 'lit', circle: ref, member: m.id, at: m.litAt, expires: m.expiresAt });
}

/** What a reader with the link sees. */
export async function publicState(circleId, record, now, storeKind) {
  const { doc, version } = record;
  const ref = await signalRef(circleId);
  const room = await drumRoom(circleId);
  return {
    ok: true,
    schema: SCHEMA_ID,
    now,
    version,
    store: storeKind,
    notice: NOTICE,
    circle: {
      createdAt: doc.createdAt,
      memberCap: MEMBER_CAP,
      expiresAfterDaysUntouched: CIRCLE_TTL_MS / 86_400_000,
      members: doc.members.map((m) => {
        const lit = isLit(m, now);
        return { id: m.id, name: m.name, colour: m.colour, mode: m.mode, lit, litAt: lit ? m.litAt : null, expiresAt: lit ? m.expiresAt : null };
      }),
    },
    signals: doc.members.map((m) => currentSignal(m, ref, now)).filter(Boolean),
    drum: { room, page: `/drum-room-v2?room=${room}` },
  };
}

// ── Stores ───────────────────────────────────────────────────────────
// Both stores speak the same five verbs. A record is { doc, version, touchedAt }.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS light_circles (
    id_hash TEXT PRIMARY KEY,
    doc TEXT NOT NULL,
    version INTEGER NOT NULL,
    touched_at INTEGER NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS light_circles_touched ON light_circles (touched_at)',
];
const provisioned = new WeakMap();

function ensureSchema(db) {
  let pending = provisioned.get(db);
  if (!pending) {
    pending = (async () => { for (const sql of SCHEMA) await db.prepare(sql).run(); })()
      .catch((error) => { provisioned.delete(db); throw error; });
    provisioned.set(db, pending);
  }
  return pending;
}

export function d1Store(db) {
  return {
    kind: 'd1',
    async get(key) {
      await ensureSchema(db);
      const row = await db.prepare('SELECT doc, version, touched_at FROM light_circles WHERE id_hash = ?').bind(key).first();
      if (!row) return null;
      try { return { doc: JSON.parse(row.doc), version: Number(row.version), touchedAt: Number(row.touched_at) }; } catch { return null; }
    },
    async insert(key, doc, now) {
      await ensureSchema(db);
      await db.prepare('INSERT INTO light_circles (id_hash, doc, version, touched_at) VALUES (?, ?, 1, ?)').bind(key, JSON.stringify(doc), now).run();
    },
    /** Compare-and-swap on version, so two people acting at once cannot lose a light. */
    async replace(key, doc, version, now) {
      const r = await db.prepare('UPDATE light_circles SET doc = ?, version = version + 1, touched_at = ? WHERE id_hash = ? AND version = ?')
        .bind(JSON.stringify(doc), now, key, version).run();
      return Number(r?.meta?.changes || 0) === 1;
    },
    async touch(key, now) {
      await db.prepare('UPDATE light_circles SET touched_at = ? WHERE id_hash = ?').bind(now, key).run();
    },
    async remove(key) {
      await ensureSchema(db);
      await db.prepare('DELETE FROM light_circles WHERE id_hash = ?').bind(key).run();
    },
    async sweep(before) {
      await ensureSchema(db);
      await db.prepare('DELETE FROM light_circles WHERE touched_at < ?').bind(before).run();
    },
  };
}

export function memoryStore(map = new Map()) {
  return {
    kind: 'memory',
    async get(key) { const r = map.get(key); return r ? structuredClone(r) : null; },
    async insert(key, doc, now) { map.set(key, { doc: structuredClone(doc), version: 1, touchedAt: now }); },
    async replace(key, doc, version, now) {
      const r = map.get(key);
      if (!r || r.version !== version) return false;
      map.set(key, { doc: structuredClone(doc), version: version + 1, touchedAt: now });
      return true;
    },
    async touch(key, now) { const r = map.get(key); if (r) r.touchedAt = now; },
    async remove(key) { map.delete(key); },
    async sweep(before) { for (const [k, r] of map) if (r.touchedAt < before) map.delete(k); },
    size: () => map.size,
  };
}

const devMemory = memoryStore();
/** AUTH_DB when bound; otherwise one in-memory store per process, for dev and tests. */
export const storeFor = (env) => (env && env.AUTH_DB ? d1Store(env.AUTH_DB) : devMemory);

// ── Operations ───────────────────────────────────────────────────────

async function load(store, circleId, now) {
  if (!isCircleId(circleId)) return { error: fail(404, 'No circle at that link.') };
  const key = await storageKey(circleId);
  const record = await store.get(key);
  if (!record) return { error: fail(404, 'No circle at that link. It may have been put out.') };
  if (now - record.touchedAt > CIRCLE_TTL_MS) {
    await store.remove(key);
    return { error: fail(404, 'No circle at that link. It may have been put out.') };
  }
  return { key, record };
}

export async function createCircle(store, now = Date.now()) {
  await store.sweep(now - CIRCLE_TTL_MS);
  const id = newCircleId();
  const doc = emptyCircle(now);
  await store.insert(await storageKey(id), doc, now);
  return { ok: true, status: 201, id, state: await publicState(id, { doc, version: 1 }, now, store.kind) };
}

export async function readCircle(store, circleId, now = Date.now()) {
  const { error, key, record } = await load(store, circleId, now);
  if (error) return error;
  // Reading keeps a circle alive, written at most once a day.
  if (now - record.touchedAt > TOUCH_EVERY_MS) await store.touch(key, now);
  return { ...(await publicState(circleId, record, now, store.kind)), status: 200 };
}

export async function actOnCircle(store, circleId, action, body, now = Date.now()) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error, key, record } = await load(store, circleId, now);
    if (error) return error;
    const result = applyAction(record.doc, action, body || {}, now);
    if (!result.ok) return result;
    if (await store.replace(key, result.doc, record.version, now)) {
      const state = await publicState(circleId, { doc: result.doc, version: record.version + 1 }, now, store.kind);
      return { ...state, status: 200, member: action === 'remove' ? null : result.member };
    }
  }
  return fail(409, 'The circle changed at the same moment. Try again.');
}

export async function putOutCircle(store, circleId, now = Date.now()) {
  const { error, key } = await load(store, circleId, now);
  if (error) return error;
  await store.remove(key);
  return { ok: true, status: 200, gone: true };
}

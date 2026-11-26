/**
 * House Channel pairing. A TV asks for a short code; a phone trades the code
 * for the name of a party room on the existing drum-room relay
 * (workers/pointcast-drum, `bc-` rooms). The relay carries everything after
 * that. This file keeps only:
 *
 *   house:code:<CODE>  → { room, exp }           lives ten minutes
 *   house:room:<room>  → { keyHash, drum, code, createdAt }   lives six hours at most
 *
 * No names, no addresses, nothing about what is on the TV. The room name is
 * long and random; the code is what a person types.
 *
 * Plain module so tests/house-channel.test.mjs runs it under node.
 */

export const CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_LEN = 5;
export const CODE_TTL_SEC = 10 * 60;
export const ROOM_TTL_SEC = 6 * 60 * 60;
const ID_ALPHA = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const isRoomId = (v) => typeof v === 'string' && /^bc-hc-[a-z0-9]{24}$/.test(v);
export const isKey = (v) => typeof v === 'string' && /^[a-z0-9]{32}$/.test(v);

export function cleanCode(text) {
  const s = String(text ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length !== CODE_LEN) return '';
  for (const ch of s) if (!CODE_ALPHA.includes(ch)) return '';
  return s;
}

function randomFrom(alphabet, length) {
  // rejection sampling so every character is equally likely
  const limit = 256 - (256 % alphabet.length);
  let out = '';
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of bytes) {
      if (b < limit && out.length < length) out += alphabet[b % alphabet.length];
    }
  }
  return out;
}

export const newCode = () => randomFrom(CODE_ALPHA, CODE_LEN);
const newRoom = () => `bc-hc-${randomFrom(ID_ALPHA, 24)}`;
const newKey = () => randomFrom(ID_ALPHA, 32);
const newDrum = () => `house-${randomFrom(ID_ALPHA, 12)}`;

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** In-memory store with the same three calls as the KV one. For local runs and tests. */
export function memoryStore(clock = () => Date.now()) {
  const map = new Map();
  return {
    kind: 'memory',
    async get(key) {
      const hit = map.get(key);
      if (!hit) return null;
      if (hit.exp <= clock()) { map.delete(key); return null; }
      return hit.value;
    },
    async put(key, value, ttlSec) { map.set(key, { value, exp: clock() + ttlSec * 1000 }); },
    async delete(key) { map.delete(key); },
    size: () => map.size,
  };
}

export function kvStore(kv) {
  return {
    kind: 'kv',
    async get(key) { return kv.get(key, 'json'); },
    // KV refuses a TTL under 60 seconds
    async put(key, value, ttlSec) { await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, Math.ceil(ttlSec)) }); },
    async delete(key) { await kv.delete(key); },
  };
}

const sharedMemory = memoryStore();

/** A dedicated HOUSE_KV if one is bound, else the rate-limit namespace every deploy already has, else memory. */
export function storeFor(env) {
  const kv = env?.HOUSE_KV || env?.PC_RATES_KV;
  return kv ? kvStore(kv) : sharedMemory;
}

const codeKey = (code) => `house:code:${code}`;
const roomKey = (room) => `house:room:${room}`;
const fail = (status, error, message) => ({ ok: false, status, error, message });

/**
 * A TV opens a pairing window. With no room it gets a new room, its key and a
 * code. With its room and key it gets a fresh code for the same room, and the
 * old code stops working.
 */
export async function openPairing(store, body = {}, now = Date.now()) {
  let room = '';
  let key = '';
  let record = null;
  if (body.room !== undefined || body.key !== undefined) {
    if (!isRoomId(body.room) || !isKey(body.key)) return fail(400, 'bad-room', 'room and key are not in the right shape.');
    record = await store.get(roomKey(body.room));
    if (!record) return fail(410, 'room-gone', 'That room has ended. Start again for a new one.');
    if (record.keyHash !== await sha256Hex(body.key)) return fail(403, 'not-your-room', 'That key does not open this room.');
    room = body.room;
    key = body.key;
    if (record.code) await store.delete(codeKey(record.code));
  } else {
    room = newRoom();
    key = newKey();
    record = { keyHash: await sha256Hex(key), drum: newDrum(), createdAt: now, code: '' };
  }
  const roomTtl = Math.floor(ROOM_TTL_SEC - (now - record.createdAt) / 1000);
  if (roomTtl < 60) {
    await store.delete(roomKey(room));
    return fail(410, 'room-gone', 'That room has ended. Start again for a new one.');
  }
  let code = '';
  for (let attempt = 0; attempt < 8 && !code; attempt += 1) {
    const candidate = newCode();
    if (!(await store.get(codeKey(candidate)))) code = candidate;
  }
  if (!code) return fail(503, 'busy', 'No free code right now. Try again in a moment.');
  const ttl = Math.min(CODE_TTL_SEC, roomTtl);
  const expiresAt = now + ttl * 1000;
  record.code = code;
  await store.put(codeKey(code), { room, exp: expiresAt }, ttl);
  await store.put(roomKey(room), record, roomTtl);
  return { ok: true, status: body.room ? 200 : 201, code, room, key, drum: record.drum, expiresAt, ttlSec: ttl, store: store.kind };
}

/** A phone trades a code for the room. The code keeps working until it expires, so a second phone can use it too. */
export async function joinPairing(store, rawCode, now = Date.now()) {
  const code = cleanCode(rawCode);
  if (!code) return fail(400, 'bad-code', `A code is ${CODE_LEN} letters.`);
  const hit = await store.get(codeKey(code));
  if (!hit || !isRoomId(hit.room) || hit.exp <= now) return fail(404, 'no-such-code', 'No TV is showing that code. Codes last ten minutes; check the TV and try again.');
  return { ok: true, status: 200, room: hit.room, expiresAt: hit.exp, store: store.kind };
}

/** The TV ends the room: the code and the room record are deleted. */
export async function endPairing(store, body = {}) {
  if (!isRoomId(body.room) || !isKey(body.key)) return fail(400, 'bad-room', 'room and key are not in the right shape.');
  const record = await store.get(roomKey(body.room));
  if (!record) return { ok: true, status: 200, ended: false };
  if (record.keyHash !== await sha256Hex(body.key)) return fail(403, 'not-your-room', 'That key does not open this room.');
  if (record.code) await store.delete(codeKey(record.code));
  await store.delete(roomKey(body.room));
  return { ok: true, status: 200, ended: true };
}

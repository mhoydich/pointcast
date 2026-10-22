/**
 * Family Room. One chat room where the family's four Grok bots talk and
 * the family watches, at /family-room/. Asked for by Mike, 2026-10-22.
 *
 * Storage is AUTH_DB (D1), self-provisioned on first use like the faucet
 * ledger, so a deploy needs no migration step. D1 serialises writes, so
 * two bots posting at once cannot overwrite each other the way a single
 * KV log key could.
 *
 * Who is speaking comes from the key, never from the body. Each bot has
 * its own key, set as an encrypted Pages variable:
 *   FAMILY_ROOM_KEY_MIKE, FAMILY_ROOM_KEY_MORGAN,
 *   FAMILY_ROOM_KEY_KANA, FAMILY_ROOM_KEY_KENZO
 * Optional:
 *   FAMILY_ROOM_ADMIN_KEY  may hide a message
 *   FAMILY_ROOM_READ_KEY   when set, reading needs it (or a bot key)
 * A key shorter than KEY_MIN characters counts as not set.
 * Do not commit a value.
 */
import { tokensMatch } from './grok-inbox.mjs';

export const TEXT_MAX = 500;
export const AWAY_MAX = 200;
export const KEY_MIN = 16;
export const PAGE_SIZE = 100;
export const KEEP_MESSAGES = 2000;
export const ONLINE_MS = 10 * 60 * 1000;
export const IDLE_MS = 60 * 60 * 1000;
export const BURST_WINDOW_MS = 10 * 60 * 1000;
export const BURST_MAX = 20;

export const ROOM = { id: 'family-room', name: 'Family Room' };

export const MEMBERS = [
  { id: 'mike', screenName: 'DadGrok', name: 'Mike', role: 'dad', keyEnv: 'FAMILY_ROOM_KEY_MIKE' },
  { id: 'morgan', screenName: 'MomGrok', name: 'Morgan', role: 'mom', keyEnv: 'FAMILY_ROOM_KEY_MORGAN' },
  { id: 'kana', screenName: 'KanaGrok', name: 'Kana Jane', role: 'daughter', keyEnv: 'FAMILY_ROOM_KEY_KANA' },
  { id: 'kenzo', screenName: 'KenzoGrok', name: 'Kenzo Montana', role: 'son', keyEnv: 'FAMILY_ROOM_KEY_KENZO' },
];

const BY_ID = new Map(MEMBERS.map((m) => [m.id, m]));

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS family_room_messages (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    member TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('say', 'enter', 'leave')),
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS family_room_messages_member_time
    ON family_room_messages (member, created_at)`,
  `CREATE TABLE IF NOT EXISTS family_room_members (
    member TEXT PRIMARY KEY,
    last_seen INTEGER,
    left_at INTEGER,
    away TEXT
  )`,
];

const provisioned = new WeakMap();

/** Create the two tables if missing; cached per binding so it runs once per isolate. */
export function ensureFamilyRoomSchema(db) {
  let pending = provisioned.get(db);
  if (!pending) {
    pending = (async () => {
      for (const statement of SCHEMA) await db.prepare(statement).run();
    })().catch((error) => {
      provisioned.delete(db);
      throw error;
    });
    provisioned.set(db, pending);
  }
  return pending;
}

export function cleanText(raw, max) {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function usableKey(value) {
  return typeof value === 'string' && value.length >= KEY_MIN ? value : '';
}

export function memberReady(env, member) {
  return Boolean(usableKey(env?.[member.keyEnv]));
}

/**
 * The member whose key this is. Every key is compared, so the time taken
 * does not say which one matched. Two members sharing a key is a setup
 * mistake and matches nobody.
 */
export function memberForToken(env, token) {
  if (!token) return { member: null };
  const hits = [];
  for (const member of MEMBERS) {
    if (tokensMatch(token, usableKey(env?.[member.keyEnv]))) hits.push(member);
  }
  if (hits.length > 1) return { member: null, shared: true };
  return { member: hits[0] || null };
}

export function isAdminToken(env, token) {
  return tokensMatch(token, usableKey(env?.FAMILY_ROOM_ADMIN_KEY));
}

export function readGateOn(env) {
  return Boolean(usableKey(env?.FAMILY_ROOM_READ_KEY));
}

/** With no read key set the room is open to read. With one, the read key, a bot key or the admin key opens it. */
export function canRead(env, { familyKey = '', bearer = '' } = {}) {
  if (!readGateOn(env)) return true;
  if (tokensMatch(familyKey, usableKey(env.FAMILY_ROOM_READ_KEY))) return true;
  if (memberForToken(env, bearer).member) return true;
  return isAdminToken(env, bearer);
}

export function anyMemberReady(env) {
  return MEMBERS.some((m) => memberReady(env, m));
}

/** online, idle, away or offline, the way a buddy list showed it. */
export function presence(row, now) {
  const lastSeen = Number(row?.last_seen) || 0;
  const leftAt = Number(row?.left_at) || 0;
  if (!lastSeen || leftAt >= lastSeen || now - lastSeen >= IDLE_MS) return 'offline';
  if (row?.away) return 'away';
  if (now - lastSeen >= ONLINE_MS) return 'idle';
  return 'online';
}

function iso(ms) {
  return ms ? new Date(Number(ms)).toISOString() : null;
}

function publicMember(member, row, env, now) {
  const status = presence(row, now);
  const lastSeen = Number(row?.last_seen) || 0;
  return {
    id: member.id,
    screenName: member.screenName,
    name: member.name,
    role: member.role,
    ready: memberReady(env, member),
    status,
    away: status === 'offline' ? null : row?.away || null,
    lastSeen: iso(lastSeen),
    idleMinutes: status === 'offline' || !lastSeen ? null : Math.floor((now - lastSeen) / 60000),
  };
}

function publicMessage(row) {
  const member = BY_ID.get(row.member);
  return {
    seq: Number(row.seq),
    member: row.member,
    screenName: member ? member.screenName : row.member,
    kind: row.kind,
    text: row.text,
    at: iso(row.created_at),
  };
}

function rowsOf(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function memberRows(db) {
  const rows = rowsOf(await db.prepare('SELECT member, last_seen, left_at, away FROM family_room_members').all());
  return new Map(rows.map((row) => [row.member, row]));
}

export function parseAfter(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/** The room as the page and the bots see it. `after` returns only newer lines. */
export async function readRoom(db, env, { after = null, now = Date.now() } = {}) {
  await ensureFamilyRoomSchema(db);
  const cols = 'seq, member, kind, text, created_at';
  let rows;
  if (after === null) {
    rows = rowsOf(await db.prepare(
      `SELECT ${cols} FROM family_room_messages WHERE hidden = 0 ORDER BY seq DESC LIMIT ?`,
    ).bind(PAGE_SIZE).all()).reverse();
  } else {
    rows = rowsOf(await db.prepare(
      `SELECT ${cols} FROM family_room_messages WHERE hidden = 0 AND seq > ? ORDER BY seq ASC LIMIT ?`,
    ).bind(after, PAGE_SIZE).all());
  }
  const hidden = rowsOf(await db.prepare(
    'SELECT seq FROM family_room_messages WHERE hidden = 1 ORDER BY seq DESC LIMIT ?',
  ).bind(PAGE_SIZE).all()).map((row) => Number(row.seq));
  const present = await memberRows(db);
  const messages = rows.map(publicMessage);
  const lastSeq = messages.length ? messages[messages.length - 1].seq : after ?? 0;
  return {
    ok: true,
    schema: 'pointcast.family-room/v1',
    room: ROOM,
    now: iso(now),
    members: MEMBERS.map((m) => publicMember(m, present.get(m.id), env, now)),
    messages,
    hidden,
    cursor: Math.max(lastSeq, after ?? 0),
    more: messages.length === PAGE_SIZE && after !== null,
    readGate: readGateOn(env),
  };
}

export function parsePost(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'send a JSON object' };
  if (body.text !== undefined && body.text !== null && typeof body.text !== 'string') return { ok: false, error: 'text must be a string' };
  if (typeof body.text === 'string' && body.text.trim().length > TEXT_MAX) return { ok: false, error: `${TEXT_MAX} characters at most` };
  const text = cleanText(body.text, TEXT_MAX);
  let away;
  if (body.away !== undefined && body.away !== null) {
    if (typeof body.away !== 'string') return { ok: false, error: 'away must be a string, empty to come back' };
    away = cleanText(body.away, AWAY_MAX).replace(/\n+/g, ' ');
  }
  const leave = body.leave === true;
  return { ok: true, text, away, leave };
}

/**
 * One bot speaks, sets an away message, or leaves. A post with none of
 * those still counts as being here. Coming back after being offline
 * writes an "entered the room" line first, as the old rooms did.
 */
export async function postToRoom(db, member, input, now = Date.now()) {
  await ensureFamilyRoomSchema(db);
  const row = await db.prepare('SELECT member, last_seen, left_at, away FROM family_room_members WHERE member = ?')
    .bind(member.id).first();
  const wasOffline = presence(row, now) === 'offline';

  if (input.text) {
    const recent = await db.prepare(
      "SELECT COUNT(*) AS n FROM family_room_messages WHERE member = ? AND kind = 'say' AND created_at > ?",
    ).bind(member.id, now - BURST_WINDOW_MS).first();
    if (Number(recent?.n) >= BURST_MAX) {
      return { ok: false, status: 429, error: `${BURST_MAX} lines every ten minutes per bot. Let someone else talk.` };
    }
  }

  const lines = [];
  const insert = async (kind, text) => {
    const res = await db.prepare(
      'INSERT INTO family_room_messages (member, kind, text, created_at) VALUES (?, ?, ?, ?)',
    ).bind(member.id, kind, text, now).run();
    const seq = Number(res?.meta?.last_row_id);
    lines.push(publicMessage({ seq, member: member.id, kind, text, created_at: now }));
  };

  // An offline bot that only says "leave" was never here, so it gets no lines.
  const here = !wasOffline || Boolean(input.text) || !input.leave;
  if (wasOffline && here) await insert('enter', `${member.screenName} has entered the room.`);
  if (input.text) await insert('say', input.text);
  if (input.leave && here) await insert('leave', `${member.screenName} has left the room.`);

  // Talking brings a bot back from away unless it set a new away line in the same post.
  let away = row?.away || null;
  if (input.away !== undefined) away = input.away || null;
  else if (input.text) away = null;

  const lastSeen = input.leave ? Number(row?.last_seen) || now - 1 : now;
  const leftAt = input.leave ? now : null;
  await db.prepare(
    `INSERT INTO family_room_members (member, last_seen, left_at, away) VALUES (?, ?, ?, ?)
     ON CONFLICT(member) DO UPDATE SET last_seen = excluded.last_seen, left_at = excluded.left_at, away = excluded.away`,
  ).bind(member.id, lastSeen, leftAt, away).run();

  if (lines.length) {
    await db.prepare(
      'DELETE FROM family_room_messages WHERE seq <= (SELECT MAX(seq) FROM family_room_messages) - ?',
    ).bind(KEEP_MESSAGES).run();
  }

  const status = presence({ last_seen: lastSeen, left_at: leftAt, away }, now);
  return { ok: true, status: 201, lines, you: { id: member.id, screenName: member.screenName, status, away: status === 'offline' ? null : away } };
}

export async function hideMessage(db, seq) {
  await ensureFamilyRoomSchema(db);
  const n = parseAfter(seq);
  if (n === null || n === 0) return { ok: false, status: 400, error: 'hide needs a message seq' };
  const res = await db.prepare('UPDATE family_room_messages SET hidden = 1 WHERE seq = ?').bind(n).run();
  if (!Number(res?.meta?.changes)) return { ok: false, status: 404, error: 'no such message' };
  return { ok: true, status: 200, hidden: n };
}

/** Setup facts a person or a bot can read without any key. */
export function setupStatus(env) {
  return {
    dbBound: Boolean(env?.AUTH_DB),
    readGate: readGateOn(env),
    adminKeySet: Boolean(usableKey(env?.FAMILY_ROOM_ADMIN_KEY)),
    keys: MEMBERS.map((m) => ({ member: m.id, env: m.keyEnv, set: memberReady(env, m) })),
    keyMinLength: KEY_MIN,
  };
}

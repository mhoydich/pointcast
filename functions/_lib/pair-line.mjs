/**
 * Pair Line. A private line between two (up to six) people's own AIs, at
 * /pair-line/. Asked for by Mike, 2026-11-01: "how do we set up so people can
 * chat bot to bot", "even now morgan and i are trying to pass information to
 * each others ai and its pain", and "def human".
 *
 * The one rule: a bot drafts, its human shares. Nothing a bot writes reaches
 * anyone else until that bot's own person approves it, and every shared line
 * says whose bot wrote it and who approved it.
 *
 *   create  a person opens a line and names who to invite. They get their own
 *           person key and bot key, plus one invite code per invitee.
 *   join    each invitee opts in with their code and gets their own keys.
 *           Until everyone invited has joined, nothing can be said.
 *   say     with a bot key: held for that bot's person. With a person key:
 *           shared at once (a person typing is already a person deciding).
 *   approve / decline   a person decides on their own bot's held lines only.
 *   leave   a person steps out; their keys stop working.
 *   close   any person ends the line for everyone; erase: true deletes every
 *           line on it as well.
 *
 * Privacy: unlisted, never indexed, no read without a member key, keys are
 * stored only as SHA-256 hashes, held lines are never shown to other members,
 * held lines expire after HOLD_MS, idle lines are purged after IDLE_PURGE_MS.
 *
 * Storage is AUTH_DB (D1), created on first use like the Family Room.
 */

export const SPEC = 'pointcast.pair-line/v1';
export const TEXT_MAX = 1000;
export const LABEL_MAX = 32;
export const TITLE_MAX = 60;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 6;
export const PAGE_SIZE = 100;
export const KEEP_MESSAGES = 1000;
export const HOLD_MS = 72 * 60 * 60 * 1000;
export const IDLE_PURGE_MS = 30 * 24 * 60 * 60 * 1000;
export const BURST_WINDOW_MS = 10 * 60 * 1000;
export const BURST_MAX = 30;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS pair_lines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    closed_at INTEGER,
    closed_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS pair_members (
    line_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    label TEXT NOT NULL,
    bot_label TEXT,
    invite_hash TEXT,
    person_hash TEXT,
    bot_hash TEXT,
    invited_at INTEGER NOT NULL,
    joined_at INTEGER,
    left_at INTEGER,
    PRIMARY KEY (line_id, member_id)
  )`,
  'CREATE INDEX IF NOT EXISTS pair_members_invite ON pair_members (invite_hash)',
  'CREATE INDEX IF NOT EXISTS pair_members_person ON pair_members (person_hash)',
  'CREATE INDEX IF NOT EXISTS pair_members_bot ON pair_members (bot_hash)',
  `CREATE TABLE IF NOT EXISTS pair_messages (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    line_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    author TEXT NOT NULL CHECK (author IN ('person', 'bot')),
    status TEXT NOT NULL CHECK (status IN ('held', 'shared', 'declined', 'expired')),
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    decided_at INTEGER
  )`,
  'CREATE INDEX IF NOT EXISTS pair_messages_line ON pair_messages (line_id, seq)',
  'CREATE INDEX IF NOT EXISTS pair_messages_burst ON pair_messages (line_id, member_id, created_at)',
];

const provisioned = new WeakMap();

/** Create the tables if missing; cached per binding so it runs once per isolate. */
export function ensurePairLineSchema(db) {
  let pending = provisioned.get(db);
  if (!pending) {
    pending = (async () => { for (const statement of SCHEMA) await db.prepare(statement).run(); })()
      .catch((error) => { provisioned.delete(db); throw error; });
    provisioned.set(db, pending);
  }
  return pending;
}

export function cleanText(raw, max) {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/** A display label: a first name or nickname the person chose. Never a full address. */
export function cleanLabel(raw) {
  const label = cleanText(raw, LABEL_MAX).replace(/\n/g, ' ');
  if (!label || !/\p{L}/u.test(label)) return '';
  if (/https?:|www\.|@|\.[a-z]{2,}\b/i.test(label)) return '';
  return label;
}

const randomHex = (bytes) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
export const newKey = (prefix) => `${prefix}_${randomHex(24)}`;
export async function hashKey(key) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pair-line|${key}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Which kind of key this is, from its prefix. The prefix is a hint; only the hash lookup grants anything. */
export function keyKind(key) {
  if (typeof key !== 'string' || key.length < 20 || key.length > 80) return null;
  if (key.startsWith('plp_')) return 'person';
  if (key.startsWith('plb_')) return 'bot';
  if (key.startsWith('pli_')) return 'invite';
  return null;
}

const err = (status, error, extra = {}) => ({ ok: false, status, error, ...extra });

async function lineById(db, id) {
  return db.prepare('SELECT id, title, created_at, updated_at, closed_at, closed_by FROM pair_lines WHERE id = ?').bind(id).first();
}
async function membersOf(db, lineId) {
  const { results } = await db.prepare('SELECT member_id, label, bot_label, invited_at, joined_at, left_at FROM pair_members WHERE line_id = ? ORDER BY invited_at, member_id').bind(lineId).all();
  return results ?? [];
}

/** Look up who a key belongs to. Returns { kind, member, line } or null. */
export async function resolveKey(db, key) {
  const kind = keyKind(key);
  if (!kind) return null;
  const column = kind === 'person' ? 'person_hash' : kind === 'bot' ? 'bot_hash' : 'invite_hash';
  const hash = await hashKey(key);
  const member = await db.prepare(`SELECT line_id, member_id, label, bot_label, joined_at, left_at FROM pair_members WHERE ${column} = ?`).bind(hash).first();
  if (!member) return null;
  if (kind !== 'invite' && member.left_at) return null;
  const line = await lineById(db, member.line_id);
  if (!line) return null;
  return { kind, member, line };
}

/** Everyone invited has joined and nobody has closed it. */
function lineState(line, members) {
  if (line.closed_at) return 'closed';
  const active = members.filter((m) => !m.left_at);
  if (active.length < MIN_MEMBERS) return 'ended';
  if (active.some((m) => !m.joined_at)) return 'waiting';
  return 'open';
}

export function parseCreate(body) {
  const title = cleanText(body?.title, TITLE_MAX).replace(/\n/g, ' ') || 'Pair Line';
  const you = cleanLabel(body?.you?.label ?? body?.you);
  if (!you) return { ok: false, error: 'Give your own first name or nickname as you.label (letters, no links).' };
  const yourBot = cleanLabel(body?.you?.bot ?? '') || `${you}'s AI`;
  const raw = Array.isArray(body?.invite) ? body.invite : [];
  const invite = raw.map((entry) => cleanLabel(typeof entry === 'string' ? entry : entry?.label)).filter(Boolean);
  if (invite.length !== raw.length || invite.length < MIN_MEMBERS - 1) return { ok: false, error: 'Name at least one person to invite (first name or nickname, letters, no links).' };
  if (invite.length > MAX_MEMBERS - 1) return { ok: false, error: `A line holds at most ${MAX_MEMBERS} people.` };
  const all = [you, ...invite].map((l) => l.toLowerCase());
  if (new Set(all).size !== all.length) return { ok: false, error: 'Each person needs a different name on the line.' };
  return { ok: true, title, you, yourBot, invite };
}

/** Open a line. The creator joins at once; everyone else gets an invite code. */
export async function createLine(db, parsed, now = Date.now()) {
  await ensurePairLineSchema(db);
  const id = `pl_${randomHex(10)}`;
  await db.prepare('INSERT INTO pair_lines (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').bind(id, parsed.title, now, now).run();
  const personKey = newKey('plp');
  const botKey = newKey('plb');
  await db.prepare('INSERT INTO pair_members (line_id, member_id, label, bot_label, person_hash, bot_hash, invited_at, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, 'm1', parsed.you, parsed.yourBot, await hashKey(personKey), await hashKey(botKey), now, now).run();
  const invites = [];
  for (const [i, label] of parsed.invite.entries()) {
    const code = newKey('pli');
    await db.prepare('INSERT INTO pair_members (line_id, member_id, label, invite_hash, invited_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, `m${i + 2}`, label, await hashKey(code), now).run();
    invites.push({ label, inviteCode: code });
  }
  return {
    ok: true, status: 201, line: { id, title: parsed.title, state: 'waiting' },
    you: { label: parsed.you, bot: parsed.yourBot, personKey, botKey },
    invites,
    next: 'Send each person their own invite code privately (a text, not a group chat). The line opens when everyone has joined. Keep your person key to yourself; give the bot key only to your own AI.',
  };
}

/** An invitee opts in with their code. The code is spent; they get their own keys. */
export async function joinLine(db, inviteCode, body, now = Date.now()) {
  await ensurePairLineSchema(db);
  const found = await resolveKey(db, inviteCode);
  if (!found || found.kind !== 'invite') return err(401, 'That invite code is not valid.');
  if (found.member.joined_at || found.member.left_at) return err(409, 'That invite was already used.');
  if (found.line.closed_at) return err(409, 'That line was closed.');
  const bot = cleanLabel(body?.bot ?? '') || `${found.member.label}'s AI`;
  const personKey = newKey('plp');
  const botKey = newKey('plb');
  const w = await db.prepare('UPDATE pair_members SET joined_at = ?, bot_label = ?, person_hash = ?, bot_hash = ?, invite_hash = NULL WHERE line_id = ? AND member_id = ? AND joined_at IS NULL')
    .bind(now, bot, await hashKey(personKey), await hashKey(botKey), found.line.id, found.member.member_id).run();
  if ((w.meta?.changes ?? 0) !== 1) return err(409, 'That invite was already used.');
  await db.prepare('UPDATE pair_lines SET updated_at = ? WHERE id = ?').bind(now, found.line.id).run();
  const state = lineState(found.line, await membersOf(db, found.line.id));
  return { ok: true, status: 201, line: { id: found.line.id, title: found.line.title, state }, you: { label: found.member.label, bot, personKey, botKey } };
}

async function expireHeld(db, lineId, now) {
  await db.prepare("UPDATE pair_messages SET status = 'expired', decided_at = ? WHERE line_id = ? AND status = 'held' AND created_at < ?").bind(now, lineId, now - HOLD_MS).run();
}

/** What one key may read: every shared line, plus its own side's held and declined lines. */
export async function readLine(db, key, { after = 0, now = Date.now() } = {}) {
  await ensurePairLineSchema(db);
  const who = await resolveKey(db, key);
  if (!who || who.kind === 'invite') return err(401, 'A person key or bot key for this line is needed to read it.');
  const { line, member } = who;
  await expireHeld(db, line.id, now);
  const members = await membersOf(db, line.id);
  const byId = new Map(members.map((m) => [m.member_id, m]));
  const { results } = await db.prepare(`SELECT seq, member_id, author, status, text, created_at, decided_at FROM pair_messages
    WHERE line_id = ? AND seq > ? AND (status = 'shared' OR member_id = ?) ORDER BY seq LIMIT ?`).bind(line.id, after, member.member_id, PAGE_SIZE).all();
  const messages = (results ?? []).map((row) => {
    const m = byId.get(row.member_id) ?? { label: '?', bot_label: '?' };
    return {
      seq: row.seq, status: row.status, text: row.text, at: new Date(row.created_at).toISOString(),
      from: row.author === 'bot' ? { kind: 'bot', name: m.bot_label, for: m.label } : { kind: 'person', name: m.label },
      ...(row.author === 'bot' && row.status === 'shared' ? { approvedBy: m.label, approvedAt: new Date(row.decided_at).toISOString() } : {}),
      mine: row.member_id === member.member_id,
    };
  });
  return {
    ok: true, status: 200, spec: SPEC,
    line: { id: line.id, title: line.title, state: lineState(line, members), createdAt: new Date(line.created_at).toISOString() },
    you: { kind: who.kind, label: member.label, bot: member.bot_label },
    people: members.map((m) => ({ label: m.label, bot: m.bot_label ?? null, joined: !!m.joined_at, left: !!m.left_at })),
    messages, cursor: messages.length ? messages.at(-1).seq : after, more: messages.length === PAGE_SIZE,
    rule: 'A bot drafts, its person shares. Bot lines stay held until that bot\'s own person approves them.',
  };
}

export function parseSay(body) {
  const text = cleanText(body?.text, TEXT_MAX);
  if (!text) return { ok: false, error: `Send {"text": "..."} up to ${TEXT_MAX} characters.` };
  return { ok: true, text };
}

/** Say something. A bot's line is held for its person; a person's line is shared. */
export async function sayOnLine(db, key, parsed, now = Date.now()) {
  await ensurePairLineSchema(db);
  const who = await resolveKey(db, key);
  if (!who || who.kind === 'invite') return err(401, 'A person key or bot key for this line is needed.');
  const state = lineState(who.line, await membersOf(db, who.line.id));
  if (state === 'waiting') return err(409, 'Not everyone has joined yet. Nothing can be said until they do.', { state });
  if (state !== 'open') return err(409, 'This line is no longer open.', { state });
  const recent = await db.prepare('SELECT COUNT(*) AS n FROM pair_messages WHERE line_id = ? AND member_id = ? AND created_at > ?')
    .bind(who.line.id, who.member.member_id, now - BURST_WINDOW_MS).first();
  if ((recent?.n ?? 0) >= BURST_MAX) return err(429, `At most ${BURST_MAX} lines per person every ten minutes. Wait a little.`);
  const author = who.kind === 'bot' ? 'bot' : 'person';
  const status = author === 'bot' ? 'held' : 'shared';
  const r = await db.prepare('INSERT INTO pair_messages (line_id, member_id, author, status, text, created_at, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(who.line.id, who.member.member_id, author, status, parsed.text, now, status === 'shared' ? now : null).run();
  await db.prepare('UPDATE pair_lines SET updated_at = ? WHERE id = ?').bind(now, who.line.id).run();
  await trim(db, who.line.id);
  return {
    ok: true, status: 201, seq: r.meta?.last_row_id ?? null, state: status,
    note: status === 'held' ? `Held for ${who.member.label}. Nobody else sees it until ${who.member.label} approves it.` : 'Shared with the line.',
  };
}

async function trim(db, lineId) {
  const row = await db.prepare('SELECT seq FROM pair_messages WHERE line_id = ? ORDER BY seq DESC LIMIT 1 OFFSET ?').bind(lineId, KEEP_MESSAGES).first();
  if (row) await db.prepare('DELETE FROM pair_messages WHERE line_id = ? AND seq <= ?').bind(lineId, row.seq).run();
}

/** A person approves or declines one of their own bot's held lines. */
export async function decide(db, key, seqRaw, approve, now = Date.now()) {
  await ensurePairLineSchema(db);
  const who = await resolveKey(db, key);
  if (!who || who.kind !== 'person') return err(401, 'Only a person key can approve or decline. A bot cannot approve its own lines.');
  const seq = Number(seqRaw);
  if (!Number.isSafeInteger(seq) || seq < 1) return err(400, 'Send the seq of the held line.');
  await expireHeld(db, who.line.id, now);
  const state = lineState(who.line, await membersOf(db, who.line.id));
  if (approve && state !== 'open') return err(409, 'This line is no longer open.', { state });
  const w = await db.prepare(`UPDATE pair_messages SET status = ?, decided_at = ? WHERE seq = ? AND line_id = ? AND member_id = ? AND author = 'bot' AND status = 'held'`)
    .bind(approve ? 'shared' : 'declined', now, seq, who.line.id, who.member.member_id).run();
  if ((w.meta?.changes ?? 0) !== 1) return err(404, 'No held line of your own bot with that seq. (It may have expired, been decided, or belong to someone else.)');
  await db.prepare('UPDATE pair_lines SET updated_at = ? WHERE id = ?').bind(now, who.line.id).run();
  return { ok: true, status: 200, seq, state: approve ? 'shared' : 'declined' };
}

/** A person steps out. Their keys stop working; held lines of theirs are dropped. */
export async function leaveLine(db, key, now = Date.now()) {
  await ensurePairLineSchema(db);
  const who = await resolveKey(db, key);
  if (!who || who.kind !== 'person') return err(401, 'Only a person key can leave a line.');
  await db.prepare('UPDATE pair_members SET left_at = ?, person_hash = NULL, bot_hash = NULL WHERE line_id = ? AND member_id = ?').bind(now, who.line.id, who.member.member_id).run();
  await db.prepare("DELETE FROM pair_messages WHERE line_id = ? AND member_id = ? AND status <> 'shared'").bind(who.line.id, who.member.member_id).run();
  await db.prepare('UPDATE pair_lines SET updated_at = ? WHERE id = ?').bind(now, who.line.id).run();
  return { ok: true, status: 200, left: true };
}

/** Any person ends the line for everyone. erase: true deletes every line on it too. */
export async function closeLine(db, key, { erase = false } = {}, now = Date.now()) {
  await ensurePairLineSchema(db);
  const who = await resolveKey(db, key);
  if (!who || who.kind !== 'person') return err(401, 'Only a person key can close a line.');
  await db.prepare('UPDATE pair_lines SET closed_at = COALESCE(closed_at, ?), closed_by = COALESCE(closed_by, ?), updated_at = ? WHERE id = ?').bind(now, who.member.label, now, who.line.id).run();
  await db.prepare('UPDATE pair_members SET invite_hash = NULL WHERE line_id = ?').bind(who.line.id).run();
  if (erase) {
    await db.prepare('DELETE FROM pair_messages WHERE line_id = ?').bind(who.line.id).run();
    await db.prepare('DELETE FROM pair_members WHERE line_id = ?').bind(who.line.id).run();
    await db.prepare('DELETE FROM pair_lines WHERE id = ?').bind(who.line.id).run();
  }
  return { ok: true, status: 200, closed: true, erased: !!erase };
}

/** Delete lines nobody has touched in IDLE_PURGE_MS. Called lazily on create. */
export async function purgeIdle(db, now = Date.now()) {
  await ensurePairLineSchema(db);
  const { results } = await db.prepare('SELECT id FROM pair_lines WHERE updated_at < ? LIMIT 50').bind(now - IDLE_PURGE_MS).all();
  for (const { id } of results ?? []) {
    await db.prepare('DELETE FROM pair_messages WHERE line_id = ?').bind(id).run();
    await db.prepare('DELETE FROM pair_members WHERE line_id = ?').bind(id).run();
    await db.prepare('DELETE FROM pair_lines WHERE id = ?').bind(id).run();
  }
  return (results ?? []).length;
}

/** Pair Line lands dark: it answers only once PAIR_LINE_ENABLED is exactly "true". */
export const pairLineOpen = (env) => String(env?.PAIR_LINE_ENABLED ?? '').trim() === 'true';
export const PAIR_LINE_CLOSED = 'Pair Line is not open yet.';

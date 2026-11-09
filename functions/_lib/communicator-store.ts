/**
 * The Communicator (/api/communicator) — storage over D1 `AUTH_DB`, matched
 * against docs/prd/communicator-v1.md section 4.1 and migrations/auth/0033.
 * The pure rules (profiles, matchmaking, the game state machine, ratings) live
 * in public/communicator/engine.mjs and ledger.mjs and are imported, never
 * reimplemented; this file is the SQL and the venue mapping.
 *
 * The privacy split is enforced in the queries, not by filtering in JS:
 * payload_json (contact included) is read by exactly one function, getProfile
 * with asSelf true; every other read selects public_json or explicit json_extract
 * paths that cannot reach `$.contact`. Games, messages and ledger rows carry
 * handles only (the engine guarantees it).
 *
 * Venues come from src/data/courts-schedule.json. Like air-board-store.ts, this
 * file takes the schedule as an argument (plain node cannot import JSON without
 * an attribute); the routes import the real file and pass it in.
 */
// @ts-ignore — plain modules shared with the tests and the browser
import * as E from '../../public/communicator/engine.mjs';
// @ts-ignore — plain modules shared with the tests and the browser
import * as L from '../../public/communicator/ledger.mjs';

export type CommunicatorEnv = { AUTH_DB?: D1Database; PC_RATES_KV?: KVNamespace };

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });

export const REFUSALS: Record<string, number> = {
  'bad-json': 400, 'bad-request': 400, 'bad-field': 400, 'unknown-field': 400, 'contact-not-editable': 400, 'unknown-ladder': 404,
  'bad-slot': 400, 'bad-candidates': 400, 'unauthenticated': 401, 'bad-origin': 403, 'tier-2-required': 403, 'not-your-game': 403,
  'not-found': 404, 'profile-required': 409, 'db-not-bound': 503, 'unavailable': 503,
};
export const fail = (reason: string, extra: Record<string, unknown> = {}) => json({ ok: false, reason, ...extra }, REFUSALS[reason] ?? 400);
export const unavailable = () => fail('db-not-bound');

// ---- shapes ------------------------------------------------------------------------------
export type Profile = {
  schema: 'coordination/profile/1'; id: string; handle: string; display: string; town: string;
  identity: { tier: number; proofs: { provider: string; verifiedAt: string }[] };
  contact: { email?: string; phone?: string; push?: string };
  channels: { sms: boolean; email: boolean; push: boolean; quietHours: { start: string; end: string } };
  consent: { communicator: boolean; contactableBy: string[]; listed: boolean };
  ladders: Record<string, { declared: number | null }>;
  availability: { days: number[]; start: string; end: string }[];
  venues: string[]; recent: { gamesLast30: number; lastInvitedAt: string | null };
};
export type PublicProfile = { handle: string; display: string; town: string; tier: number; venues: string[]; listed: boolean };
/** What findCandidates reads, and nothing else: no `contact`, no `identity`, no `channels`. */
export type CandidateProfile = PublicProfile & {
  consent: Profile['consent']; availability: Profile['availability']; venues: string[];
  ladders: Record<string, { declared: number | null }>; recent: Profile['recent'];
};
export type Game = {
  id: string; ladder: string; host: string; status: string; slot: { start: string; end: string; court?: string; note?: string };
  roster: { in: string[]; maybe: string[]; out: string[]; invited: string[]; waitlist: string[] };
  history: unknown[]; createdAt: string; [k: string]: unknown;
};
export type LedgerEntry = { id: string; ladder: string; kind: string; at: string; status: string; [k: string]: unknown };
export type Venue = {
  id: string; name: string; short: string; address: string; hours: { open: string; close: string };
  blocks: { label: string; days: number[]; start: string; end: string }[]; reserve: { label: string; url: string } | null; aliases: string[];
};

// ---- venues ------------------------------------------------------------------------------
const VENUE_IDS = ['el-segundo', 'manhattan-heights'];
const SHORT: Record<string, string> = { 'el-segundo': 'Rec Park', 'manhattan-heights': 'Heights' };
const ALIASES: Record<string, string[]> = { 'el-segundo': ['rec park', 'rec', 'recreation park'], 'manhattan-heights': ['heights'] };

/**
 * courts-schedule.json -> the engine's venue shape. The engine takes one open/close pair, so where a
 * venue's hours differ by day (Heights) the narrowest window wins: latest open, earliest close.
 */
export function venuesFromSchedule(schedule: any): Venue[] {
  const out: Venue[] = [];
  for (const id of VENUE_IDS) {
    const c = (schedule?.courts || []).find((x: any) => x.id === id);
    if (!c) continue;
    const rules: any[] = c.hours?.rules?.length ? c.hours.rules : [{ open: '08:00', close: '20:00' }];
    const open = rules.map((r) => r.open).sort().at(-1) as string;
    const close = rules.map((r) => r.close).sort()[0] as string;
    const address = (c.facts || []).find((f: any) => f.key === 'address')?.text ?? '';
    out.push({
      id, name: c.name, short: SHORT[id] ?? c.name, address, hours: { open, close },
      blocks: (c.blocks || []).map((b: any) => ({ label: b.label, days: [...b.days], start: b.start, end: b.end })),
      reserve: c.reserve ? { label: c.reserve.label, url: c.reserve.url } : null, aliases: [...(ALIASES[id] || [])],
    });
  }
  return out;
}

/** The engine reads the UTC offset off `now` and treats the wall time as local: hand it Pacific wall time. */
export function laNowIso(ms: number): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset',
  }).formatToParts(new Date(ms));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const off = /GMT([+-]\d\d:\d\d)/.exec(p.timeZoneName || '')?.[1] ?? '-08:00';
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${off}`;
}

// ---- profiles ----------------------------------------------------------------------------
const iso = (at?: string | number) => new Date(at ?? Date.now()).toISOString();

/**
 * Owner-only full payload. `asSelf` false never touches payload_json: the query selects public_json,
 * so a caller that forgets the flag still cannot see a contact.
 */
export async function getProfile(db: D1Database, handle: string, { asSelf }: { asSelf: boolean }): Promise<Profile | PublicProfile | null> {
  if (!asSelf) return getPublicProfile(db, handle);
  const row = await db.prepare('SELECT payload_json FROM communicator_profiles WHERE handle = ?').bind(handle).first<{ payload_json: string }>();
  return row ? (JSON.parse(row.payload_json) as Profile) : null;
}

export async function getPublicProfile(db: D1Database, handle: string): Promise<PublicProfile | null> {
  const row = await db.prepare('SELECT public_json FROM communicator_profiles WHERE handle = ?').bind(handle).first<{ public_json: string }>();
  return row ? (JSON.parse(row.public_json) as PublicProfile) : null;
}

/** The signed-in user's own profile (full payload), found by user_id. */
export async function getProfileByUser(db: D1Database, userId: string): Promise<Profile | null> {
  const row = await db.prepare('SELECT payload_json FROM communicator_profiles WHERE user_id = ?').bind(userId).first<{ payload_json: string }>();
  return row ? (JSON.parse(row.payload_json) as Profile) : null;
}

export async function handleTaken(db: D1Database, handle: string): Promise<boolean> {
  return !!(await db.prepare('SELECT 1 AS x FROM communicator_profiles WHERE handle = ?').bind(handle).first());
}

export async function upsertProfile(db: D1Database, profile: Profile, { userId = null, at }: { userId?: string | null; at?: string | number } = {}): Promise<void> {
  const now = iso(at);
  await db.prepare(
    `INSERT INTO communicator_profiles (handle, user_id, payload_json, public_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(handle) DO UPDATE SET user_id = COALESCE(excluded.user_id, communicator_profiles.user_id),
       payload_json = excluded.payload_json, public_json = excluded.public_json, updated_at = excluded.updated_at`,
  ).bind(profile.handle, userId, JSON.stringify(profile), JSON.stringify(E.publicProfile(profile)), now, now).run();
}

/**
 * Public rows plus exactly the paths findCandidates reads. The contact is never selected: each
 * column is a json_extract of a named path, and the ladder entry is `$.ladders."<id>"` (declared only).
 */
export async function listCandidateProfiles(db: D1Database, ladder: string): Promise<CandidateProfile[]> {
  const lp = `$.ladders."${ladder.replace(/"/g, '')}"`;
  const { results } = await db.prepare(
    `SELECT public_json, json_extract(payload_json, '$.consent') AS consent, json_extract(payload_json, '$.availability') AS availability,
            json_extract(payload_json, '$.venues') AS venues, json_extract(payload_json, ?) AS ladder_entry, json_extract(payload_json, '$.recent') AS recent
       FROM communicator_profiles
      WHERE json_extract(payload_json, ?) IS NOT NULL AND json_extract(payload_json, '$.consent.communicator') = 1
      ORDER BY handle`,
  ).bind(lp, lp).all<{ public_json: string; consent: string; availability: string; venues: string; ladder_entry: string; recent: string }>();
  return (results || []).map((r) => ({
    ...(JSON.parse(r.public_json) as PublicProfile),
    consent: JSON.parse(r.consent), availability: JSON.parse(r.availability || '[]'), venues: JSON.parse(r.venues || '[]'),
    ladders: { [ladder]: JSON.parse(r.ladder_entry) }, recent: JSON.parse(r.recent || '{"gamesLast30":0,"lastInvitedAt":null}'),
  }));
}

// ---- games -------------------------------------------------------------------------------
export async function getGame(db: D1Database, id: string): Promise<Game | null> {
  const row = await db.prepare('SELECT state_json FROM communicator_games WHERE id = ?').bind(id).first<{ state_json: string }>();
  return row ? (JSON.parse(row.state_json) as Game) : null;
}

export async function putGame(db: D1Database, game: Game, { at }: { at?: string | number } = {}): Promise<void> {
  const now = iso(at);
  await db.prepare(
    `INSERT INTO communicator_games (id, ladder, host, status, state_json, slot_start, slot_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, state_json = excluded.state_json, slot_start = excluded.slot_start,
       slot_end = excluded.slot_end, updated_at = excluded.updated_at`,
  ).bind(game.id, game.ladder, game.host, game.status, JSON.stringify(game), game.slot.start, game.slot.end, game.createdAt || now, now).run();
}

/** Games where `handle` is the host or on any roster list (in, invited, maybe, waitlist, out), soonest first. */
export async function listGamesFor(db: D1Database, handle: string): Promise<Game[]> {
  const lists = ['in', 'invited', 'maybe', 'waitlist', 'out'];
  const clause = lists.map((l) => `EXISTS (SELECT 1 FROM json_each(communicator_games.state_json, '$.roster.${l}') j WHERE j.value = ?)`).join(' OR ');
  const { results } = await db.prepare(`SELECT state_json FROM communicator_games WHERE host = ? OR ${clause} ORDER BY slot_start`)
    .bind(handle, ...lists.map(() => handle)).all<{ state_json: string }>();
  return (results || []).map((r) => JSON.parse(r.state_json) as Game);
}

export const isPlayerIn = (game: Game, handle: string) =>
  game.host === handle || Object.values(game.roster).some((l) => l.includes(handle));

// ---- messages (read side only in v1-a; the queue is v1-b) ----------------------------------
export async function listPendingMessages(db: D1Database, handle: string) {
  const { results } = await db.prepare(
    `SELECT id, game_id, kind, text, replies_json, status, created_at FROM communicator_messages WHERE to_handle = ? AND status IN ('pending','sent') ORDER BY created_at`,
  ).bind(handle).all<any>();
  return (results || []).map((r) => ({ id: r.id, game: r.game_id, kind: r.kind, text: r.text, replies: JSON.parse(r.replies_json), status: r.status, at: r.created_at }));
}

/** Turning the opt-in off: every pending message for that person expires at once (PRD section 5.5). */
export async function expireMessagesFor(db: D1Database, handle: string, { at }: { at?: string | number } = {}): Promise<void> {
  await db.prepare(`UPDATE communicator_messages SET status = 'expired', updated_at = ? WHERE to_handle = ? AND status IN ('pending','sent')`).bind(iso(at), handle).run();
}

// ---- ledger (append-only) ------------------------------------------------------------------
/** One row per status change: id is `<entry id>#<created_at>#<nonce>`, the current entry is the latest row. */
export async function appendLedger(db: D1Database, entry: LedgerEntry, { at }: { at?: string | number } = {}): Promise<void> {
  const now = iso(at);
  const rowId = `${entry.id}#${now}#${crypto.randomUUID().slice(0, 8)}`;
  await db.prepare(
    `INSERT INTO communicator_ledger (id, ladder, kind, at, entry_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(rowId, entry.ladder, entry.kind, entry.at, JSON.stringify(entry), entry.status, now, now).run();
}

/** The current entry per entry id: the row with the latest created_at (insertion order breaks ties). */
export async function latestLedger(db: D1Database, ladder: string): Promise<LedgerEntry[]> {
  const { results } = await db.prepare('SELECT entry_json, status FROM communicator_ledger WHERE ladder = ? ORDER BY created_at, rowid').bind(ladder).all<{ entry_json: string; status: string }>();
  const byId = new Map<string, LedgerEntry>();
  for (const r of results || []) {
    const e = JSON.parse(r.entry_json) as LedgerEntry;
    byId.set(e.id, { ...e, status: r.status });
  }
  return [...byId.values()];
}

export async function confirmedLedger(db: D1Database, ladder: string): Promise<LedgerEntry[]> {
  return (await latestLedger(db, ladder)).filter((e) => e.status === 'confirmed');
}

// ---- okays -------------------------------------------------------------------------------
export async function recordOkay(db: D1Database, { actor, kind, targetGame, at }: { actor: string; kind: string; targetGame: string; at?: string | number }): Promise<string> {
  const when = iso(at);
  const id = `ok_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
  await db.prepare('INSERT INTO communicator_okays (id, actor, kind, target_game, okayed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, actor, kind, targetGame, when, when, when).run();
  return id;
}

export async function hasRecentOkay(db: D1Database, { actor, targetGame, withinMs, now }: { actor: string; targetGame: string; withinMs: number; now?: string | number }): Promise<boolean> {
  const since = iso((typeof now === 'number' ? now : now ? Date.parse(now) : Date.now()) - withinMs);
  return !!(await db.prepare('SELECT 1 AS x FROM communicator_okays WHERE actor = ? AND target_game = ? AND okayed_at >= ? LIMIT 1').bind(actor, targetGame, since).first());
}

/** Like hasRecentOkay, but the row must also be of one kind ('request' | 'invite' | 'remind' | 'score' | 'confirm-score'). */
export async function hasRecentOkayOfKind(db: D1Database, { actor, kind, targetGame, withinMs, now }: { actor: string; kind: string; targetGame: string; withinMs: number; now?: string | number }): Promise<boolean> {
  const since = iso((typeof now === 'number' ? now : now ? Date.parse(now) : Date.now()) - withinMs);
  return !!(await db.prepare('SELECT 1 AS x FROM communicator_okays WHERE actor = ? AND kind = ? AND target_game = ? AND okayed_at >= ? LIMIT 1').bind(actor, kind, targetGame, since).first());
}

// ---- ratings for the ledger route and /request -----------------------------------------------
/** handle -> declared level on one ladder, read through a single json_extract path (never the contact). */
export async function declaredLevels(db: D1Database, ladder: string): Promise<Record<string, number | null>> {
  const { results } = await db.prepare('SELECT handle, json_extract(payload_json, ?) AS declared FROM communicator_profiles')
    .bind(`$.ladders."${ladder.replace(/"/g, '')}".declared`).all<{ handle: string; declared: number | null }>();
  return Object.fromEntries((results || []).map((r) => [r.handle, r.declared ?? null]));
}

/** Two passes, as the demo does: declared levels seed the game walk, then the real ratings come out. */
export function ratingsFor(handles: string[], entries: LedgerEntry[], declared: Record<string, number | null>, now: string) {
  const seed = Object.fromEntries(Object.entries(declared).filter(([, v]) => v != null)) as Record<string, number>;
  return Object.fromEntries(handles.map((h) => [h, L.rate(h, { entries, declared: declared[h] ?? null, now, ratings: seed })]));
}

/**
 * The Communicator v1-b handlers (docs/prd/communicator-v1.md 4.2, 4.4, 4.5): invite, score, reply,
 * reminders. Route files stay thin and call these; plain node can test them (no JSON imports here).
 * Messages are only ever addressed by handle; the address is resolved inside communicator-deliver.ts.
 */
// @ts-ignore — plain modules shared with the tests and the browser
import * as E from '../../public/communicator/engine.mjs';
import { readSessionFromRequest } from '../api/auth/session.ts';
import { answersFor, actionableChips, deliver, sha256Hex, type DeliverEnv, type DeliverResult, type OutMail } from './communicator-deliver.ts';
import { isResident } from './air-desk-store.ts';
import { sendMail as realSendMail } from './mail.ts';
import {
  REFUSALS, appendLedger, fail, getGame, getProfileByUser, json, latestLedger, putGame, recordOkay, unavailable,
  type CommunicatorEnv, type Game, type LedgerEntry, type Profile,
} from './communicator-store.ts';

Object.assign(REFUSALS, {
  'bad-state': 409, 'bad-token': 404, 'already-used': 409, 'expired': 410, 'consent-required': 409, 'bad-answer': 400,
  'not-a-resident': 403, 'resident-key-unset': 503,
});

export type FlowEnv = CommunicatorEnv & DeliverEnv & { YARD_RESIDENT_KEY?: string };
export type FlowCtx = {
  request?: Request; env: FlowEnv; now?: number;
  sendMail?: (m: OutMail) => Promise<unknown>; capture?: (r: { id: string; to_handle: string; subject: string; text: string }) => void;
};
const nowOf = (c: FlowCtx) => c.now ?? Date.now();
const isoOf = (c: FlowCtx) => new Date(nowOf(c)).toISOString();

/** PointCast mail identity, as functions/api/auth/email/_shared.ts (EMAIL_FROM). */
const defaultSend = (env: FlowEnv) => async (m: OutMail) => {
  const r = await realSendMail({ from: 'PointCast <hello@pointcast.xyz>', ...m }, env as any);
  if (!r.configured) throw new Error('mail-not-configured');
  return r;
};
const deliverWith = (c: FlowCtx, messages: { id: string }[]): Promise<DeliverResult> =>
  deliver(c.env.AUTH_DB as D1Database, c.env, messages, {
    now: nowOf(c), sendMail: c.sendMail ?? defaultSend(c.env), origin: c.request ? new URL(c.request.url).origin : undefined, capture: c.capture,
  });

// ---- session gate (same rules as communicator-http.ts: db -> origin -> session -> tier -> body) ------
async function gate(c: FlowCtx, tier: 1 | 2): Promise<{ profile: Profile } | Response> {
  if (!c.env.AUTH_DB) return unavailable();
  const req = c.request as Request;
  const o = req.headers.get('Origin');
  if (o && o !== new URL(req.url).origin) return fail('bad-origin');
  let s;
  try { s = await readSessionFromRequest(req, c.env as any); } catch { return unavailable(); }
  if (!s) return fail('unauthenticated');
  if (((s.user.identities || []).some((i: any) => i.provider === 'google' || i.provider === 'kukai') ? 2 : 1) < tier) return fail('tier-2-required');
  const profile = await getProfileByUser(c.env.AUTH_DB, s.user.userId);
  return profile ? { profile } : fail('profile-required');
}
async function body(request: Request): Promise<Record<string, any> | Response> {
  const text = await request.text();
  if (text.length > 16_384) return fail('bad-request');
  try { const b = JSON.parse(text); return b && typeof b === 'object' && !Array.isArray(b) ? b : fail('bad-json'); } catch { return fail('bad-json'); }
}

// ---- message rows ------------------------------------------------------------------------
type Outbox = { id: string; to: string; kind: string; text: string; replies: string[]; game: string }[];
/** Insert engine Messages as 'pending' rows (idempotent on the deterministic id); returns the ones that are new. */
async function queue(db: D1Database, outbox: Outbox, nowIso: string): Promise<{ id: string }[]> {
  const made: { id: string }[] = [];
  for (const m of outbox) {
    const r = await db.prepare(
      `INSERT OR IGNORE INTO communicator_messages (id, game_id, to_handle, kind, text, replies_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    ).bind(m.id, m.game, m.to, m.kind, m.text, JSON.stringify(m.replies || []), nowIso, nowIso).run();
    if ((r.meta?.changes ?? 0) > 0) made.push({ id: m.id });
  }
  return made;
}
const tally = (d: DeliverResult) => ({ sent: d.sent, held: d.held, refused: d.refused });

// ---- POST /games/:id/invite --------------------------------------------------------------
/** Host invites the game's stored candidates; shared by POST /invite and the MCP tool (communicator-http.ts inviteGame). */
export async function inviteCore(c: FlowCtx, actor: string, id: string): Promise<ReplyResult> {
  const db = c.env.AUTH_DB as D1Database;
  const game = await getGame(db, id);
  if (!game) return refuse('not-found');
  if (game.host !== actor) return refuse('not-your-game');
  if (!['proposed', 'inviting', 'short'].includes(game.status)) return refuse('bad-state', { status: game.status });
  const handles: string[] = Array.isArray((game as any).candidates) ? (game as any).candidates : [];
  if (!handles.length) return refuse('bad-candidates');
  const now = isoOf(c);
  // Consent is resolved from the profile (consent + display only), then enforced by the engine, then again by the adapter.
  const marks = handles.map(() => '?').join(',');
  const { results } = await db.prepare(
    `SELECT handle, json_extract(public_json,'$.display') AS display, json_extract(payload_json,'$.consent') AS consent FROM communicator_profiles WHERE handle IN (${marks})`,
  ).bind(...handles).all<{ handle: string; display: string; consent: string | null }>();
  const found = new Map((results || []).map((r) => [r.handle, { handle: r.handle, display: r.display, consent: r.consent ? JSON.parse(r.consent) : {} }]));
  const ok = handles.filter((h) => found.has(h) && E.canContact(found.get(h)));
  const bad = handles.filter((h) => !ok.includes(h));
  let g: Game = game;
  if (bad.length) {
    g = structuredClone(g);
    for (const h of bad) g.history.push({ at: now, actor: 'system', op: 'invite-refused', detail: `${h}:consent-required` });
  }
  if (!ok.length) { await putGame(db, g, { at: nowOf(c) }); return refuse('consent-required', { refused: bad.length }); }
  await recordOkay(db, { actor: actor, kind: 'invite', targetGame: id, at: nowOf(c) });
  let res;
  try { res = E.invite(g, ok.map((h) => ({ handle: h, display: found.get(h)!.display })), { now, profiles: ok.map((h) => found.get(h)) }); }
  catch (e) { return refuse('consent-required', { detail: String((e as Error).message) }); }
  await putGame(db, res.game, { at: nowOf(c) });
  const made = await queue(db, res.outbox, now);
  const d = await deliverWith(c, made);
  return { status: 200, body: { ok: true, game: res.game, sent: d.sent, held: d.held, refused: d.refused + bad.length } };
}

export async function postInvite(c: FlowCtx, id: string): Promise<Response> {
  const a = await gate(c, 2);
  if (a instanceof Response) return a;
  const r = await inviteCore(c, a.profile.handle, id);
  return json(r.body, r.status);
}

// ---- POST /games/:id/score -----------------------------------------------------------------
/** A player logs a score; shared by POST /score and the MCP tool (communicator-http.ts scoreGame). */
export async function scoreCore(c: FlowCtx, actor: string, id: string, b: Record<string, any>): Promise<ReplyResult> {
  const db = c.env.AUTH_DB as D1Database;
  const game = await getGame(db, id);
  if (!game) return refuse('not-found');
  if (!game.roster.in.includes(actor)) return refuse('not-your-game');
  const sides = b.sides;
  const names = (s: any) => (Array.isArray(s) ? s : s?.players);
  if (!Array.isArray(sides) || sides.length !== 2 || sides.some((s) => !Array.isArray(names(s)) || names(s).some((h: any) => typeof h !== 'string'))) return refuse('bad-request');
  const scoreA = b.scoreA ?? b.scores?.[0] ?? sides[0]?.score, scoreB = b.scoreB ?? b.scores?.[1] ?? sides[1]?.score;
  const now = isoOf(c);
  let res;
  try {
    res = E.submitScore(game, { by: actor, now, sides: [{ players: names(sides[0]), score: scoreA }, { players: names(sides[1]), score: scoreB }] });
  } catch (e) { return refuse('bad-state', { detail: String((e as Error).message) }); }
  await putGame(db, res.game, { at: nowOf(c) });
  for (const l of res.ledger as LedgerEntry[]) await appendLedger(db, l, { at: nowOf(c) });
  const d = await deliverWith(c, await queue(db, res.outbox, now));
  return { status: 200, body: { ok: true, game: res.game, ledger: (res.ledger as LedgerEntry[]).map((l) => ({ id: l.id, status: l.status })), ...tally(d) } };
}

export async function postScore(c: FlowCtx, id: string): Promise<Response> {
  const a = await gate(c, 1);
  if (a instanceof Response) return a;
  const b = await body(c.request as Request);
  if (b instanceof Response) return b;
  const r = await scoreCore(c, a.profile.handle, id, b);
  return json(r.body, r.status);
}

/** A player confirms or disputes the logged score without a token (the MCP tool, communicator-http.ts confirmScoreGame). */
export async function confirmScoreCore(c: FlowCtx, actor: string, id: string, answer: unknown): Promise<ReplyResult> {
  if (answer !== 'confirm' && answer !== 'dispute') return refuse('bad-answer');
  const db = c.env.AUTH_DB as D1Database;
  const game = await getGame(db, id);
  if (!game) return refuse('not-found');
  if (!game.roster.in.includes(actor)) return refuse('not-your-game');
  const entry = (await latestLedger(db, game.ladder)).find((e) => e.id === (game as any).ledgerEntryId);
  if (!entry) return refuse('bad-state', { detail: 'no score logged' });
  const now = isoOf(c);
  let res: { game: Game; outbox: Outbox; ledger: LedgerEntry[] };
  try { res = answer === 'confirm' ? E.confirmScore(game, entry, { by: actor, now }) : E.disputeScore(game, entry, { by: actor, now }); }
  catch (e) { return refuse('bad-state', { detail: String((e as Error).message) }); }
  await putGame(db, res.game, { at: nowOf(c) });
  for (const l of res.ledger) await appendLedger(db, l, { at: nowOf(c) });
  await db.prepare(`UPDATE communicator_messages SET status = 'answered', answered_at = ?, updated_at = ? WHERE to_handle = ? AND game_id = ? AND kind = 'score-confirm' AND status IN ('pending','sent')`).bind(now, now, actor, id).run();
  const d = await deliverWith(c, await queue(db, res.outbox, now));
  return { status: 200, body: { ok: true, answered: answer, status: res.game.status, game: { id: res.game.id, status: res.game.status }, ...tally(d) } };
}

// ---- reply tokens: POST /reply and the /c/r/ page ------------------------------------------
export type MsgState =
  | { state: 'ok'; row: { id: string; game_id: string; to_handle: string; kind: string; text: string; replies: string[] } }
  | { state: 'unknown' | 'used' | 'expired' };

export async function lookupToken(db: D1Database, token: string, nowIso: string): Promise<MsgState> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { state: 'unknown' };
  const r = await db.prepare(`SELECT id, game_id, to_handle, kind, text, replies_json, status, expires_at FROM communicator_messages WHERE token_hash = ?`)
    .bind(await sha256Hex(token)).first<any>();
  if (!r) return { state: 'unknown' };
  if (r.status === 'answered') return { state: 'used' };
  if (r.status === 'expired' || (r.expires_at && r.expires_at < nowIso)) return { state: 'expired' };
  if (r.status !== 'sent') return { state: 'unknown' };
  return { state: 'ok', row: { id: r.id, game_id: r.game_id, to_handle: r.to_handle, kind: r.kind, text: r.text, replies: JSON.parse(r.replies_json) } };
}

export type ReplyResult = { status: number; body: Record<string, any> };
const refuse = (reason: string, extra: Record<string, unknown> = {}): ReplyResult => ({ status: REFUSALS[reason] ?? 400, body: { ok: false, reason, ...extra } });

/** One token, one answer: the shared logic behind POST /reply and POST /c/r/<token>. */
export async function applyReply(c: FlowCtx, token: string, answer: unknown, slot: { start: string; end: string } | null = null): Promise<ReplyResult> {
  if (!c.env.AUTH_DB) return refuse('db-not-bound');
  const db = c.env.AUTH_DB;
  const now = isoOf(c);
  const m = await lookupToken(db, token, now);
  if (m.state === 'unknown') return refuse('bad-token');
  if (m.state === 'used') return refuse('already-used');
  if (m.state === 'expired') return refuse('expired');
  const { row } = m;
  if (typeof answer !== 'string' || !answersFor(row.kind).includes(answer)) return refuse('bad-answer');
  const game = await getGame(db, row.game_id);
  if (!game) return refuse('not-found');
  let res: { game: Game; outbox: Outbox; ledger?: LedgerEntry[] };
  try {
    if (row.kind === 'score-confirm') {
      const entry = (await latestLedger(db, game.ladder)).find((e) => e.id === (game as any).ledgerEntryId);
      if (!entry) return refuse('not-found');
      res = answer === 'confirm' ? E.confirmScore(game, entry, { by: row.to_handle, now }) : E.disputeScore(game, entry, { by: row.to_handle, now });
    } else {
      res = E.reply(game, { handle: row.to_handle, answer, slot, now });
    }
  } catch (e) { return refuse('bad-state', { detail: String((e as Error).message) }); }
  // Claim the token only once the engine accepted the answer; the conditional UPDATE settles any race.
  const claim = await db.prepare(`UPDATE communicator_messages SET status = 'answered', answered_at = ?, updated_at = ? WHERE id = ? AND status = 'sent'`).bind(now, now, row.id).run();
  if ((claim.meta?.changes ?? 0) !== 1) return refuse('already-used');
  await putGame(db, res.game, { at: nowOf(c) });
  for (const l of res.ledger || []) await appendLedger(db, l, { at: nowOf(c) });
  const d = await deliverWith(c, await queue(db, res.outbox, now));
  const open = await db.prepare(`SELECT kind, text, replies_json FROM communicator_messages WHERE to_handle = ? AND game_id = ? AND status = 'sent' AND id != ? ORDER BY created_at`)
    .bind(row.to_handle, row.game_id, row.id).all<{ kind: string; text: string; replies_json: string }>();
  const next = (open.results || []).map((r) => ({ kind: r.kind, text: r.text, chips: actionableChips(r.kind, JSON.parse(r.replies_json)) })).filter((n) => n.chips.length);
  return { status: 200, body: { ok: true, answered: answer, status: res.game.status, game: { id: res.game.id, status: res.game.status }, next, ...tally(d) } };
}

export async function postReply(c: FlowCtx): Promise<Response> {
  if (!c.env.AUTH_DB) return unavailable();
  const b = await body(c.request as Request);
  if (b instanceof Response) return b;
  if (typeof b.token !== 'string') return fail('bad-request');
  const slot = b.slot && typeof b.slot.start === 'string' && typeof b.slot.end === 'string' ? { start: b.slot.start, end: b.slot.end } : null;
  const r = await applyReply(c, b.token, b.answer, slot);
  return json(r.body, r.status);
}

// ---- POST /reminders (resident-only; a cron caller) ------------------------------------------
/** The reminders sweep; shared by POST /reminders and the MCP tool (communicator-http.ts sendDueReminders). */
export async function remindersCore(c: FlowCtx): Promise<ReplyResult> {
  const db = c.env.AUTH_DB as D1Database;
  const now = isoOf(c);
  const { results } = await db.prepare(`SELECT state_json FROM communicator_games WHERE status = 'confirmed' ORDER BY slot_start`).all<{ state_json: string }>();
  let games = 0, queued = 0;
  for (const r of results || []) {
    let g = JSON.parse(r.state_json) as Game;
    const due = E.dueReminders(g, { now }) as Outbox;
    if (!due.length) continue;
    games++;
    queued += (await queue(db, due, now)).length;
    for (const kind of [...new Set(due.map((m) => m.kind))]) g = E.markReminderSent(g, kind, { now }).game;
    await putGame(db, g, { at: nowOf(c) });
  }
  // One pass over everything still pending from the last 72 hours also retries quiet-hours holds.
  const pending = await db.prepare(`SELECT id FROM communicator_messages WHERE status = 'pending' AND created_at >= ? ORDER BY created_at`)
    .bind(new Date(nowOf(c) - 72 * 3600_000).toISOString()).all<{ id: string }>();
  const d = await deliverWith(c, pending.results || []);
  return { status: 200, body: { ok: true, games, queued, ...tally(d) } };
}

export async function postReminders(c: FlowCtx): Promise<Response> {
  if (!c.env.AUTH_DB) return unavailable();
  if (!c.env.YARD_RESIDENT_KEY) return fail('resident-key-unset');
  if (!(await isResident(c.request as Request, c.env))) return fail('not-a-resident');
  const r = await remindersCore(c);
  return json(r.body, r.status);
}

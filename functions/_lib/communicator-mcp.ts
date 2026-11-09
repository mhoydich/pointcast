/**
 * The Communicator's MCP tools (docs/prd/communicator-v1.md 4.3), as plain functions so node can test them
 * without loading the whole MCP server. functions/api/mcp.ts special-cases these names in tools/call and
 * passes the raw request (agent-identity headers) and the venues.
 *
 * Every write and consent tool: AUTH_DB bound -> agent proof verified when its headers are present ->
 * the person's okay row (kind, actor, game) within 10 minutes -> the action. The okay row is ALWAYS checked;
 * the `okay: {by, at}` argument is only a claim and is never trusted on its own.
 * Wiring: v1-b supplies inviteGame, sendDueReminders, scoreGame and confirmScoreGame in communicator-http.ts.
 * Until they exist those tools answer { ok: false, reason: 'not-yet-wired' } after the okay check.
 */
import * as H from './communicator-http.ts';
import { confirmedLedger, declaredLevels, getGame, getProfile, hasRecentOkayOfKind, ratingsFor, type CommunicatorEnv, type Game, type Venue } from './communicator-store.ts';
import { hashAgentActionRequest, verifyAgentRequest } from './agent-identity.ts';
// @ts-ignore — plain module shared with the tests and the browser
import * as L from '../../public/communicator/ledger.mjs';

export const COMMUNICATOR_TOOL_NAMES = [
  'communicator_ledger', 'communicator_game', 'communicator_request', 'communicator_invite',
  'communicator_remind', 'communicator_score', 'communicator_confirm_score',
] as const;
export const COMMUNICATOR_WRITE_TOOL_NAMES = ['communicator_request', 'communicator_score', 'communicator_confirm_score'] as const;
export const COMMUNICATOR_CONSENT_TOOL_NAMES = ['communicator_invite', 'communicator_remind'] as const;

const OKAY_WINDOW_MS = 10 * 60_000;
const OKAY_KIND: Record<string, string> = {
  communicator_request: 'request', communicator_invite: 'invite', communicator_remind: 'remind',
  communicator_score: 'score', communicator_confirm_score: 'confirm-score',
};
const LADDER = L.DEFAULT_LADDER.id as string;
const HANDLE = /^[a-z0-9-]{1,32}$/;

export type ToolOut = { ok: boolean; reason?: string; [k: string]: unknown };
const refuse = (reason: string, extra: Record<string, unknown> = {}): ToolOut => ({ ok: false, reason, ...extra });

/** A game for a bot: names and handles only. No contact, no history, no candidate list. */
export function publicGame(g: Game) {
  const { id, ladder, host, status, slot, roster, score } = g as Record<string, any>;
  return { id, ladder, host, hostDisplay: g.hostDisplay ?? null, status, slot, roster, score: score ?? null };
}

async function ledger(env: CommunicatorEnv, args: Record<string, unknown>, nowMs: number): Promise<ToolOut> {
  if (!env.AUTH_DB) return refuse('db-not-bound');
  if (args.ladder !== undefined && args.ladder !== LADDER) return refuse('unknown-ladder');
  const db = env.AUTH_DB;
  const now = new Date(nowMs).toISOString();
  const entries = await confirmedLedger(db, LADDER);
  const handles = [...new Set(entries.flatMap((e: any) => (e.sides || []).flatMap((s: any) => s.players || [])))] as string[];
  const ratings = ratingsFor(handles, entries, await declaredLevels(db, LADDER), now);
  return { ok: true, ladder: LADDER, generatedAt: now, entries, ratings: handles.map((h) => L.publicRating(ratings[h])) };
}

async function game(env: CommunicatorEnv, args: Record<string, unknown>): Promise<ToolOut> {
  if (!env.AUTH_DB) return refuse('db-not-bound');
  if (typeof args.id !== 'string' || !args.id || args.id.length > 64) return refuse('bad-request');
  const g = await getGame(env.AUTH_DB, args.id);
  return g ? { ok: true, game: publicGame(g) } : refuse('not-found');
}

export async function callCommunicatorTool(
  name: string, args: Record<string, unknown>, request: Request, env: CommunicatorEnv, venues: Venue[], nowMs = Date.now(),
): Promise<ToolOut> {
  if (name === 'communicator_ledger') return ledger(env, args, nowMs);
  if (name === 'communicator_game') return game(env, args);
  const kind = OKAY_KIND[name];
  if (!kind) return refuse('unknown-tool');
  if (!env.AUTH_DB) return refuse('db-not-bound');
  const db = env.AUTH_DB;
  const actor = args.actor;
  if (typeof actor !== 'string' || !HANDLE.test(actor)) return refuse('bad-request');

  // Agent proof, when the caller sends it. A bad proof is a refusal; no proof is allowed (the okay row still gates).
  const proof = await verifyAgentRequest(db, request, await hashAgentActionRequest(name, args as Record<string, unknown>), 'communicator');
  if (proof.response) return refuse('agent-proof-invalid');

  const gameId = name === 'communicator_request' ? '' : args.gameId;
  if (typeof gameId !== 'string' || (name !== 'communicator_request' && !gameId)) return refuse('bad-request');
  const claimed = args.okay as { by?: unknown } | undefined;
  if (claimed && typeof claimed === 'object' && claimed.by !== undefined && claimed.by !== actor) return refuse('okay-required');
  if (!(await hasRecentOkayOfKind(db, { actor, kind, targetGame: gameId, withinMs: OKAY_WINDOW_MS, now: nowMs }))) return refuse('okay-required');

  const profile = await getProfile(db, actor, { asSelf: false });
  if (!profile) return refuse('profile-required');
  const wired = H as unknown as Record<string, ((db: D1Database, env: CommunicatorEnv, a: Record<string, unknown>) => Promise<unknown>) | undefined>;
  const now = nowMs;

  if (name === 'communicator_request') {
    if (typeof args.text !== 'string' || !args.text.trim() || args.text.length > 500) return refuse('bad-request');
    if (((profile as { tier?: number }).tier ?? 1) < 2) return refuse('tier-2-required');
    return await H.proposeFor(db, venues, { text: args.text, seed: args.seed }, actor, now) as ToolOut;
  }
  const hook = { communicator_invite: 'inviteGame', communicator_remind: 'sendDueReminders', communicator_score: 'scoreGame', communicator_confirm_score: 'confirmScoreGame' }[name] as string;
  const fn = wired[hook];
  if (typeof fn !== 'function') return refuse('not-yet-wired', { note: `v1-b supplies ${hook}; the okay was verified but nothing was sent or changed.` });
  if (name === 'communicator_score' && (!Array.isArray(args.sides) || !Array.isArray(args.scores))) return refuse('bad-request');
  if (name === 'communicator_confirm_score' && args.answer !== 'confirm' && args.answer !== 'dispute') return refuse('bad-request');
  const out = await fn(db, env, { ...args, actor, gameId, now }) as ToolOut | undefined;
  return out && typeof out === 'object' ? out : { ok: true };
}

const GAME_ID = { type: 'string', maxLength: 64, description: 'The game id (from communicator_game or the proposal flow).' };
const ACTOR = { type: 'string', pattern: '^[a-z0-9-]{1,32}$', description: 'The handle of the person this action is for.' };
const OKAY = {
  type: 'object', additionalProperties: false, required: ['by', 'at'],
  description: 'A claim only: the person must also have posted the okay to /api/communicator/okays within 10 minutes; the server checks that row.',
  properties: { by: { type: 'string', description: 'Handle of the person who okayed this (must equal actor).' }, at: { type: 'string', description: 'ISO time of the okay.' } },
};
const NEED_OKAY = 'The person must first okay it at POST /api/communicator/okays (good for 10 minutes); without that it is refused with okay-required.';

export const COMMUNICATOR_TOOL_DEFINITIONS = [
  { name: 'communicator_ledger', description: 'Read the confirmed game ledger and each player\'s public rating for a ladder; handles only, no contact details.',
    inputSchema: { type: 'object', properties: { ladder: { type: 'string', description: 'Ladder id; defaults to pickleball:el-segundo:open.' } }, additionalProperties: false } },
  { name: 'communicator_game', description: 'Read one game (time, venue slot, roster handles, score) by id; names only, never contact details. Unknown ids are refused as not-found.',
    inputSchema: { type: 'object', properties: { id: GAME_ID }, required: ['id'], additionalProperties: false } },
  { name: 'communicator_request', description: `Turn a plain-language ask into a proposed time and candidate players for one person; it stores nothing. ${NEED_OKAY}`,
    inputSchema: { type: 'object', properties: { text: { type: 'string', maxLength: 500, description: 'e.g. "a 4.0 doubles game Thursday evening at Rec Park".' }, actor: ACTOR, seed: { type: 'integer' } }, required: ['text', 'actor'], additionalProperties: false } },
  { name: 'communicator_invite', description: `Consent action: sends invitations for a game to its candidates, reaching real people who opted in. ${NEED_OKAY}`,
    inputSchema: { type: 'object', properties: { gameId: GAME_ID, actor: ACTOR, okay: OKAY }, required: ['gameId', 'actor', 'okay'], additionalProperties: false } },
  { name: 'communicator_remind', description: `Consent action: sends the reminders now due for a game to its players, reaching real people who opted in. ${NEED_OKAY}`,
    inputSchema: { type: 'object', properties: { gameId: GAME_ID, actor: ACTOR, okay: OKAY }, required: ['gameId', 'actor', 'okay'], additionalProperties: false } },
  { name: 'communicator_score', description: `Logs a finished game\'s score as pending on the ledger until the other side confirms. ${NEED_OKAY}`,
    inputSchema: { type: 'object', properties: { gameId: GAME_ID, actor: ACTOR, sides: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'array', items: { type: 'string' } }, description: 'Two lists of player handles.' }, scores: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'integer', minimum: 0 }, description: 'Points for each side, in the same order.' } }, required: ['gameId', 'actor', 'sides', 'scores'], additionalProperties: false } },
  { name: 'communicator_confirm_score', description: `Confirms or disputes a logged score for one player; both sides confirming records it on the ledger. ${NEED_OKAY}`,
    inputSchema: { type: 'object', properties: { gameId: GAME_ID, actor: ACTOR, answer: { type: 'string', enum: ['confirm', 'dispute'] } }, required: ['gameId', 'actor', 'answer'], additionalProperties: false } },
] as const;

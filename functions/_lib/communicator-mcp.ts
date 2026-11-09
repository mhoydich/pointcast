/**
 * The Communicator's MCP tools (docs/prd/communicator-v1.md 4.3), as plain functions so node can test them
 * without loading the whole MCP server. The public MCP is read-only: only the two read tools live here.
 * Writes and consent actions (request, invite, remind, score, confirm-score) run over the HTTP routes in
 * functions/api/communicator/*, behind a signed-in person's okay (POST /api/communicator/okays).
 */
import { confirmedLedger, declaredLevels, getGame, ratingsFor, type CommunicatorEnv, type Game, type Venue } from './communicator-store.ts';
// @ts-ignore — plain module shared with the tests and the browser
import * as L from '../../public/communicator/ledger.mjs';

export const COMMUNICATOR_TOOL_NAMES = ['communicator_ledger', 'communicator_game'] as const;

const LADDER = L.DEFAULT_LADDER.id as string;

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
  name: string, args: Record<string, unknown>, _request: Request, env: CommunicatorEnv, _venues: Venue[], nowMs = Date.now(),
): Promise<ToolOut> {
  if (name === 'communicator_ledger') return ledger(env, args, nowMs);
  if (name === 'communicator_game') return game(env, args);
  return refuse('unknown-tool');
}

const GAME_ID = { type: 'string', maxLength: 64, description: 'The game id.' };

export const COMMUNICATOR_TOOL_DEFINITIONS = [
  { name: 'communicator_ledger', description: 'Read the confirmed game ledger and each player\'s public rating for a ladder; handles only, no contact details.',
    inputSchema: { type: 'object', properties: { ladder: { type: 'string', description: 'Ladder id; defaults to pickleball:el-segundo:open.' } }, additionalProperties: false } },
  { name: 'communicator_game', description: 'Read one game (time, venue slot, roster handles, score) by id; names only, never contact details. Unknown ids are refused as not-found.',
    inputSchema: { type: 'object', properties: { id: GAME_ID }, required: ['id'], additionalProperties: false } },
] as const;

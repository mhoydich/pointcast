/**
 * /api/air/desk — the Desk board, an agent's card, and the two calls the
 * house's own agents put out and pass between them.
 *
 * GET            → { calls, shift, log (50), nightEditor: null, serverTime }
 *                  cached 30 s. `Cache-Control` only; nothing here reads a
 *                  phone's device header or session.
 * GET ?agent=cc  → an AgentCard, or 404 unknown-agent.
 * POST { action: 'ask', agent, spot, kind, belief, sourceUrl } → 201 { ok, call }
 * POST { action: 'pass', agent, callId, to, reason }          → 200 { ok, call }
 *      Resident-only: header X-Yard-Resident against env.YARD_RESIDENT_KEY.
 *      503 resident-key-unset (unset) · 403 not-a-resident/not-holder
 *      400 bad-json/bad-action/unknown-agent/bad-spot/not-a-desk-kind/
 *          bad-belief/bad-source-url/source-unresolved/bad-call/bad-pass
 *      409 spot-busy/too-soon/pass-cap/not-open/no-open-call · 429 daily-cap
 *
 * Reserved (src/data/air-spots.json `reserved`): routes before [spot].ts.
 * Not a resident-only page in the browser sense — the key is a house secret,
 * never a person's; this is the same posture as /api/yard/ops's confirm.
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
import { fail as failStore, json, unavailable, type AirEnv } from '../../_lib/air-store.ts';
import { agentPayload, askCall, deskPayload, passCall, type AirDeskEnv } from '../../_lib/air-desk-store.ts';
// @ts-ignore — plain module shared with the tests
import { DESK_TTL_S } from '../../_lib/air-desk.mjs';

type Env = AirEnv & AirDeskEnv;
const CACHE = { 'Cache-Control': `public, max-age=${DESK_TTL_S}` };
const BODY_MAX = 2_000;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AUTH_DB) return unavailable();
  const now = Date.now();
  const agent = new URL(request.url).searchParams.get('agent');
  try {
    if (agent) {
      const card = await agentPayload(env.AUTH_DB, AIR_CONFIG, agent, now);
      return card ? json(card, 200, CACHE) : failStore('unknown-agent', 404);
    }
    return json(await deskPayload(env.AUTH_DB, AIR_CONFIG, now), 200, CACHE);
  } catch {
    return unavailable();
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AUTH_DB) return unavailable();
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return failStore('bad-json', 400);
  let text: string;
  try {
    text = await request.text();
  } catch {
    return failStore('bad-json', 400);
  }
  if (text.length > BODY_MAX) return failStore('bad-json', 400);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return failStore('bad-json', 400);
  }
  const action = body && typeof body === 'object' ? (body as { action?: unknown }).action : null;
  const now = Date.now();
  try {
    if (action === 'ask') return await askCall(request, env, env.AUTH_DB, AIR_CONFIG, body, now);
    if (action === 'pass') return await passCall(request, env, env.AUTH_DB, AIR_CONFIG, body, now);
    return failStore('bad-action', 400);
  } catch {
    return unavailable();
  }
};

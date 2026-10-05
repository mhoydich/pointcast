// The Desk — a scheduled Worker (pointcast-the-desk). Mike's agents trade
// Mike's own capped bankroll; paper mode only until Mike flips it, venue by
// venue, in a reviewed PR. Spec: VENUES.md, README.md beside this file.
//
// Cron */5: marks, settlements, reveals, the daily-loss check, then the three
// house strategies — every order through the Risk Gate (functions/_lib/the-desk/gate.mjs).
//
// Routes:
//   GET  /state     public broadcast JSON (same as /api/the-desk on Pages)
//   POST /propose   X-Desk-Agent-Key  — an external agent's order, same gate
//   POST /approve   X-Desk-Owner-Key  — {id}: Mike approves an order above the threshold
//   POST /kill      X-Desk-Owner-Key or X-Desk-Agent-Key — stop, flatten, stop using keys
//   POST /rearm     X-Desk-Owner-Key  — only once flat; agents can never re-arm
//
// Secrets (wrangler secret put <name>), never in the repo or in agent context:
//   DESK_OWNER_KEY      Mike only. Unset → /approve, /rearm answer 503.
//   DESK_AGENT_KEY      for Mike's agents. Unset → /propose answers 503.
//   DESK_NTFY_URL       private ntfy topic URL for approval/halt/kill pushes. Unset → logged only.
//   ALPACA_DATA_KEY_ID / ALPACA_DATA_SECRET   paper-account market-data keys. Unset → Alpaca venue off.
// No trading keys exist in paper mode.
import rawConfig from '../../../src/data/the-desk.json';
import { deskBroadcast } from '../../../functions/_lib/the-desk/public.mjs';
import { timingSafeEqual } from '../../../functions/_lib/the-desk/util.mjs';
import { wireDesk } from '../../../functions/_lib/the-desk/wire.mjs';

export interface Env {
  AUTH_DB: D1Database;
  DESK_OWNER_KEY?: string;
  DESK_AGENT_KEY?: string;
  DESK_NTFY_URL?: string;
  ALPACA_DATA_KEY_ID?: string;
  ALPACA_DATA_SECRET?: string;
}

type Msg = { kind: string; [k: string]: unknown };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: 'the-desk', ...event }));
}

function pushText(msg: Msg): { title: string; body: string; priority: string } {
  if (msg.kind === 'approval') {
    const o = msg.order as Record<string, unknown>;
    return {
      title: `Desk: approve $${Number(o.notional).toFixed(2)}?`,
      body: `${o.agent} wants to ${o.action} ${o.qty} ${o.instrument}${o.title ? ` (${o.title})` : ''} @ ${o.limitPrice}. Order ${o.id}. Approve: POST /approve {"id":"${o.id}"}. Expires in 30 min.`,
      priority: 'high',
    };
  }
  if (msg.kind === 'halt') return { title: 'Desk: daily loss limit hit', body: `Trading halted for ${msg.day}. Day P&L ${msg.pnl}.`, priority: 'urgent' };
  if (msg.kind === 'kill') return { title: 'Desk: KILL SWITCH', body: `By ${msg.by}: ${msg.reason}. Flattening every venue.`, priority: 'urgent' };
  return { title: 'Desk', body: JSON.stringify(msg).slice(0, 500), priority: 'default' };
}

function notifier(env: Env) {
  return async (msg: Msg) => {
    log({ notify: msg.kind });
    if (!env.DESK_NTFY_URL) return;
    const { title, body, priority } = pushText(msg);
    await fetch(env.DESK_NTFY_URL, { method: 'POST', body, headers: { Title: title, Priority: priority, Tags: 'chart_with_upwards_trend' } });
  };
}

async function wire(env: Env) {
  return wireDesk({
    rawConfig,
    db: env.AUTH_DB,
    secrets: { ALPACA_DATA_KEY_ID: env.ALPACA_DATA_KEY_ID, ALPACA_DATA_SECRET: env.ALPACA_DATA_SECRET },
    notify: notifier(env),
  });
}

function keyOk(request: Request, header: string, secret?: string): boolean {
  return Boolean(secret) && timingSafeEqual(request.headers.get(header) || '', secret as string);
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      const { desk, view, strategies } = await wire(env);
      const out = await desk.tick(strategies, view);
      log({ tick: out.ran, results: 'results' in out ? out.results?.length : 0 });
    })());
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/state') {
      const { config, configHash, store } = await wire(env);
      return json(await deskBroadcast({ config, configHash, store }));
    }
    if (request.method !== 'POST') return json({ ok: false, reason: 'not-found' }, 404);

    const owner = keyOk(request, 'X-Desk-Owner-Key', env.DESK_OWNER_KEY);
    const agent = keyOk(request, 'X-Desk-Agent-Key', env.DESK_AGENT_KEY);

    switch (url.pathname) {
      case '/propose': {
        if (!env.DESK_AGENT_KEY) return json({ ok: false, reason: 'agent-key-unset' }, 503);
        if (!agent) return json({ ok: false, reason: 'not-an-agent' }, 403);
        const { desk } = await wire(env);
        // External agents trade under the configured external slot only; the house strategies' ids are the cron's.
        const p = await body(request);
        return json(await desk.propose({ ...p, agent: 'guest', flatten: false }));
      }
      case '/approve': {
        if (!env.DESK_OWNER_KEY) return json({ ok: false, reason: 'owner-key-unset' }, 503);
        if (!owner) return json({ ok: false, reason: 'not-the-owner' }, 403);
        const { desk } = await wire(env);
        return json(await desk.approve(String((await body(request)).id || '')));
      }
      case '/kill': {
        if (!owner && !agent) return json({ ok: false, reason: 'forbidden' }, 403);
        const { desk } = await wire(env);
        const reason = String((await body(request)).reason || 'manual').slice(0, 200);
        return json(await desk.kill(owner ? 'mike' : 'agent', reason));
      }
      case '/rearm': {
        if (!env.DESK_OWNER_KEY) return json({ ok: false, reason: 'owner-key-unset' }, 503);
        if (!owner) return json({ ok: false, reason: 'not-the-owner' }, 403);
        const { desk } = await wire(env);
        return json(await desk.rearm('mike'));
      }
      default:
        return json({ ok: false, reason: 'not-found' }, 404);
    }
  },
} satisfies ExportedHandler<Env>;

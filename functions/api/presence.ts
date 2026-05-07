/**
 * /api/presence — Pages Function entry routing WebSocket + HTTP requests
 * to the PresenceRoom Durable Object.
 *
 * The DO class lives in a standalone Worker (workers/presence/src/index.ts)
 * because Pages Functions cannot export DO classes. The root wrangler.toml
 * binds `PRESENCE` to that Worker's class via `script_name`:
 *
 *   [[durable_objects.bindings]]
 *   name        = "PRESENCE"
 *   class_name  = "PresenceRoom"
 *   script_name = "pointcast-presence"
 *
 * This file therefore only forwards requests — all presence logic
 * (WebSocket upgrade, /snapshot GET handler, identify/update/ping
 * messages, 90s idle timeout, broadcast) lives in the companion Worker.
 *
 * Broadcast contract (re-documented here for agent discovery parity
 * with /for-agents + /agents.json):
 *   {
 *     humans: number,
 *     agents: number,
 *     sessions: Array<PublicSessionView>,  // every viewer sees this
 *     peers?: Array<PeerView>,             // active cursors (last 20s)
 *     chat?: Array<ChatEntry>,             // ring buffer; each entry carries sender's room? + optional cursor bubble?
 *     waves?: Array<WaveEntry>,            // directional waves (incl. optional targetPath / BRING), TTL 8s
 *     vibes?: Array<VibeEntry>,            // broadcast emoji reactions, TTL 6s
 *     you?: PrivateSessionView,            // only for the session-matched viewer
 *   }
 *   WaveEntry = { fromNoun, toNoun, emoji, at, targetPath? }
 *   VibeEntry = { fromNoun, emoji, room?, at }
 *   ChatEntry.bubble = { x, y } when sender pinned the message to a cursor pos
 *   PublicSessionView = {
 *     nounId, kind, joinedAt,
 *     mood?, listening?, where?, currentPath?,
 *     country?, deviceClass?,
 *   }
 *   PrivateSessionView = PublicSessionView & {
 *     city?, region?, timezone?, asn?, asOrg?, colo?,
 *     referrerHost?, relay?, walletAddress?, nostrPubkey?,
 *     pathTrail?, isReturning?, dwellSeconds?,
 *   }
 *
 * Privacy (option-B): session ids never leave the DO. Rich edge metadata
 * (city, referrer, ASN, etc.) is only surfaced back to the session it
 * belongs to, as `you`. Other visitors see only country + deviceClass on
 * each public session entry.
 */

import { acceptPresenceWebSocketFallback } from '../_realtime-fallback';

interface Env {
  PRESENCE?: DurableObjectNamespace;
  VISITS?: KVNamespace;
}

const PRESENCE_GLOBAL_KEY = 'global:2026-04-29c';
// Account-level DO duration is exhausted right now; use Pages fallback.
const USE_DURABLE_OBJECTS = false;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const upgrade = ctx.request.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    const url = new URL(ctx.request.url);
    return new Response(JSON.stringify({
      endpoint: '/api/presence',
      type: 'websocket',
      websocket: `wss://${url.host}/api/presence?sid={uuid}&kind={human|agent|wallet}`,
      snapshot: `https://${url.host}/api/presence/snapshot`,
      note: 'Open this endpoint as a WebSocket. Use /api/presence/snapshot for HTTP.',
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  if (!USE_DURABLE_OBJECTS || !ctx.env.PRESENCE) {
    return acceptPresenceWebSocketFallback(ctx.request, PRESENCE_GLOBAL_KEY, 'agent', ctx.env.VISITS);
  }

  try {
    const id = ctx.env.PRESENCE.idFromName(PRESENCE_GLOBAL_KEY);
    const stub = ctx.env.PRESENCE.get(id);
    const response = await stub.fetch(ctx.request);
    if (response.status === 101) return response;
    console.error(`[presence] DO returned ${response.status}; using fallback`);
    return acceptPresenceWebSocketFallback(ctx.request, PRESENCE_GLOBAL_KEY, 'agent', ctx.env.VISITS);
  } catch (err) {
    console.error('[presence] DO fetch failed:', err);
    return acceptPresenceWebSocketFallback(ctx.request, PRESENCE_GLOBAL_KEY, 'agent', ctx.env.VISITS);
  }
};

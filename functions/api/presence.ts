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
 *     you?: PrivateSessionView,            // only for the session-matched viewer
 *   }
 *   PublicSessionView = {
 *     nounId, kind, joinedAt,
 *     mood?, listening?, where?,
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

interface Env {
  PRESENCE: DurableObjectNamespace;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const id = ctx.env.PRESENCE.idFromName('global');
  const stub = ctx.env.PRESENCE.get(id);
  return stub.fetch(ctx.request);
};

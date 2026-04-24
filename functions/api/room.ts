/**
 * /api/room — per-URL cursor + chat room, backed by the same PresenceRoom DO
 * class as /api/presence but sharded by pathname so each URL is its own
 * multiplayer room. The DO instance name is `room:<normalized-path>`; the
 * global presence instance is `global` and stays untouched.
 *
 * WebSocket protocol (additions on top of the existing presence protocol):
 *   Client → DO
 *     { type:'identify', nounId:int, kind:'human'|'wallet', tag?:string }
 *     { type:'cursor',  x:int, y:int }   // viewport-normalized ×10000
 *     { type:'chat',    msg:string }     // <=120 chars
 *     { type:'ping' }                    // keepalive
 *
 *   DO → client (100 ms while active, 1 Hz when idle):
 *     { humans, agents, sessions,
 *       peers?:  Array<{sessionId, nounId, kind, tag, x, y, at}>,
 *       chat?:   Array<{who, nounId, msg, at, sid}>,
 *       you?:    PrivateSessionView }
 *
 *     peers excludes the viewer, so you don't see your own cursor coming
 *     back at you with network lag. chat includes everyone in the room.
 *
 * Deploy order on first ship:
 *   1. cd workers/presence && npx wrangler deploy   (new message handlers)
 *   2. npx wrangler pages deploy dist ...           (this function)
 */

interface Env {
  PRESENCE: DurableObjectNamespace;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqUrl = new URL(ctx.request.url);
  const raw = reqUrl.searchParams.get('url') ?? '/';
  const roomKey = `room:${normalizeRoomPath(raw)}`;
  const id = ctx.env.PRESENCE.idFromName(roomKey);
  const stub = ctx.env.PRESENCE.get(id);
  return stub.fetch(ctx.request);
};

/**
 * Normalize an arbitrary ?url= value into a stable DO key. Accepts both
 * full URLs and path-only strings. Drops query, fragment, trailing slash,
 * lowercases, caps length. `/` is preserved as the root-room key.
 */
function normalizeRoomPath(input: string): string {
  let path: string;
  try {
    const parsed = new URL(input, 'https://pointcast.xyz');
    path = parsed.pathname;
  } catch {
    path = input.startsWith('/') ? input : `/${input}`;
  }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path.toLowerCase().slice(0, 120) || '/';
}

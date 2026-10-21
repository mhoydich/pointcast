/**
 * /api/loom/live?to=<address> — watch one Loom thread as it is written.
 *
 * Open as a WebSocket. The thread's Durable Object (workers/loom) sends
 *   { type:"hello", key, seq }                 on connect
 *   { type:"ops", key, seq, ops:[…] }          each time an append lands
 * Ops are the same public ops GET /api/loom returns; fold them in order. Send
 * "ping" to keep an idle socket open (answered "pong"). Watchers only listen;
 * writes still go to POST /api/loom.
 *
 * When the LOOM binding is absent this answers 503 {error:"live_unbound"} and
 * clients keep polling GET /api/loom?to=…&since=<seq>.
 */
import { addressKey, parseAddress } from '../../../src/lib/loom/address.mjs';
import { loomStore } from '../../../src/lib/loom/store.mjs';

type Env = { LOOM?: DurableObjectNamespace };

const reply = (body: Record<string, unknown>, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
});

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  let key: string;
  try {
    const target = parseAddress(url.searchParams.get('to'));
    key = target.kind === 'reply' ? target.logKey : await addressKey(target.address);
  } catch (error) {
    return reply({ ok: false, error: (error as Error).message || 'address_invalid' }, 400);
  }
  if (!env.LOOM) return reply({ ok: false, error: 'live_unbound', poll: `${url.origin}/api/loom?to=${encodeURIComponent(url.searchParams.get('to') ?? '')}&since=<seq>` }, 503);
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return reply({ ok: true, endpoint: '/api/loom/live', type: 'websocket', key, websocket: `wss://${url.host}/api/loom/live?to=${encodeURIComponent(url.searchParams.get('to') ?? '')}` }, 200);
  }
  return loomStore({ ns: env.LOOM }).connect(key, request);
};

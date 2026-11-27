/**
 * GET /api/loom/alerts — read-only reply, mention, and open-inbox alerts.
 *
 *   GET /api/loom/alerts?for=<handle>&since=<iso>&limit=<n>&format=json|text
 *
 * `handle` is an alias for `for`. The handler never writes a Loom log and
 * never calls kv.put. Storage is PC_LOOM_KV, otherwise VISITS. When neither
 * binding is present the response is an empty 200, not an error.
 */
import { handleLoomAlerts } from '../../../src/lib/loom/reply-alerts.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
};

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  handleLoomAlerts(request, { kv: env.PC_LOOM_KV ?? env.VISITS ?? null });

export const onRequest: PagesFunction<Env> = (context) => {
  if (context.request.method === 'GET' || context.request.method === 'HEAD' || context.request.method === 'OPTIONS') {
    return onRequestGet(context);
  }
  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Allow: 'GET, HEAD, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
};

/**
 * GET /api/loom/alerts — read-only reply, mention, and open-inbox alerts.
 *
 *   GET /api/loom/alerts?for=<handle>&since=<iso>&limit=<n>&format=json|text
 *
 * `handle` is an alias for `for`. This is the low-token wakeup, not For You
 * (`/loom/for/NAME`, `GET /api/loom?for=NAME`). For You returns people,
 * NEEDS-your-yes, and arrivals. Alerts returns reply / mention / open inbox
 * ask-or-card, as JSON or one line per alert, with a since cursor and an ETag.
 * Collator echoes are omitted. The JSON reports scannedRooms, totalRooms,
 * missedRooms, and truncated for the 24-room cap.
 *
 * Reads use handleLoom's GET, the same slot the Hearth readers use. A reader
 * function (atomicReader after the D1 cutover) or a KV binding is the source.
 * This file never reads or writes storage itself.
 */
import { handleLoomAlerts } from '../../../src/lib/loom/reply-alerts.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
  AUTH_DB?: D1Database;
};

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  // KV until cutover. After it, pass atomicReader({ db: env.AUTH_DB, kv })
  // as `source`; readLoomAlerts already treats a function as the reader and
  // a binding as handleLoom's GET.
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

import { atomicReader } from '../../../src/lib/loom/atomic.mjs';
/** /loom/bot/<name> — plain-text return page for a bot. Logic: src/lib/loom/bot-route.mjs */
import { serveBot } from '../../../src/lib/loom/bot-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace; AUTH_DB?: D1Database };

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const raw = Array.isArray(params.name) ? params.name.join('/') : String(params.name ?? '');
  return serveBot(request, atomicReader({ db: env.AUTH_DB, kv: env.PC_LOOM_KV ?? env.VISITS ?? null }), raw);
};

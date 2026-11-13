/** /loom/bot/<name> — plain-text return page for a bot. Logic: src/lib/loom/bot-route.mjs */
import { serveBot } from '../../../src/lib/loom/bot-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const raw = Array.isArray(params.name) ? params.name.join('/') : String(params.name ?? '');
  return serveBot(request, env.PC_LOOM_KV ?? env.VISITS ?? null, raw);
};

/** /loom/for/<name> — what needs <name> on the Loom (People, Needs your yes, New arrivals). Logic: src/lib/loom/for-route.mjs */
import { serveFor } from '../../../src/lib/loom/for-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace; AUTH_DB?: D1Database };

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const raw = Array.isArray(params.name) ? params.name.join('/') : String(params.name ?? '');
  return serveFor(request, env.PC_LOOM_KV ?? env.VISITS ?? null, raw, env.AUTH_DB?.withSession('first-primary') ?? null);
};

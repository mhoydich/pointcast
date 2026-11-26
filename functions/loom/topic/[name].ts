/** /loom/topic/<name> — a server-rendered page for one public Loom topic. Logic: src/lib/loom/topic-route.mjs */
import { serveTopic } from '../../../src/lib/loom/topic-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const raw = Array.isArray(params.name) ? params.name.join('/') : String(params.name ?? '');
  return serveTopic(request, env.PC_LOOM_KV ?? env.VISITS ?? null, raw);
};

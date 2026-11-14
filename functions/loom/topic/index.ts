import { atomicReader } from '../../../src/lib/loom/atomic.mjs';
/** /loom/topic/ — index of public Loom topics. Logic: src/lib/loom/topic-route.mjs */
import { serveTopicIndex } from '../../../src/lib/loom/topic-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace; AUTH_DB?: D1Database };

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  serveTopicIndex(request, atomicReader({ db: env.AUTH_DB, kv: env.PC_LOOM_KV ?? env.VISITS ?? null }));

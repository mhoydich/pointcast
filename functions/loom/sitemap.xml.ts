import { atomicReader } from '../../src/lib/loom/atomic.mjs';
/** /loom/sitemap.xml — /loom, /loom/topic/ and every public topic with messages. Logic: src/lib/loom/topic-route.mjs */
import { serveSitemap } from '../../src/lib/loom/topic-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace; AUTH_DB?: D1Database };

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  serveSitemap(request, atomicReader({ db: env.AUTH_DB, kv: env.PC_LOOM_KV ?? env.VISITS ?? null }));

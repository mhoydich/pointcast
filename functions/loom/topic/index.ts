/** /loom/topic/ — index of public Loom topics. Logic: src/lib/loom/topic-route.mjs */
import { serveTopicIndex } from '../../../src/lib/loom/topic-route.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  serveTopicIndex(request, env.PC_LOOM_KV ?? env.VISITS ?? null);

import { serveHearthActivity } from '../../src/lib/loom/hearth-activity.mjs';
import { atomicReader } from '../../src/lib/loom/atomic.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace; AUTH_DB?: D1Database };

export const onRequestGet: PagesFunction<Env> = (context) => {
  const { request, env } = context;
  const kv = env.PC_LOOM_KV ?? env.VISITS ?? null;
  // Keep legacy KV-only readers working before cutover. A bound D1 failure
  // must stay unavailable; it must never send Hearth back to a stale archive.
  return serveHearthActivity(request, env.AUTH_DB ? atomicReader({ db: env.AUTH_DB, kv }) : kv, Date.now(), {
    cache: typeof caches === 'undefined' ? undefined : caches.default,
    waitUntil: (task: Promise<unknown>) => context.waitUntil(task),
  });
};

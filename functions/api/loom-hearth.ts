import { serveHearthActivity } from '../../src/lib/loom/hearth-activity.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

export const onRequestGet: PagesFunction<Env> = (context) =>
  serveHearthActivity(context.request, context.env.PC_LOOM_KV ?? context.env.VISITS, Date.now(), {
    cache: typeof caches === 'undefined' ? undefined : caches.default,
    waitUntil: (task: Promise<unknown>) => context.waitUntil(task),
  });

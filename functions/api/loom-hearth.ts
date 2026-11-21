import { serveHearthActivity } from '../../src/lib/loom/hearth-activity.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  serveHearthActivity(request, env.PC_LOOM_KV ?? env.VISITS);

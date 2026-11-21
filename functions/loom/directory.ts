import { directoryResponse } from '../../src/lib/loom/directory.mjs';

type Env = { PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };
export const onRequestGet: PagesFunction<Env> = ({ request, env }) => directoryResponse(request, env.PC_LOOM_KV ?? env.VISITS ?? null);

/**
 * GET /api/loom/switchboard — read-only cord board for the Loom sketch.
 * Reads go through handleLoom inside serveSwitchboard. This file does not
 * touch storage itself. It is a new route, beside /api/loom, and does not
 * change the write endpoint.
 */
import { serveSwitchboard } from '../../../src/lib/loom/switchboard.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
};

export const onRequest: PagesFunction<Env> = ({ request, env }) =>
  serveSwitchboard(request, { kv: env.PC_LOOM_KV ?? env.VISITS ?? null });

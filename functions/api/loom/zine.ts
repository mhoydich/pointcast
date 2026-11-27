/**
 * GET /api/loom/zine — read-only broadsheet of the day's Loom posts.
 * Rooms are read inside serveLoomZine through handleLoom GETs. This file
 * does not touch loom:log keys or write storage.
 */
import { serveLoomZine } from '../../../src/lib/loom/loom-zine.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
};

export const onRequest: PagesFunction<Env> = ({ request, env }) => serveLoomZine(request, {
  kv: env.PC_LOOM_KV ?? env.VISITS ?? null,
});

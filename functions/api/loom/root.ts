/**
 * GET /api/loom/root — today's network root.
 * Read-only. Storage is whatever the Loom already binds (PC_LOOM_KV, else
 * VISITS). This file does not append, hide, or rewrite a Loom log.
 */
import { serveLoomRoot } from '../../../src/lib/loom/loom-root.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
};

export const onRequest: PagesFunction<Env> = (context) =>
  serveLoomRoot(context.request, context.env?.PC_LOOM_KV ?? context.env?.VISITS ?? null);

export const onRequestGet = onRequest;

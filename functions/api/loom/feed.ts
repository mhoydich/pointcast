/**
 * GET /api/loom/feed — RSS 2.0, Atom 1.0, and JSON Feed 1.1 for any Loom address.
 *
 * Read-only open-web subscription for a #topic, an @handle, or any other Loom
 * log. Humans can follow it in a feed reader; outside bots can poll it with
 * ordinary HTTP. No MCP glue.
 *
 * Storage is the same binding as /api/loom (PC_LOOM_KV, otherwise VISITS), but
 * this route only reads `loom:log:<key>`. It does not import the write service
 * and never calls kv.put or appends a message. Logic lives in
 * src/lib/loom/loom-feed.mjs.
 */
import { handleLoomFeed } from '../../../src/lib/loom/loom-feed.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
};

export const onRequest: PagesFunction<Env> = ({ request, env }) =>
  handleLoomFeed(request, { kv: env.PC_LOOM_KV ?? env.VISITS ?? null });

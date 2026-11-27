/**
 * GET /api/loom/feed — RSS 2.0, Atom 1.0, and JSON Feed 1.1 for any Loom address.
 *
 * This complements GET /api/loom?to=<address>&format=rss. That route stays as
 * it is: same URL, same RSS body, no ETag. This route does not change it.
 * /api/loom/feed adds Atom 1.0, JSON Feed 1.1, ETag / 304, and Collator-echo
 * filtering (include_collator=1 puts the echoes back). Both are read-only.
 *
 * The log is loaded the way the topic, bot, and for-you doors load it:
 * handleLoom(new Request('https://pointcast.xyz/api/loom?to=…'), { kv }), with
 * the same binding as /api/loom (PC_LOOM_KV, otherwise VISITS). No second
 * storage path, so the D1 cutover inside that reader reaches this feed too.
 * This route never posts.
 */
import { handleLoomFeed } from '../../../src/lib/loom/loom-feed.mjs';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
};

export const onRequest: PagesFunction<Env> = ({ request, env }) =>
  handleLoomFeed(request, { kv: env.PC_LOOM_KV ?? env.VISITS ?? null });

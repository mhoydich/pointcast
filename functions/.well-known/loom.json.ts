/**
 * /.well-known/loom.json — this site's Loom node card, for peer handshakes.
 *
 * Another site that runs a Loom (or anything speaking pointcast.loom/vN)
 * serves the same file on its own origin, then POSTs
 *   { "action": "peer", "node": "https://its.origin" }
 * to /api/loom. The Loom fetches that card, checks it names the same origin,
 * and lists the peer here. See src/lib/loom/service.mjs (nodeCard, handshake).
 */
import { nodeCard } from '../../src/lib/loom/service.mjs';
import { loomStore } from '../../src/lib/loom/store.mjs';

type Env = { LOOM?: DurableObjectNamespace; PC_LOOM_KV?: KVNamespace; VISITS?: KVNamespace };

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const store = loomStore({ ns: env.LOOM ?? null, kv: env.PC_LOOM_KV ?? env.VISITS ?? null });
  let peers: unknown[] = [];
  try { peers = (store ? await store.getList('peers') : null) ?? []; } catch { /* the card still describes the node */ }
  return new Response(JSON.stringify(nodeCard({ peers: peers as never[], live: !!store?.pushes }), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

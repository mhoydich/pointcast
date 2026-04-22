/**
 * /api/mesh.jsonl — NDJSON roster of the federation.
 *
 * One node per line. Each line includes the full mesh entry plus a
 * `federationUrl` pointer back to this page. Agents consuming this feed
 * discover who PointCast links to — friend blogs, zines, benches, imagined
 * peers that haven't launched yet, audio-forward feeds.
 *
 * This is the outbound side. The inbound side (other nodes pointing AT
 * PointCast) ships in a future sprint as /api/mesh-ping + /inbox.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const mesh = (await getCollection('mesh', ({ data }) => data.listed))
    .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());

  const lines = mesh.map((n) => JSON.stringify({
    slug: n.data.slug,
    name: n.data.name,
    url: n.data.url,
    feedUrl: n.data.feedUrl ?? null,
    kind: n.data.kind,
    status: n.data.status,
    description: n.data.description,
    trust: n.data.trust,
    region: n.data.region ?? null,
    coordinates: (n.data.lat != null && n.data.lon != null)
      ? { lat: n.data.lat, lon: n.data.lon }
      : null,
    vibeProfile: n.data.vibeProfile ?? null,
    noun: n.data.noun ?? null,
    tezosAddress: n.data.tezosAddress ?? null,
    addedAt: n.data.addedAt.toISOString(),
    author: n.data.author,
    source: n.data.source ?? null,
    federationUrl: `https://pointcast.xyz/federation`,
  })).join('\n') + '\n';

  return new Response(lines, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Total-Count': String(mesh.length),
      'X-Imagined-Count': String(mesh.filter((m) => m.data.status === 'imagined').length),
    },
  });
};

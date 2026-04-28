import type { APIRoute } from 'astro';
import { buildProtocolManifest } from '../../lib/protocol';

export const GET: APIRoute = async () => {
  const manifest = buildProtocolManifest();

  return new Response(
    JSON.stringify(
      {
        name: manifest.name,
        version: manifest.version,
        status: manifest.status,
        updatedAt: manifest.updatedAt,
        origin: manifest.origin,
        route: manifest.discovery.route,
        manifest: manifest.discovery.json,
        client: manifest.client.human,
        friendDemo: manifest.client.demo,
        chainMessenger: manifest.client.chainMessenger,
        block: manifest.discovery.block,
        relay: manifest.relayPrototype.endpoint,
        peer: {
          id: 'peer:web:pointcast.xyz',
          label: 'PointCast',
          accepts: [manifest.packetMediaType],
          transports: ['local-log', 'https', 'encrypted-relay', 'webrtc-signaling', 'jsonl-export', 'tezos-proof'],
          agentReadable: true,
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
};

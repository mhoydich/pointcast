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
        block: manifest.discovery.block,
        peer: {
          id: 'peer:web:pointcast.xyz',
          label: 'PointCast',
          accepts: ['pcp-1.0/block-packet+json'],
          transports: ['https', 'websocket-relay', 'webrtc-signaling', 'jsonl-export'],
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

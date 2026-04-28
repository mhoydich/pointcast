import type { APIRoute } from 'astro';
import { POINTCAST_CONNECTORS } from '../lib/pointcast-connectors';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/connectors.schema.json',
    name: 'PointCast Connector Links',
    description:
      'Addable MCP connector links for AI clients. Paste the endpoint URL into a custom connector flow, or use the client-specific setup notes.',
    generatedAt: new Date().toISOString(),
    canonical: 'https://pointcast.xyz/connectors',
    connectors: POINTCAST_CONNECTORS.map((connector) => ({
      ...connector,
      installUrl: connector.endpoint,
      mcp: {
        endpoint: connector.endpoint,
        transport: 'http',
        protocol: 'json-rpc-2.0',
      },
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

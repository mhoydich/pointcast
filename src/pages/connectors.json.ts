import type { APIRoute } from 'astro';
import { POINTCAST_CONNECTORS } from '../lib/pointcast-connectors';
import { POINTCAST_AGENT_KIT } from '../lib/pointcast-agent-kit';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/connectors.schema.json',
    name: 'PointCast Connector Links',
    description:
      'Bring an existing AI app to PointCast: subscription-first setup, a public prompt fallback, and advanced agent routes. Profile visit confirmation is optional and does not grant ongoing authorization.',
    generatedAt: new Date().toISOString(),
    canonical: 'https://pointcast.xyz/connectors',
    agentKit: POINTCAST_AGENT_KIT,
    connectors: POINTCAST_CONNECTORS.map((connector) => ({
      ...connector,
      installUrl: connector.endpoint,
      mcp: {
        endpoint: connector.endpoint,
        transport: 'http',
        authentication: 'none',
        privateProfileReadAccess: false,
        ongoingAuthorization: false,
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

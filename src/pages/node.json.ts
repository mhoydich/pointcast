/**
 * /node.json — this PointCast node's federation advertisement.
 *
 * Sprint 3 of the live-artifacts arc. Lists every contract-conformant
 * room hosted on this node. Federated subscribers fetch this endpoint
 * to enumerate available rooms and pull their per-room contracts from
 * the `jsonUrl` field.
 *
 * Right now this node lists one room (/meditate); as new rooms are
 * added in Sprints 5-10 they register here.
 */
import type { APIRoute } from 'astro';
import {
  FEDERATION_CONTRACT_SCHEMA,
  validateNodeSpec,
  type NodeSpec,
} from '../lib/federation-contract';

const node: () => NodeSpec = () => ({
  $schema: FEDERATION_CONTRACT_SCHEMA,
  id: 'pointcast',
  name: 'PointCast',
  description: 'An agent-native broadcast from El Segundo, California. The first node.',
  home: 'https://pointcast.xyz',
  generatedAt: new Date().toISOString(),
  operator: { handle: 'mh', url: 'https://pointcast.xyz/me' },
  location: 'El Segundo, California (33.916°N 118.416°W)',
  rooms: [
    {
      id: 'meditate',
      title: 'The meditation room',
      url: 'https://pointcast.xyz/r/meditate',
      jsonUrl: 'https://pointcast.xyz/meditate.json',
      status: 'open',
      visualizer: 'breath',
      artifact: {
        name: 'Breathe El Segundo',
        image: 'https://pointcast.xyz/images/tokens/breathe-el-segundo.webp',
      },
    },
  ],
  // Self-federation — this node subscribes to itself so the demo at
  // /r/federation/demo proves the protocol works end-to-end with one
  // real node. Real partner nodes get added here as they come online.
  federatedFrom: [
    {
      id: 'pointcast',
      home: 'https://pointcast.xyz',
      nodeJsonUrl: 'https://pointcast.xyz/node.json',
      label: 'PointCast (self)',
    },
  ],
});

export const GET: APIRoute = async () => {
  const payload = validateNodeSpec(node());
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

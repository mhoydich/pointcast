/**
 * /node.json — your node's federation advertisement.
 *
 * Edit `id`, `name`, `description`, `home`, `operator`, `location`,
 * and the `rooms` array as you add rooms. Add neighbor nodes to
 * `federatedFrom` to join the webring.
 */
import type { APIRoute } from 'astro';
import {
  FEDERATION_CONTRACT_SCHEMA,
  validateNodeSpec,
  type NodeSpec,
} from '../lib/federation-contract';

const node: () => NodeSpec = () => ({
  $schema: FEDERATION_CONTRACT_SCHEMA,
  id: 'your-node',
  name: 'Your Node',
  description: 'A new PointCast node, broadcasting from somewhere.',
  home: 'https://your-node.example',
  generatedAt: new Date().toISOString(),
  operator: { handle: 'you' },
  location: 'Earth',
  rooms: [
    {
      id: 'welcome',
      title: 'A new room.',
      url: 'https://your-node.example/r/welcome',
      jsonUrl: 'https://your-node.example/welcome.json',
      status: 'open',
      visualizer: 'breath',
    },
  ],
  federatedFrom: [
    {
      id: 'pointcast',
      home: 'https://pointcast.xyz',
      nodeJsonUrl: 'https://pointcast.xyz/node.json',
      label: 'PointCast (root)',
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

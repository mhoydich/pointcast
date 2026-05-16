/**
 * /nodes.json — webring registry.
 *
 * Sprint 10 of the live-artifacts arc. Machine-readable mirror of
 * src/data/nodes-registry.ts. Federated subscribers and discovery
 * services poll this to enumerate known PointCast nodes.
 *
 * Distinct from /node.json (this node's advertisement). /node.json
 * says "here's me + who I subscribe to"; /nodes.json says "here's
 * the directory of nodes anyone might want to subscribe to".
 */
import type { APIRoute } from 'astro';
import { knownNodes, type KnownNode } from '../data/nodes-registry';

const SCHEMA = 'https://pointcast.xyz/nodes-registry/v1.json';

function requireString(v: unknown, path: string): void {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
}

function validateNode(n: KnownNode, path: string): void {
  requireString(n.id, `${path}.id`);
  requireString(n.name, `${path}.name`);
  requireString(n.description, `${path}.description`);
  requireString(n.home, `${path}.home`);
  requireString(n.nodeJsonUrl, `${path}.nodeJsonUrl`);
  if (!['live', 'beta', 'incubating'].includes(n.status)) {
    throw new Error(`${path}.status: expected live|beta|incubating`);
  }
}

export const GET: APIRoute = async () => {
  const nodes = knownNodes();
  nodes.forEach((n, i) => validateNode(n, `nodes[${i}]`));

  const payload = {
    $schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    count: nodes.length,
    nodes,
    note:
      'Curated registry. Add your node by opening a PR against src/data/nodes-registry.ts in the pointcast repo. Auto-federation (any node listing pointcast.xyz in its federatedFrom is reciprocally listed here) is a future sprint.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

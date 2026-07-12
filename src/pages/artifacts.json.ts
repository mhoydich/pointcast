/**
 * /artifacts.json — full artifact feed for this node.
 *
 * Sprint 7 of the live-artifacts arc. Today emits the seed set; when
 * a KV-backed addable-drop endpoint lands (future sprint), this
 * handler reads from there. Shape stays identical.
 */
import type { APIRoute } from 'astro';
import { ARTIFACT_CONTRACT_SCHEMA, validateArtifactFeed } from '../lib/artifact-contract';
import { seedArtifacts } from '../data/artifacts/seed';

const NODE_ID = 'pointcast';

export const GET: APIRoute = async () => {
  const artifacts = seedArtifacts()
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const feed = validateArtifactFeed({
    $schema: ARTIFACT_CONTRACT_SCHEMA,
    nodeId: NODE_ID,
    generatedAt: new Date().toISOString(),
    count: artifacts.length,
    artifacts,
  });

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

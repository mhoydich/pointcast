/**
 * /artifacts.json — empty artifact feed by default.
 *
 * Wire a KV-backed POST /artifacts/<roomId> later to let visitors drop
 * artifacts (SVG / one-liner / Polaroid / link) onto your room walls.
 * Shape from https://pointcast.xyz/artifact-contract/v1.json.
 */
import type { APIRoute } from 'astro';
import {
  ARTIFACT_CONTRACT_SCHEMA,
  validateArtifactFeed,
} from '../lib/artifact-contract';

const NODE_ID = 'your-node';

export const GET: APIRoute = async () => {
  const feed = validateArtifactFeed({
    $schema: ARTIFACT_CONTRACT_SCHEMA,
    nodeId: NODE_ID,
    generatedAt: new Date().toISOString(),
    count: 0,
    artifacts: [],
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

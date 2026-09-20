/**
 * /resident.json — machine-readable contract for the local resident loop.
 *
 * The resident status itself is intentionally served by the loopback-only
 * oracle. This public document describes how to start it, where to read it,
 * and how consumers should behave while it is offline.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    surface: 'resident',
    version: '1.0',
    description: 'Local overnight resident loop status and its last 10 runs.',
    humanUrl: 'https://pointcast.xyz/resident',
    scope: 'local-machine-only',
    start: {
      oracle: 'npm run oracle',
      residentOnce: 'npm run resident -- --once',
      residentWindow: 'npm run resident -- --hours=8',
    },
    status: {
      method: 'GET',
      url: 'http://127.0.0.1:8789/api/resident/status',
      pollIntervalSeconds: 15,
      contentType: 'application/json',
      cors: '*',
      fields: {
        running: 'boolean — whether a resident task is currently executing',
        currentTask: 'object|null — active join-system task',
        runs: 'array — newest-first, capped at 10 completed runs',
        successCount: 'number — lifetime successful runs in local status',
        failCount: 'number — lifetime failed runs in local status',
        computeHours: 'number — cumulative local resident runtime',
        updatedAt: 'ISO 8601 timestamp — last status write',
      },
    },
    offline: {
      meaning: 'The local oracle is not running or is unreachable from this browser.',
      behavior: 'Keep the page usable, show offline state, and retry on the normal polling interval.',
      security: 'Do not proxy or expose the loopback status endpoint to the public internet.',
    },
    artifacts: {
      statusFile: '.pointcast/resident/status.json',
      runLogs: '.pointcast/resident/runs/',
      publishedReceipt: '/b/{blockId}',
    },
    caveats: [
      'Status is machine-local and differs between hosts.',
      'The public resident page cannot read another visitor’s loopback oracle.',
      'A missing status file is a valid never-run state, not an error.',
      'Run logs can contain local paths and remain local by default.',
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: '<https://pointcast.xyz/resident>; rel="alternate"; type="text/html"',
    },
  });
};

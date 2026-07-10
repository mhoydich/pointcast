import type { APIRoute } from 'astro';
import { readResidentStatus } from '../lib/resident-status';

export const prerender = true;

export const GET: APIRoute = () => {
  const status = readResidentStatus();
  return new Response(JSON.stringify({
    $schema: 'https://pointcast.xyz/for-agents',
    title: 'PointCast overnight resident status',
    page: 'https://pointcast.xyz/resident',
    generatedAt: new Date().toISOString(),
    source: status.updatedAt ? 'checked-in resident status' : 'empty build snapshot',
    ...status,
    instructions: {
      start: 'npm run oracle, then npm run resident',
      liveEndpoint: 'http://127.0.0.1:8789/api/resident/status',
      refreshSeconds: 15,
    },
  }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

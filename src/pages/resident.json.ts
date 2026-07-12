import type { APIRoute } from 'astro';

const contract = {
  $schema: 'https://pointcast.xyz/resident.json',
  name: 'PointCast overnight resident',
  description:
    'Local-only night shift that selects one join-system task, records the run, and leaves reviewable repository artifacts.',
  console: 'https://pointcast.xyz/resident',
  scope: 'local-only',
  start: {
    oracle: 'npm run oracle',
    overnight: 'npm run resident:overnight',
    once: 'npm run resident:once',
  },
  observe: {
    statusUrl: 'http://127.0.0.1:8789/api/resident/status',
    pollIntervalSeconds: 15,
    statusFile: '.pointcast/resident/status.json',
    artifactPattern: 'docs/briefs/YYYY-MM-DD-resident-<task>.md',
    deployedStatusAvailable: false,
  },
  statusFields: {
    running: 'whether a cycle is active',
    currentTask: 'selected join-system task, when present',
    successCount: 'completed successful cycle total',
    failCount: 'completed failed cycle total',
    computeHours: 'accumulated runtime in hours',
    updatedAt: 'most recent status write timestamp',
    runs: 'recent outcomes and artifact paths',
  },
  approvals: [
    'Inspect the artifact paths and repository diff before publishing.',
    'Keep approval gates for main, production, contracts, and external actions intact.',
  ],
} as const;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(contract, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
      link: '<https://pointcast.xyz/resident>; rel="canonical"; type="text/html"',
    },
  });

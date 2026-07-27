import type { APIRoute } from 'astro';

const runbook = `# PointCast overnight resident

The resident is a local-only night shift that selects one join-system task, records the run, and leaves reviewable artifacts in the repository.

## Start

From the PointCast repository, use two terminals:

\`\`\`sh
npm run oracle
npm run resident:overnight
\`\`\`

For a single cycle, replace the second command with \`npm run resident:once\`.

## Observe

- Human console: https://pointcast.xyz/resident
- Local status: http://127.0.0.1:8789/api/resident/status
- Poll interval: 15 seconds
- Status file: .pointcast/resident/status.json
- Run artifacts: docs/briefs/YYYY-MM-DD-resident-<task>.md

The oracle binds to loopback. The local status endpoint is intentionally unavailable from the deployed site.

## Status fields

- \`running\`: whether a cycle is active
- \`currentTask\`: selected join-system task, when present
- \`successCount\` and \`failCount\`: completed cycle totals
- \`computeHours\`: accumulated runtime
- \`updatedAt\`: most recent status write
- \`runs\`: recent outcomes and artifact paths

## Operating contract

1. Start the local oracle before the resident loop.
2. Let one cycle own one small, reviewable join-system task.
3. Inspect the artifact paths and repository diff before publishing anything.
4. Keep approval gates for main, production, contracts, and external actions intact.
5. Stop the local processes to end the shift.
`;

export const GET: APIRoute = () =>
  new Response(runbook, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
      link: '<https://pointcast.xyz/resident>; rel="canonical"; type="text/html"',
    },
  });

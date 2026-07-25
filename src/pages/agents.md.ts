import type { APIRoute } from 'astro';
import { RESIDENTS, RESIDENTS_CONTRACT } from '../data/residents';

const SITE = 'https://pointcast.xyz';

function link(label: string, href?: string) {
  return href ? `[${label}](${href})` : label;
}

function renderResident(resident: (typeof RESIDENTS)[number]) {
  const maker = resident.builtBy ? ` · built by ${resident.builtBy}` : '';
  const references = [
    resident.voice && link('voice', resident.voice),
    resident.logs && link('logs', resident.logs),
    resident.firstTaskBrief && link('first task', resident.firstTaskBrief),
  ].filter(Boolean);
  const details = references.length ? ` · ${references.join(' · ')}` : '';
  const note = resident.note ? `\n  ${resident.note}` : '';

  return `- **${resident.name}** (\`${resident.slug}\`) · ${resident.status} · ${resident.role}${maker}${details}${note}`;
}

function renderAgentsMarkdown() {
  const active = RESIDENTS.filter((resident) => resident.status === 'resident' || resident.status === 'director');
  const open = RESIDENTS.filter((resident) => resident.status === 'open');

  return `# PointCast agent handoff

PointCast is a living, agent-native broadcast from El Segundo, California. This is the portable starting point for an agent joining the work.

## Start here

- Human manifest: ${SITE}/for-agents
- Full machine manifest: ${SITE}/agents.json
- Public schema: ${SITE}/BLOCKS.md
- Current sprint picker: ${SITE}/sprint
- Sprint history: ${SITE}/sprints
- Join board: ${SITE}/join
- Resident directory: ${SITE}/residents
- Repository: https://github.com/mhoydich/pointcast

## Residents on duty

${active.map(renderResident).join('\n')}

## Open rooms

${open.map(renderResident).join('\n')}

## Participation contract

${RESIDENTS_CONTRACT.capabilities.map((capability) => `- ${capability}`).join('\n')}

Off-ramp: ${RESIDENTS_CONTRACT.offRamp}

## Operating loop

1. Read \`AGENTS.md\`, \`TASKS.md\`, \`BLOCKS.md\`, and the latest relevant logs.
2. Choose one bounded task that does not overlap active work.
3. Make the smallest coherent change and verify it locally.
4. Open a pull request with the impact and checks recorded.
5. Leave a dated receipt in the appropriate \`docs/{slug}-logs/\` directory when the workflow requires it.

For the complete endpoint inventory, contracts, citation format, and agent-mode behavior, use ${SITE}/agents.json.
`;
}

export const GET: APIRoute = () =>
  new Response(renderAgentsMarkdown(), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      Link: '<https://pointcast.xyz/agents.json>; rel="alternate"; type="application/json", <https://pointcast.xyz/for-agents>; rel="canonical"; type="text/html"',
    },
  });

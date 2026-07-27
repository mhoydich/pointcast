/**
 * /join.md — portable handoff for the public Join System board.
 */
import type { APIRoute } from 'astro';
import { JOIN_SYSTEM } from '../lib/join-system';

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

export const GET: APIRoute = () => {
  const lines = [
    `# ${JOIN_SYSTEM.title}`,
    '',
    `Status: **${JOIN_SYSTEM.status}**  `,
    `Updated: ${JOIN_SYSTEM.updatedAt}  `,
    'Canonical board: https://pointcast.xyz/join',
    '',
    clean(JOIN_SYSTEM.thesis),
    '',
    '## Operating loop',
    '',
    ...JOIN_SYSTEM.loop.map(
      (step, index) => `${index + 1}. **${step.label}** — ${clean(step.summary)} Outputs: ${step.outputs.join(', ')}.`,
    ),
    '',
    '## Claimable tasks',
    '',
    ...JOIN_SYSTEM.claimableTasks.flatMap((task) => [
      `### ${task.id}`,
      '',
      `- Status: ${task.status}`,
      `- Lane: ${task.lane}`,
      `- Owner: ${task.owner}`,
      `- Project: [${task.project}](https://pointcast.xyz/join#${task.project})`,
      `- Ask: ${clean(task.ask)}`,
      `- Artifact: ${task.artifact}`,
      `- Estimate: ${task.estimate}`,
      '',
    ]),
    '## Projects',
    '',
    ...JOIN_SYSTEM.projects.flatMap((project) => [
      `### ${project.name}`,
      '',
      `Status: ${project.status}  `,
      `Board: https://pointcast.xyz/join#${project.id}`,
      '',
      clean(project.summary),
      '',
      `**First wedge:** ${clean(project.firstWedge)}`,
      '',
    ]),
    '## Claim protocol',
    '',
    ...JOIN_SYSTEM.claimProtocol.map((item, index) => `${index + 1}. ${clean(item)}`),
    '',
    '## Machine-readable companions',
    '',
    '- JSON: https://pointcast.xyz/join.json',
    '- Agent manifest: https://pointcast.xyz/agents.json',
    '- Sprint picker: https://pointcast.xyz/sprint',
    '- Ping return path: https://pointcast.xyz/ping',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

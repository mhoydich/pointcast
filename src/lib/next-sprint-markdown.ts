import type { NextSprint } from './next-sprint';

export function renderNextSprintMarkdown(sprint: NextSprint): string {
  const lines = [
    `# ${sprint.title}`,
    '',
    `Status: ${sprint.status} · Owner: ${sprint.owner} · Horizon: ${sprint.horizon}`,
    '',
    sprint.goal,
    '',
    '## Scoreboard',
    '',
    ...sprint.scoreboard.map((item) => `- ${item.label}: ${item.target} ${item.unit}`),
    '',
    '## Lanes',
    '',
  ];

  for (const lane of sprint.lanes) {
    lines.push(`### ${lane.label} — ${lane.owner}`, '', lane.target, '');
    lines.push(...lane.tasks.map((task) => `- ${task}`), '');
  }

  lines.push('## Checkpoints', '');
  for (const day of sprint.days) {
    lines.push(`- **${day.label} — ${day.title}:** ${day.deliverable}`);
  }

  lines.push('', '## Shipping gates', '', ...sprint.gates.map((gate) => `- ${gate}`));
  lines.push('', '## Next builds', '');
  for (const build of sprint.nextBuilds) {
    lines.push(`- **${build.title}** (~${build.estMin}m): ${build.output}`);
  }

  lines.push(
    '',
    '## Links',
    '',
    `- Human board: ${sprint.human}`,
    `- JSON: ${sprint.json}`,
    `- Shrine gallery: ${sprint.related.operatingBoard}`,
    `- Builder: ${sprint.related.builder}`,
    `- Manifest: ${sprint.related.manifest}`,
    '',
  );

  return lines.join('\n');
}

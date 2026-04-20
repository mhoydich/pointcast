/**
 * /sprints.json — machine-readable autonomous sprint log.
 *
 * Same data /sprints renders. cc-attributable, agent-readable.
 */
import type { APIRoute } from 'astro';
import { readAllRecaps, summary } from '../lib/sprint-recap';

export const GET: APIRoute = async () => {
  const recaps = readAllRecaps();
  const stats = summary(recaps);

  const payload = {
    $schema: 'https://pointcast.xyz/sprints.json',
    name: 'PointCast autonomous sprint log',
    description: 'Every sprint cc has shipped via cron tick or chat tick. Source: docs/sprints/{date}-{slug}.md.',
    generatedAt: new Date().toISOString(),
    summary: stats,
    sprints: recaps.map((r) => ({
      sprintId: r.sprintId,
      fileSlug: r.fileSlug,
      firedAt: r.firedAt,
      trigger: r.trigger ?? null,
      durationMin: r.durationMin ?? null,
      shippedAs: r.shippedAs ?? null,
      status: r.status ?? null,
      title: r.title,
      sections: r.sections,
      anchor: `https://pointcast.xyz/sprints#${r.sprintId}`,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

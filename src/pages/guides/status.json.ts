import type { APIRoute } from 'astro';
import { CATEGORIES, GUIDES, INTERN_ASSIGNMENTS } from '../../data/guides';
import { buildIntakeFeed } from '../../data/guides/intake';
import { CHANGELOG, ROADMAP } from '../../data/guides/roadmap';

export const GET: APIRoute = () => {
  const feed = buildIntakeFeed();
  const tasks = feed.tasks as { agentFriendly?: boolean }[];
  const body = {
    name: 'PointCast Guides status',
    url: 'https://pointcast.xyz/guides/status',
    note: 'Roadmap items marked now/next/later are proposed plans, not commitments.',
    headline: {
      guides: GUIDES.length,
      categories: CATEGORIES.length,
      openSeats: GUIDES.filter((g) => g.seat === 'open').length,
      internAssignments: INTERN_ASSIGNMENTS.length,
      botTasks: feed.taskCount,
      agentFriendlyTasks: tasks.filter((t) => t.agentFriendly).length,
    },
    live: 'https://pointcast.xyz/api/guides/intake',
    roadmap: ROADMAP,
    changelog: CHANGELOG,
    generatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};

/**
 * /resources.json - machine-readable companion to /resources.
 */
import type { APIRoute } from 'astro';
import {
  RESOURCE_GROUPS,
  RESOURCE_LAST_CHECKED,
  RESOURCE_PRINCIPLES,
  RESOURCE_RECIPES,
  getAllResources,
} from '../lib/resources';

export const GET: APIRoute = async () => {
  const resources = getAllResources();

  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    site: 'https://pointcast.xyz',
    humanUrl: 'https://pointcast.xyz/resources',
    checkedAt: RESOURCE_LAST_CHECKED,
    total: resources.length,
    groups: RESOURCE_GROUPS.map((group) => ({
      id: group.id,
      code: group.code,
      name: group.name,
      note: group.note,
      count: group.resources.length,
      resources: group.resources,
    })),
    recipes: RESOURCE_RECIPES,
    principles: RESOURCE_PRINCIPLES,
    related: {
      aiStack: 'https://pointcast.xyz/ai-stack',
      techStack: 'https://pointcast.xyz/stack',
      agents: 'https://pointcast.xyz/agents.json',
      forAgents: 'https://pointcast.xyz/for-agents',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

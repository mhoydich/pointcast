import type { APIRoute } from 'astro';
import { getPointcastApp } from '../lib/pointcast-apps';

export const GET: APIRoute = () => {
  const app = getPointcastApp('adventure-networks')!;
  const payload = {
    $schema: 'https://pointcast.xyz/schemas/adventure-networks-v1.json',
    name: app.name,
    description: app.description,
    canonical: 'https://pointcast.xyz/adventure-networks',
    fieldGuide: app.url,
    status: 'live',
    access: 'public',
    builtWith: 'Qwen 3.7 Plus',
    method: ['Seed', 'Traverse', 'Return'],
    nodes: ['People', 'Places', 'Signals', 'Skills', 'Missions'],
    capabilities: [
      'deterministic route composer',
      'interactive pack checklist',
      'session field log',
      'shareable dispatch',
      'Markdown dispatch export',
      'filterable field protocols',
      'copyable organizing templates',
    ],
    protocols: ['Signal Fire', 'Local Oracle', 'Moving Camp', 'Skill Swap', 'Threshold Walk', 'Return Gift'],
    privacy: {
      accountRequired: false,
      locationTracking: false,
      externalRuntimeApi: false,
      notes: 'Field notes stay in the current browser session unless downloaded by the visitor.',
    },
    discovery: {
      apps: 'https://pointcast.xyz/apps.json',
      explore: 'https://pointcast.xyz/explore.json',
      llms: 'https://pointcast.xyz/llms.txt',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};

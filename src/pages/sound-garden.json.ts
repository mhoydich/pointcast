import type { APIRoute } from 'astro';
import { getPointcastApp } from '../lib/pointcast-apps';

export const GET: APIRoute = () => {
  const app = getPointcastApp('sound-garden')!;
  const payload = {
    $schema: 'https://pointcast.xyz/schemas/sound-garden-v1.json',
    name: app.name,
    description: app.description,
    canonical: 'https://pointcast.xyz/sound-garden',
    instrument: app.url,
    status: 'live',
    access: 'public',
    generation: {
      mode: 'browser-native generative synthesis',
      externalModelCalls: false,
      microphoneAccess: false,
      sourceAudioUpload: false,
    },
    controls: [
      { name: 'warmth', range: [0, 100], meaning: 'dark to luminous' },
      { name: 'roughness', range: [0, 100], meaning: 'pure to weathered' },
      { name: 'motion', range: [0, 100], meaning: 'still to orbiting' },
      { name: 'surprise', range: [0, 100], meaning: 'familiar to uncanny' },
    ],
    seeds: ['Tender current', 'Glass orchard', 'Radio moss', 'Soft machine'],
    capabilities: ['real-time Web Audio synthesis', 'controlled mutation', 'slow evolution', 'browser-local recording download'],
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

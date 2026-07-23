import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://pointcast.xyz/schemas/sunset-switchboard-v1.json',
    name: 'Sunset Switchboard',
    description: 'A public signal instrument for the hour when El Segundo changes color.',
    canonical: 'https://pointcast.xyz/sunset-switchboard',
    status: 'live',
    access: 'public',
    channel: 'CH.ESC',
    block: 'https://pointcast.xyz/b/0487',
    controls: {
      sky: ['Marine Layer', 'Golden Hour', 'Afterglow', 'Night Shift'],
      band: ['Neighborhood', 'Dream', 'Civic', 'Emergency'],
      reach: ['Right Here', 'Boulevard', 'Coast', 'Orbit'],
    },
    capabilities: [
      'responsive CSS signal tower',
      'generated broadcast messages',
      'browser-local transmission log',
      'Web Share handoff with clipboard fallback',
      '1200 by 630 PNG signal-card export',
      'keyboard transmission with the Space key',
    ],
    privacy: {
      accountRequired: false,
      telemetryAddedForThisInstrument: false,
      serverStorage: false,
      browserStorage: 'Up to six recent transmissions are stored in localStorage on this device.',
    },
    image: 'https://pointcast.xyz/images/sunset-switchboard/og.png',
    discovery: {
      apps: 'https://pointcast.xyz/apps.json',
      blocks: 'https://pointcast.xyz/blocks.json',
      llms: 'https://pointcast.xyz/llms.txt',
      sitemap: 'https://pointcast.xyz/sitemap-discovery.xml',
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

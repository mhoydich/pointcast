import type { APIRoute } from 'astro';
import { COMMON_HOURS_RITUALS, COMMON_HOURS_URL } from '../lib/common-hours';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Common Hours on PointCast',
  canonical: COMMON_HOURS_URL,
  human: 'https://pointcast.xyz/common-hours',
  updated: '2026-07-19',
  status: 'live',
  access: 'public',
  purpose: 'A living index of small daily rituals shared across PointCast and its satellites.',
  capabilities: [
    'open the Common Hours field guide',
    `browse ${COMMON_HOURS_RITUALS.length} ritual doors`,
    'ring browser-native bells and chimes',
    'discover human and machine-readable PointCast surfaces',
  ],
  discovery: {
    apps: 'https://pointcast.xyz/apps.json',
    explore: 'https://pointcast.xyz/explore.json',
    llms: 'https://pointcast.xyz/llms.txt',
  },
  rituals: COMMON_HOURS_RITUALS.map((ritual) => ({
    ...ritual,
    url: ritual.path.startsWith('http') ? ritual.path : `https://pointcast.xyz${ritual.path}`,
  })),
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
  },
});

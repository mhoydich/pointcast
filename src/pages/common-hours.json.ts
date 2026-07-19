import type { APIRoute } from 'astro';
import { COMMON_HOURS_RITUALS, COMMON_HOURS_URL } from '../lib/common-hours';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Common Hours on PointCast',
  canonical: COMMON_HOURS_URL,
  human: 'https://pointcast.xyz/common-hours',
  updated: '2026-07-19',
  rituals: COMMON_HOURS_RITUALS.map((ritual) => ({
    ...ritual,
    url: ritual.path.startsWith('http') ? ritual.path : `https://pointcast.xyz${ritual.path}`,
  })),
}, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
});

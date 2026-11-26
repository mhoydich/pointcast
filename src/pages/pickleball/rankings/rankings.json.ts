import type { APIRoute } from 'astro';
import { TIERS, SOURCES, BASE, tierStatus, tierRows, LINK_ONLY_HOSTS } from '../../../lib/pickleball-rankings/data.mjs';

const tier = (t: any, status: any) => ({
  key: t.key, label: t.label, scope: t.scope, as_of: t.as_of,
  status: status.available ? 'available' : 'unavailable', reason: status.reason ?? null,
  feeds: t.feeds.map((f: any) => ({ feed_id: f.feed_id, name: f.name, scale: f.scale, country: f.country, as_of: f.as_of, upstream: f.upstream?.feed ?? null })),
  events: t.events.map((e: any) => ({ id: e.id, name: e.name, organizer: e.organizer, start_date: e.start_date, end_date: e.end_date, city: e.city, country: e.country, sources: e.sources })),
  players: status.available || t.key.startsWith('national') ? tierRows(t) : [],
});

export const GET: APIRoute = () => new Response(JSON.stringify({
  about: 'PointCast pickleball rankings, preview. Court Rating over public, organizer-published results. Method: https://pointcast.xyz/pickleball/rankings/method/. Missing values are null with status unavailable, never zero.',
  preview: true,
  as_of: TIERS.as_of,
  recipe: 'https://github.com/mhoydich/pointcast/blob/main/src/lib/pickleball-rankings/rating.js',
  link_only_hosts: LINK_ONLY_HOSTS,
  sources_verdict: SOURCES.verdict,
  tiers: {
    national: tier(TIERS.national, tierStatus('national')),
    global: tier(TIERS.global, tierStatus('global')),
    regional: TIERS.regional.map((t: any) => tier(t, { available: true })),
  },
  level_view: `${BASE}level/{band}/ filters the national tier by the level field.`,
}, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex' } });

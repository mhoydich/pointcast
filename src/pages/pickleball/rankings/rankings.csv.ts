import type { APIRoute } from 'astro';
import { TIERS, tierRows, csv } from '../../../lib/pickleball-rankings/data.mjs';

const COLS = ['tier', 'rank', 'slug', 'name', 'court_rating', 'band', 'level', 'tag', 'results_counted', 'weight', 'feeds', 'url'];
export const GET: APIRoute = () => {
  const rows = [TIERS.national, ...TIERS.regional].flatMap((t: any) => tierRows(t).map((r) => ({ tier: t.key, ...r })));
  return new Response(csv(rows, COLS), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex' } });
};

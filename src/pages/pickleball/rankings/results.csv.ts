import type { APIRoute } from 'astro';
import { TIERS, csv, nameOf } from '../../../lib/pickleball-rankings/data.mjs';

// Every team finish in the global pool, with its source, so anyone can rerun the recipe.
const COLS = ['event_id', 'event_name', 'organizer', 'end_date', 'city', 'country', 'division', 'category', 'skill_level', 'age_bracket', 'place', 'draw_size', 'player_1', 'player_2', 'source_url'];
export const GET: APIRoute = () => {
  const ev = new Map(TIERS.global.events.map((e: any) => [e.id, e]));
  const people = new Map(TIERS.global.players.map((p: any) => [p.id, p.name]));
  const who = (id: string | null) => (id ? people.get(id) ?? nameOf(id) : 'left out by request');
  const rows: any[] = [];
  const seen = new Set();
  for (const p of TIERS.global.players) for (const r of p.results) {
    if (seen.has(r.row)) continue; seen.add(r.row);
    const e: any = ev.get(r.row.event_id);
    rows.push({ event_id: e.id, event_name: e.name, organizer: e.organizer, end_date: e.end_date, city: e.city, country: e.country, division: r.row.division, category: r.row.category, skill_level: r.row.skill_level, age_bracket: r.row.age_bracket, place: r.row.place, draw_size: r.row.draw_size, player_1: who(r.row.team[0]), player_2: r.row.team.length > 1 ? who(r.row.team[1]) : 'singles', source_url: r.row.source_url });
  }
  return new Response(csv(rows, COLS), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex' } });
};

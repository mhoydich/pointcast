import type { APIRoute } from 'astro';
import { CITATIONS, COASTAL_SITES, OCEAN_PRACTICES, PRINCIPLES, SMALL_INTERVENTIONS, TIDE_SURF_REALITIES, TRACK_META } from '../lib/oceanWing';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/ocean-wing.json',
    name: TRACK_META.title, subtitle: TRACK_META.subtitle, thesis: TRACK_META.thesis,
    paperNumber: TRACK_META.paperNumber, date: TRACK_META.date, authors: TRACK_META.authors,
    principles: PRINCIPLES, sites: COASTAL_SITES, realities: TIDE_SURF_REALITIES,
    practices: OCEAN_PRACTICES, civicInterventions: SMALL_INTERVENTIONS, citations: CITATIONS,
    counts: { sites: COASTAL_SITES.length, realities: TIDE_SURF_REALITIES.length, practices: OCEAN_PRACTICES.length, principles: PRINCIPLES.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/ocean-wing', parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { ues: 'https://pointcast.xyz/university-of-el-segundo', marineLayer: 'https://pointcast.xyz/marine-layer', geology: 'https://pointcast.xyz/geology', commons: 'https://pointcast.xyz/commons', commonForms: 'https://pointcast.xyz/common-forms' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
